/* ============================================================================
   Sabatino's Italian Market — site behaviour
   No dependencies. Everything here is an enhancement: with JavaScript off,
   all content is readable and both forms still submit to Formspree natively.
   ========================================================================= */

(function () {
  'use strict';

  /* --------------------------------------------------------------------------
     CONFIGURATION

     Paste your Formspree form ID below to make the contact and trade forms
     live. Get one free at https://formspree.io :

       1. Create an account and verify your email address.
       2. Click "New Form", name it (e.g. "Sabatino's Website"), and set the
          destination email address.
       3. Copy the form ID from the endpoint it gives you — in
          https://formspree.io/f/abcdwxyz the ID is the "abcdwxyz" part.
       4. Paste it between the quotes below and save this file.

     Until then the forms validate normally and then show the visitor our
     email address instead, so nothing on the site appears broken.
     ----------------------------------------------------------------------- */

  var FORMSPREE_ID = ''; // TODO: e.g. 'abcdwxyz'

  var CONTACT_EMAIL = 'hello@sabatinositalianmarket.com'; // TODO: real address

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --- Mobile navigation ------------------------------------------------- */

  function initNav() {
    var toggle = document.getElementById('nav-toggle');
    var nav = document.getElementById('site-nav');
    if (!toggle || !nav) return;

    var FOCUSABLE = 'a[href], button:not([disabled])';

    function isOpen() {
      return toggle.getAttribute('aria-expanded') === 'true';
    }

    function setOpen(open) {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      nav.classList.toggle('is-open', open);
      document.body.style.overflow = open ? 'hidden' : '';
      if (open) {
        var first = nav.querySelector(FOCUSABLE);
        if (first) first.focus();
      }
    }

    toggle.addEventListener('click', function () {
      setOpen(!isOpen());
    });

    // Escape closes and returns focus to the button that opened it.
    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape' || !isOpen()) return;
      setOpen(false);
      toggle.focus();
    });

    // Keep focus inside the open menu.
    nav.addEventListener('keydown', function (event) {
      if (event.key !== 'Tab' || !isOpen()) return;
      var items = Array.prototype.slice.call(nav.querySelectorAll(FOCUSABLE));
      if (!items.length) return;
      var first = items[0];
      var last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        toggle.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        toggle.focus();
      }
    });

    // Reset when the viewport grows past the mobile breakpoint.
    window.matchMedia('(min-width: 861px)').addEventListener('change', function (event) {
      if (event.matches && isOpen()) setOpen(false);
    });
  }

  /* --- Header shadow on scroll ------------------------------------------- */

  function initHeader() {
    var header = document.querySelector('.site-header');
    if (!header) return;

    var update = function () {
      header.classList.toggle('is-stuck', window.scrollY > 8);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
  }

  /* --- Scroll reveal ----------------------------------------------------- */

  function initReveal() {
    var targets = document.querySelectorAll('.js-reveal');
    if (!targets.length) return;

    // Bail out entirely if motion is unwelcome or the API is missing: the
    // elements then keep their default, fully visible styling.
    if (prefersReducedMotion || !('IntersectionObserver' in window)) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

    Array.prototype.forEach.call(targets, function (el, index) {
      el.classList.add('reveal-ready');
      el.style.transitionDelay = Math.min(index % 4, 3) * 90 + 'ms';
      observer.observe(el);
    });
  }

  /* --- Sourcing map: link region rows to their pins ---------------------- */

  function initMap() {
    var regions = document.querySelectorAll('[data-region]');
    if (!regions.length) return;

    Array.prototype.forEach.call(regions, function (region) {
      var pin = document.getElementById('pin-' + region.getAttribute('data-region'));
      if (!pin) return;

      var activate = function () { pin.classList.add('is-active'); };
      var deactivate = function () { pin.classList.remove('is-active'); };

      region.addEventListener('mouseenter', activate);
      region.addEventListener('mouseleave', deactivate);
      region.addEventListener('focusin', activate);
      region.addEventListener('focusout', deactivate);
    });
  }

  /* --- Forms ------------------------------------------------------------- */

  var EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function validateField(field) {
    var input = field.querySelector('input, select, textarea');
    var error = field.querySelector('.field__error');
    if (!input || !error) return true;

    var value = (input.value || '').trim();
    var message = '';

    if (input.required && !value) {
      message = error.getAttribute('data-empty') || 'This field is required.';
    } else if (value && input.type === 'email' && !EMAIL_PATTERN.test(value)) {
      message = 'Please enter a valid email address.';
    }

    error.textContent = message;
    error.classList.toggle('is-shown', Boolean(message));
    if (message) {
      input.setAttribute('aria-invalid', 'true');
    } else {
      input.removeAttribute('aria-invalid');
    }
    return !message;
  }

  function initForms() {
    var forms = document.querySelectorAll('.form[data-form]');

    Array.prototype.forEach.call(forms, function (form) {
      var fields = Array.prototype.slice.call(form.querySelectorAll('.field'));
      var submit = form.querySelector('[type="submit"]');
      var status = document.getElementById(form.getAttribute('data-status'));

      // Point the form at Formspree so it also works without JavaScript.
      if (FORMSPREE_ID) {
        form.setAttribute('action', 'https://formspree.io/f/' + FORMSPREE_ID);
        form.setAttribute('method', 'POST');
      }

      // Clear an error as soon as the visitor fixes the field.
      fields.forEach(function (field) {
        var input = field.querySelector('input, select, textarea');
        if (!input) return;
        input.addEventListener('blur', function () { validateField(field); });
        input.addEventListener('input', function () {
          if (input.getAttribute('aria-invalid') === 'true') validateField(field);
        });
      });

      form.addEventListener('submit', function (event) {
        event.preventDefault();

        var invalid = fields.filter(function (field) { return !validateField(field); });
        if (invalid.length) {
          var firstBad = invalid[0].querySelector('input, select, textarea');
          if (firstBad) firstBad.focus();
          return;
        }

        if (!FORMSPREE_ID) {
          showStatus(form, status, 'fallback');
          return;
        }

        var original = submit ? submit.textContent : '';
        if (submit) {
          submit.disabled = true;
          submit.textContent = 'Sending…';
        }

        fetch('https://formspree.io/f/' + FORMSPREE_ID, {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body: new FormData(form)
        })
          .then(function (response) {
            if (!response.ok) throw new Error('Formspree responded ' + response.status);
            showStatus(form, status, 'success');
          })
          .catch(function () {
            if (submit) {
              submit.disabled = false;
              submit.textContent = original;
            }
            showStatus(form, status, 'error', true);
          });
      });
    });
  }

  // Swap the form for a confirmation panel, or reveal an error above it.
  function showStatus(form, status, kind, keepForm) {
    if (!status) return;

    var heading = status.querySelector('[data-status-heading]');
    var message = status.querySelector('[data-status-message]');

    var copy = {
      success: {
        title: 'Grazie.',
        body: 'Your message has reached us. Someone from the house will reply within one business day.'
      },
      fallback: {
        title: 'Grazie.',
        body: 'Thank you for your interest. So that we can reply personally, please write to us '
          + 'directly at ' + CONTACT_EMAIL + ' and we will respond within one business day.'
      },
      error: {
        title: 'That did not send.',
        body: 'Something went wrong on our end. Please write to us at ' + CONTACT_EMAIL
          + ' and we will pick the conversation up there.'
      }
    }[kind];

    if (heading) heading.textContent = copy.title;
    if (message) {
      message.innerHTML = '';
      message.appendChild(document.createTextNode(copy.body.split(CONTACT_EMAIL)[0]));
      if (copy.body.indexOf(CONTACT_EMAIL) > -1) {
        var link = document.createElement('a');
        link.href = 'mailto:' + CONTACT_EMAIL;
        link.textContent = CONTACT_EMAIL;
        message.appendChild(link);
        message.appendChild(document.createTextNode(copy.body.split(CONTACT_EMAIL)[1] || ''));
      }
    }

    status.classList.toggle('form-status--error', kind === 'error');
    status.classList.add('is-shown');
    if (!keepForm) form.hidden = true;

    status.setAttribute('tabindex', '-1');
    status.focus();
    status.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'center' });
  }

  /* --- Boot -------------------------------------------------------------- */

  function init() {
    initNav();
    initHeader();
    initReveal();
    initMap();
    initForms();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
