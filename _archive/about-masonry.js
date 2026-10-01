'use strict';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

document.addEventListener('DOMContentLoaded', () => {
  
  // 1. Initial Page Fade In
  gsap.to('#page', { opacity: 1, duration: 0.5 });

  // 2. SVG JX Logo Draw Animation
  const svgText = document.querySelector('.logo-text');
  if (svgText) {
    const tl = gsap.timeline();
    tl.to(svgText, {
      strokeDashoffset: 0,
      duration: 2.5,
      ease: "power2.inOut"
    })
    .to(svgText, {
      fill: "var(--white)",
      stroke: "transparent",
      duration: 0.5
    });
  }

  // 3. ScrollTrigger Masonry Entrance
  // The central logo block is already visible. 
  // We want the other blocks to slide up and lock in as you scroll.
  
  const cells = [
    document.getElementById('cell-origin'),
    document.getElementById('cell-arsenal'),
    document.getElementById('cell-philosophy'),
    document.getElementById('cell-transmission')
  ];

  // Set initial state
  cells.forEach(cell => {
    if (cell) {
      gsap.set(cell, { y: 100, opacity: 0 });
    }
  });

  // Stagger them in as the masonry grid enters viewport
  ScrollTrigger.create({
    trigger: "#masonry-grid",
    start: "top 80%",
    onEnter: () => {
      gsap.to(cells, {
        y: 0,
        opacity: 1,
        duration: 1,
        stagger: 0.15,
        ease: "power3.out",
        overwrite: true
      });
    }
  });

  // 4. Smooth scroll to anchor sections
  document.querySelectorAll('.m-cell[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        gsap.to(window, {
          scrollTo: { y: target, offsetY: 80 },
          duration: 1,
          ease: "power3.inOut"
        });
      }
    });
  });

  // 5. Fade in Editorial Cards on scroll (Intersection Observer)
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

  document.querySelectorAll('.ed-card, .ed-header').forEach(el => {
    gsap.set(el, { y: 30, opacity: 0 });
    observer.observe(el);
  });

  // 6. Fetch Supabase Logos
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
      .order('priority', { ascending: false });
      
    if (error) throw error;

    if (!data || data.length === 0) {
      container.innerHTML = '<div style="color:var(--gray-3); font-family:var(--font-mono);">No allies listed in the vault yet. Add them in Admin.</div>';
      return;
    }

    const logos = data.filter(d => d.logo_url);

    if (logos.length === 0) {
      container.innerHTML = '<div style="color:var(--gray-3); font-family:var(--font-mono);">Add logo uploads to your experience in Admin.</div>';
      return;
    }

    container.innerHTML = '';
    logos.forEach(logo => {
      const el = document.createElement('div');
      el.className = 'company-logo-item';
      
      const inner = `<img src="${logo.logo_url}" alt="${logo.company || 'Client'}">`;
      
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
