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


  /* ---- Global Styles (Injected Dynamically) ---- */
  async function initGlobalStyles() {
    if (!window.initSupabase || !window.supabaseClient) return;
    await window.initSupabase();

    try {
      const { data, error } = await window.supabaseClient
        .from('site_settings')
        .select('global_styles, navigation_settings')
        .limit(1)
        .single();
      
      if (data) {
        if (data.global_styles) applyGlobalStyles(data.global_styles);
        if (data.navigation_settings) applyNavigationSettings(data.navigation_settings);
      }
    } catch (err) {
      console.warn("Could not load global styles:", err);
    }
  }

  
  function applyNavigationSettings(nav) {
    if (!nav) return;
    
    // 1. Header Navigation Links
    const deskNav = document.querySelector('.nav-links');
    const mobNav = document.querySelector('.mobile-nav-links');
    
    const linksHtml = (nav.links || [])
      .filter(l => l.visible)
      .map(l => `<li><a href="${l.url}" class="nav-link">${l.label}</a></li>`)
      .join('');
      
    if (deskNav) deskNav.innerHTML = linksHtml;
    if (mobNav) mobNav.innerHTML = linksHtml;
    
    // 2. CTA Button
    if (nav.cta) {
      const ctas = document.querySelectorAll('.nav-cta, .mobile-cta');
      ctas.forEach(btn => {
        btn.textContent = nav.cta.label;
        btn.href = nav.cta.url;
        btn.className = btn.classList.contains('mobile-cta') ? 'btn-neon mobile-cta' : 'btn-neon nav-cta'; // Reset
        if (nav.cta.style === 'ghost') {
          btn.classList.remove('btn-neon');
          btn.classList.add('btn-outline');
        }
      });
    }
    
    // 3. Footer
    if (nav.footer) {
      const tagline = document.querySelector('.footer-tagline');
      const copy = document.querySelector('.footer-copy');
      const easter = document.querySelector('.footer-easter-egg');
      const socContainer = document.getElementById('footer-social-links');
      const footerNav = document.querySelector('.footer-center .footer-links');
      
      if (tagline) tagline.textContent = nav.footer.tagline || '';
      if (copy) copy.innerHTML = (nav.footer.copyright || '').replace(/\n/g, '<br/>');
      if (easter) easter.innerHTML = (nav.footer.builtWith || '').replace(/\n/g, '<br/>');
      
      if (socContainer && nav.footer.social) {
        socContainer.innerHTML = nav.footer.social
          .filter(s => s.visible)
          .map(s => `<li><a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.platform}</a></li>`)
          .join('');
      }
      
      if (footerNav) {
        footerNav.innerHTML = (nav.links || [])
          .filter(l => l.visible)
          .map(l => `<li><a href="${l.url}">${l.label}</a></li>`)
          .join('');
      }
    }
    
    // 4. Pages (SEO & Coming Soon)
    if (nav.pages) {
      const currentPath = window.location.pathname;
      let matchedPage = nav.pages.find(p => currentPath.endsWith(p.slug) || (p.slug === '/' && currentPath.endsWith('index.html')));
      
      // Fallback for root "/"
      if (!matchedPage && (currentPath === '/' || currentPath === '')) {
         matchedPage = nav.pages.find(p => p.slug === '/');
      }
      
      if (matchedPage) {
        // SEO Updates
        if (matchedPage.title) document.title = matchedPage.title;
        
        if (matchedPage.desc) {
          let metaDesc = document.querySelector('meta[name="description"]');
          if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.name = 'description';
            document.head.appendChild(metaDesc);
          }
          metaDesc.content = matchedPage.desc;
        }
        
        if (matchedPage.image) {
          let metaOg = document.querySelector('meta[property="og:image"]');
          if (!metaOg) {
            metaOg = document.createElement('meta');
            metaOg.setAttribute('property', 'og:image');
            document.head.appendChild(metaOg);
          }
          metaOg.content = matchedPage.image;
        }
        
        // Coming Soon Overlay
        if (matchedPage.comingSoon && !window.location.pathname.includes('admin')) {
          const overlay = document.createElement('div');
          overlay.style.position = 'fixed';
          overlay.style.top = '0';
          overlay.style.left = '0';
          overlay.style.width = '100vw';
          overlay.style.height = '100vh';
          overlay.style.backgroundColor = 'rgba(0,0,0,0.85)';
          overlay.style.backdropFilter = 'blur(15px)';
          overlay.style.zIndex = '999999';
          overlay.style.display = 'flex';
          overlay.style.flexDirection = 'column';
          overlay.style.alignItems = 'center';
          overlay.style.justifyContent = 'center';
          overlay.style.color = 'white';
          overlay.style.fontFamily = 'var(--font-mono, monospace)';
          
          overlay.innerHTML = `
            <h1 style="font-size:3rem; margin-bottom:1rem; color:var(--neon, #39ff14);">${matchedPage.name}</h1>
            <p style="font-size:1.2rem; opacity:0.7;">This page is currently under construction.</p>
            <a href="index.html" style="margin-top:2rem; padding:10px 20px; border:1px solid var(--neon, #39ff14); color:var(--neon, #39ff14); text-decoration:none; border-radius:4px;">Return Home</a>
          `;
          
          document.body.appendChild(overlay);
          document.body.style.overflow = 'hidden';
        }
      }
    }
    
    // Re-highlight active links after dynamic injection
    highlightActiveLink();
  }

  function applyGlobalStyles(styles) {
    if (!styles || typeof styles !== 'object') return;
    
    // 1. Dynamic CSS Variables
    let styleTag = document.getElementById('dynamic-global-styles');
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'dynamic-global-styles';
      document.head.appendChild(styleTag);
    }

    const cssVars = `
      :root {
        ${styles.primary_color ? `--neon: ${styles.primary_color};` : ''}
        ${styles.primary_color ? `--cursor-color: ${styles.primary_color};` : ''}
        ${styles.bg_color ? `--black: ${styles.bg_color};` : ''}
        ${styles.bg_color ? `--footer-bg: ${styles.bg_color};` : ''}
        ${styles.bg_secondary ? `--dark: ${styles.bg_secondary};` : ''}
        ${styles.font_heading ? `--font-display: '${styles.font_heading}', sans-serif;` : ''}
        ${styles.font_body ? `--font-body: '${styles.font_body}', sans-serif;` : ''}
        ${styles.font_mono ? `--font-mono: '${styles.font_mono}', monospace;` : ''}
      }
      
      body {
        ${styles.bg_color ? `background: ${styles.bg_color};` : ''}
      }

      .hero {
        ${styles.bg_color ? `background: ${styles.bg_color};` : ''}
      }

      section {
        ${styles.section_padding ? `padding: ${styles.section_padding}px 60px;` : ''}
      }
      
      @media (max-width: 768px) {
        section {
          ${styles.section_padding ? `padding: ${Math.floor(styles.section_padding * 0.6)}px 20px;` : ''}
        }
      }
      
      .work-card, .service-card, .stat, .ap-card {
        ${styles.border_radius ? `border-radius: ${styles.border_radius}px;` : ''}
      }

      ${styles.cursor_style === 'None' ? `
        #cursor, #cursor-follower { display: none !important; }
        body, a, button, input, textarea, select, label { cursor: auto !important; }
      ` : ''}
      
      ${styles.cursor_style === 'Ring only' ? `
        #cursor { display: none !important; }
      ` : ''}
    `;

    styleTag.innerHTML = cssVars;

    // 2. Google Fonts Injection
    injectGoogleFont(styles.font_heading);
    injectGoogleFont(styles.font_body);
    injectGoogleFont(styles.font_mono);

    // 3. Effects & State
    if (styles.default_mode === 'Light' && !localStorage.getItem('theme')) {
       document.body.classList.add('light');
    }
    
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn && styles.allow_visitor_toggle === false) {
      themeBtn.style.display = 'none';
    }

    // 4. Expose styles to global window for other scripts to use (like particles)
    window.jxGlobalStyles = styles;
    
    // Update active cursor visually if needed
    if (styles.primary_color) {
       const cursor = document.getElementById('cursor');
       const follower = document.getElementById('cursor-follower');
       if (cursor) cursor.style.background = styles.primary_color;
       if (follower) follower.style.borderColor = styles.primary_color;
    }
  }

  function injectGoogleFont(fontName) {
    if (!fontName) return;
    const fontId = 'font-' + fontName.replace(/\s+/g, '-').toLowerCase();
    if (document.getElementById(fontId)) return; // Already injected
    
    const url = `https://fonts.googleapis.com/css2?family=${fontName.replace(/\s+/g, '+')}:ital,wght@0,400;0,700;0,800;0,900;1,400;1,700&display=swap`;
    const link = document.createElement('link');
    link.id = fontId;
    link.rel = 'stylesheet';
    link.href = url;
    document.head.appendChild(link);
  }

  /* ---- Init ---- */

    async function initNav() {
    highlightActiveLink();
    initNavScroll();
    initMobileMenu();
    initThemeToggle();
    showNavImmediately();
    await initGlobalStyles();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNav);
  } else {
    initNav();
  }
})();
