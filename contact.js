/* ================================================================
   JX UNIVERSE — contact.js v3.0
   The Signal - Page specific logic & Supabase Form Submission
   ================================================================ */

'use strict';

(function () {

  function revealPage () {
    const page = document.getElementById('page');
    if (!page) return;
    if (window.gsap) {
      gsap.to(page, { opacity: 1, duration: 0.7, ease: 'power2.out' });
      const tl = gsap.timeline({ delay: 0.1 });
      tl.to('#ch-label', { opacity: 1, duration: 0.6 })
        .to('#ch-title',  { y: 0, opacity: 1, duration: 1, ease: 'expo.out' }, '-=0.3')
        .to('#ch-sub',    { opacity: 1, duration: 0.7 }, '-=0.5');
    } else {
      page.style.opacity = '1';
    }
  }

  function initScrollAnimations () {
    if (!window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);
    document.querySelectorAll('.reveal, .reveal-scale').forEach(el => {
      const isScale = el.classList.contains('reveal-scale');
      gsap.fromTo(el,
        isScale ? { opacity: 0, scale: 0.94 } : { opacity: 0, y: 40 },
        { ...(isScale ? { opacity: 1, scale: 1 } : { opacity: 1, y: 0 }),
          duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true }
        }
      );
    });
  }

  function initLenis () {
    if (!window.Lenis) return;
    if (!window.JXLenis) {
      window.JXLenis = new Lenis({ duration: 1.4, smoothWheel: true });
      const raf = t => { window.JXLenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
      if (window.ScrollTrigger) window.JXLenis.on('scroll', ScrollTrigger.update);
    }
  }

  /* Load settings from Supabase */
  async function loadSettings () {
    const textEl = document.getElementById('contact-avail-text');
    const badgeEl = document.getElementById('contact-avail');
    if (typeof supabase === 'undefined') return;

    try {
      const { data } = await supabase.from('site_settings').select('key, value');
      if (data) {
        data.forEach(row => {
          if (row.key === 'availability_status' && textEl) {
            if (row.value === 'available') {
              textEl.textContent = 'Available for Work';
            } else if (row.value === 'limited') {
              textEl.textContent = 'Limited Availability';
              if (badgeEl) badgeEl.style.borderColor = 'var(--amber)';
            } else {
              textEl.textContent = 'Currently Unavailable';
              if (badgeEl) badgeEl.style.borderColor = 'var(--gray-3)';
            }
          } else if (row.key.startsWith('social_')) {
            const platform = row.key.replace('social_', '');
            const linkEl = document.getElementById(`link-social-${platform}`);
            if (linkEl) {
              if (row.value && row.value.trim() !== '') {
                linkEl.href = row.value;
                linkEl.style.display = '';
              } else {
                linkEl.style.display = 'none';
              }
            }
          }
        });
      }
    } catch (_) {}
  }

  /* Form submission */
  function initForm () {
    const form   = document.getElementById('contact-form');
    const status = document.getElementById('form-status');
    const submit = document.getElementById('form-submit');
    if (!form) return;

    form.addEventListener('submit', async e => {
      e.preventDefault();

      const name    = document.getElementById('cf-name').value.trim();
      const email   = document.getElementById('cf-email').value.trim();
      const message = document.getElementById('cf-message').value.trim();

      if (!name || !email || !message) {
        showStatus('error', '> Missing fields. Name, email, and message are required.');
        return;
      }

      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRe.test(email)) {
        showStatus('error', '> Invalid email address.');
        return;
      }

      /* Disable form */
      submit.disabled = true;
      submit.textContent = 'Transmitting…';
      showStatus('', '');

      try {
        if (window.initSupabase) await window.initSupabase();
        if (typeof supabase === 'undefined' || !supabase.from) throw new Error('Database offline');

        const { error } = await supabase.from('contact_submissions').insert([{
          name,
          email,
          project_type: document.getElementById('cf-type').value || null,
          budget:       document.getElementById('cf-budget').value || null,
          message,
          created_at:   new Date().toISOString(),
        }]);

        if (error) throw error;

        showStatus('success', '> Signal received. I\'ll respond within 24–48 hours. Let\'s build.');
        form.reset();

      } catch (err) {
        console.error('Contact form error:', err);
        showStatus('error', '> Transmission failed. Try emailing hello@jxdesigndev.com directly.');
      } finally {
        submit.disabled = false;
        submit.textContent = 'Transmit Signal ↗';
      }
    });

    function showStatus (type, msg) {
      if (!status) return;
      status.className = 'form-status ' + type;
      status.textContent = msg;
    }
  }

  function init () {
    if (window.gsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
    revealPage();
    initScrollAnimations();
    initLenis();
    loadSettings();
    initForm();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
