#!/usr/bin/env bash
#
# Toggle the site between its custom domain and the default GitHub Pages URL.
#
#   scripts/custom-domain.sh status          show which mode the files are in
#   scripts/custom-domain.sh off [--push]    serve from cleblanc87.github.io/…
#   scripts/custom-domain.sh on  [--push]    serve from sabatinositalianmarket.com
#
# "off" deletes CNAME, which is what unbinds the domain in GitHub Pages, and
# rewrites the site's own absolute URLs (canonical, og:url, JSON-LD, sitemap,
# robots) to the github.io address. "on" restores both. Email addresses and
# the forms' _subject text are left alone — only https:// URLs are rewritten.
#
# Without --push the changes are left in the working tree for review. With
# --push they are committed and pushed to main, which redeploys the site.
# DNS records at the registrar are not touched either way.

set -euo pipefail

DOMAIN="sabatinositalianmarket.com"
PAGES_URL="https://cleblanc87.github.io/sabatinos-italian-market"
CUSTOM_URL="https://${DOMAIN}"
REPO="cleblanc87/sabatinos-italian-market"
GH_USER="cleblanc87"

cd "$(dirname "$0")/.."

FILES=(*.html sitemap.xml robots.txt)

usage() { sed -n '3,7p' "$0" | sed 's/^# \{0,1\}//'; exit 1; }

current_mode() {
  local custom pages
  custom=$(cat "${FILES[@]}" | grep -c "$CUSTOM_URL" || true)
  pages=$(cat "${FILES[@]}" | grep -c "$PAGES_URL" || true)
  if [ -f CNAME ] && [ "$pages" -eq 0 ]; then echo on
  elif [ ! -f CNAME ] && [ "$custom" -eq 0 ]; then echo off
  else echo mixed
  fi
}

rewrite() {  # rewrite FROM TO across FILES
  FROM="$1" TO="$2" perl -pi -e 's/\Q$ENV{FROM}\E/$ENV{TO}/g' "${FILES[@]}"
}

push() {
  local msg="$1"
  [ "$(git rev-parse --abbrev-ref HEAD)" = main ] \
    || { echo "Not on main; refusing to push." >&2; exit 1; }
  if command -v gh >/dev/null; then
    gh auth status --active 2>&1 | grep -q "account $GH_USER" \
      || { echo "gh is not logged in as $GH_USER; refusing to push." >&2; exit 1; }
  fi
  git add -A -- CNAME "${FILES[@]}"
  git commit -m "$msg" -- CNAME "${FILES[@]}"
  git push origin main
}

live_status() {
  command -v gh >/dev/null || return 0
  local cname
  if cname=$(gh api "repos/$REPO/pages" --jq '.cname // "(none)"' 2>/dev/null); then
    echo "GitHub Pages custom domain (live): $cname"
  fi
}

cmd="${1:-}"; flag="${2:-}"
[ -z "$flag" ] || [ "$flag" = --push ] || usage

case "$cmd" in
  status)
    echo "Files: custom domain $(current_mode)"
    live_status
    ;;

  off)
    mode=$(current_mode)
    if [ "$mode" = off ]; then echo "Already off."; exit 0; fi
    rm -f CNAME
    rewrite "$CUSTOM_URL" "$PAGES_URL"
    echo "Custom domain off: CNAME removed, URLs now point at $PAGES_URL/"
    if [ "$flag" = --push ]; then
      push "Serve from GitHub Pages URL instead of $DOMAIN"
      echo "Pushed. Pages redeploys in about a minute."
    else
      echo "Review with 'git diff', then commit and push to main to deploy."
    fi
    ;;

  on)
    mode=$(current_mode)
    if [ "$mode" = on ]; then echo "Already on."; exit 0; fi
    printf '%s\n' "$DOMAIN" > CNAME
    rewrite "$PAGES_URL" "$CUSTOM_URL"
    echo "Custom domain on: CNAME = $DOMAIN, URLs now point at $CUSTOM_URL/"
    if [ "$flag" = --push ]; then
      push "Bind the site to $DOMAIN"
      echo "Pushed. Once the certificate is issued, re-tick Enforce HTTPS in Settings → Pages."
    else
      echo "Review with 'git diff', then commit and push to main to deploy."
    fi
    ;;

  *) usage ;;
esac
