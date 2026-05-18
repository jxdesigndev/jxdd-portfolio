/* =========================================
   JX Design & Dev — Shared Navigation
   nav.js — Handles nav behavior across all pages
   ========================================= */

(function () {
  'use strict';

  /* ---- Active Link Highlighting ---- */
  function highlightActiveLink() {
    const path = window.location.pathname;
    const currentPage = path.substring(path.lastIndexOf('/') + 1) || 'index.html';

    // Map filenames to their nav link href
    const pageToHref = {
      'index.html': 'index.html',
      '': 'index.html',
      'work.html': 'work.html',
      'about.html': 'about.html',
      'services.html': 'services.html',
      'contact.html': 'contact.html',
    };

    const activeHref = pageToHref[currentPage];
    if (!activeHref) return;

    // Desktop nav links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach((link) => {
      link.classList.remove('active');
      const linkHref = link.getAttribute('href');
      if (linkHref === activeHref) {
        link.classList.add('active');
      }
    });

    // Mobile nav links
    const mobileLinks = document.querySelectorAll('.mobile-link');
    mobileLinks.forEach((link) => {
      link.classList.remove('active');
      const linkHref = link.getAttribute('href');
      if (linkHref === activeHref) {
        link.classList.add('active');
      }
    });
  }

  /* ---- Navigation Scroll Effect (glass background) ---- */
  function initNavScroll() {
    const nav = document.getElementById('nav');
    if (!nav) return;

    window.addEventListener('scroll', () => {
      if (window.scrollY > 60) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    });
  }

  /* ---- Mobile Hamburger Menu ---- */
  function initMobileMenu() {
    const navMenu = document.getElementById('nav-menu');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileLinks = document.querySelectorAll('.mobile-link');
    if (!navMenu || !mobileMenu) return;

    let isOpen = false;

    navMenu.addEventListener('click', () => {
      isOpen = !isOpen;
      navMenu.classList.toggle('open', isOpen);
      mobileMenu.classList.toggle('open', isOpen);

      if (isOpen && typeof gsap !== 'undefined') {
        gsap.fromTo(mobileLinks,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.08,
            ease: 'power3.out',
            delay: 0.15,
          }
        );
      } else if (!isOpen && typeof gsap !== 'undefined') {
        gsap.set(mobileLinks, { opacity: 0, y: 30 });
      }
    });

    // Close menu when a link is clicked
    mobileLinks.forEach((link) => {
      link.addEventListener('click', () => {
        isOpen = false;
        navMenu.classList.remove('open');
        mobileMenu.classList.remove('open');
        if (typeof gsap !== 'undefined') {
          gsap.set(mobileLinks, { opacity: 0, y: 30 });
        }
      });
    });
  }

  /* ---- Light/Dark Mode Toggle ---- */
  function initThemeToggle() {
    const themeBtn = document.getElementById('theme-toggle');
    if (!themeBtn) return;

    const themeIcon = themeBtn.querySelector('.theme-icon');

    function updateIcon(isLight) {
      if (themeIcon) {
        themeIcon.textContent = isLight ? '☀' : '◐';
      }
    }

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      document.body.classList.add('light');
      updateIcon(true);
    }

    themeBtn.addEventListener('click', () => {
      document.body.classList.toggle('light');
      const isLight = document.body.classList.contains('light');
      localStorage.setItem('theme', isLight ? 'light' : 'dark');
      updateIcon(isLight);
    });
  }

  /* ---- Make nav visible on non-home pages (no loader) ---- */
  function showNavImmediately() {
    const nav = document.getElementById('nav');
    if (!nav) return;

    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    // On non-home pages, make nav visible immediately (no loader animation)
    if (currentPage !== 'index.html' && currentPage !== '') {
      nav.style.opacity = '1';
      nav.style.transform = 'translateY(0)';
    }
  }

  /* ---- Init ---- */
  function initNav() {
    highlightActiveLink();
    initNavScroll();
    initMobileMenu();
    initThemeToggle();
    showNavImmediately();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNav);
  } else {
    initNav();
  }
})();
