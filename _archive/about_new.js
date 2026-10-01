/* ================================================================
   ABOUT PAGE - JS LOGIC
   SVG Draw, Intersection Observers, Supabase Logos
   ================================================================ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  
  // 1. Initial Page Fade In
  gsap.to('#page', { opacity: 1, duration: 0.5 });

  // 2. SVG JX Logo Draw Animation
  const svgPaths = document.querySelectorAll('.jx-svg-path');
  const svgFilled = document.querySelectorAll('.jx-svg-filled');

  const tl = gsap.timeline();
  
  // Draw the outlines
  tl.to(svgPaths, {
    strokeDashoffset: 0,
    duration: 1.8,
    ease: "power2.inOut",
    stagger: 0.2
  })
  // Flash and fill
  .to(svgFilled, {
    opacity: 1,
    duration: 0.4,
    ease: "power1.out"
  }, "-=0.3")
  // Fade out strokes so it's just the solid fill
  .to(svgPaths, {
    opacity: 0,
    duration: 0.4
  }, "-=0.4");

  // 3. Smooth Anchor Scrolling for Bento Grid
  const scrollLinks = document.querySelectorAll('[data-scroll-to]');
  scrollLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href');
      gsap.to(window, {
        duration: 1,
        scrollTo: { y: targetId, offsetY: 100 },
        ease: "power3.inOut"
      });
    });
  });

  // 4. Staggered Intersection Observer (Replacing glitchy scrolltrigger)
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        gsap.to(entry.target, {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power2.out"
        });
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

  document.querySelectorAll('.reveal-up').forEach(el => {
    // Set initial state
    gsap.set(el, { y: 30, opacity: 0 });
    observer.observe(el);
  });

  // 5. Fetch Company Logos from Supabase
  loadCompanyLogos();

});

async function loadCompanyLogos() {
  const container = document.getElementById('company-logos-container');
  if (!container) return;

  try {
    if (window.initSupabase) await window.initSupabase();
  } catch (err) {
    console.warn("Supabase init failed", err);
  }

  if (typeof window.supabase === 'undefined') {
    container.innerHTML = '<div style="color:var(--gray-3); font-family:var(--font-mono);">Supabase client not loaded.</div>';
    return;
  }

  try {
    const { data, error } = await window.supabase
      .from('experience')
      .select('*')
      .order('created_at', { ascending: true });
      
    if (error) {
      // If table doesn't exist yet, show a placeholder
      if (error.code === '42P01') {
        container.innerHTML = `
          <div class="company-logo-item"><span style="color:var(--gray-3)">Logo 1</span></div>
          <div class="company-logo-item"><span style="color:var(--gray-3)">Logo 2</span></div>
          <div class="company-logo-item"><span style="color:var(--gray-3)">Logo 3</span></div>
          <div style="grid-column: 1 / -1; margin-top: 1rem; color: var(--gold); font-family: var(--font-mono); font-size: 0.8rem;">
            * Table 'experience' not found. Run the SQL setup script in Supabase.
          </div>
        `;
        return;
      }
      throw error;
    }

    if (!data || data.length === 0) {
      container.innerHTML = '<div style="color:var(--gray-3); font-family:var(--font-mono);">No allies listed in the vault yet. Add them in Admin.</div>';
      return;
    }

    container.innerHTML = '';
    data.forEach(logo => {
      const el = document.createElement('div');
      el.className = 'company-logo-item';
      let inner = '';
      if(logo.logo_url) {
        inner = `<img src="${logo.logo_url}" alt="${logo.company || 'Client'}">`;
      } else {
        inner = `<span style="color:var(--white); font-weight:600; text-align:center;">${logo.company}</span>`;
      }
      
      if(logo.company_url) {
        el.innerHTML = `<a href="${logo.company_url}" target="_blank" rel="noopener noreferrer" style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; text-decoration:none;">${inner}</a>`;
      } else {
        el.innerHTML = inner;
      }
      container.appendChild(el);
    });

  } catch (err) {
    console.error("Error fetching logos:", err);
    container.innerHTML = '<div style="color:var(--red); font-family:var(--font-mono);">Failed to fetch vault data.</div>';
  }
}
