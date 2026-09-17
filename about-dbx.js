'use strict';

gsap.registerPlugin(ScrollTrigger);

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
      fill: "var(--green)",
      stroke: "transparent",
      duration: 0.5
    });
  }

  // 3. ScrollTrigger Reveal for Grid Cells
  const revealCells = document.querySelectorAll('.scroll-reveal');
  revealCells.forEach(cell => {
    gsap.set(cell, { y: 150, opacity: 0 });

    ScrollTrigger.create({
      trigger: cell,
      start: "top 95%", 
      onEnter: () => {
        gsap.to(cell, {
          y: 0,
          opacity: 1,
          duration: 1.2,
          ease: "power4.out",
          overwrite: true
        });
      }
    });
  });

  // 4. Modal Overlays (Solves GSAP Glitches natively)
  const cells = document.querySelectorAll('.content-cell');
  const btnsClose = document.querySelectorAll('.btn-close-modal');

  cells.forEach(cell => {
    cell.addEventListener('click', () => {
      const targetId = cell.getAttribute('data-target');
      const modal = document.getElementById(targetId);
      if (modal) {
        modal.classList.add('open');
        document.body.style.overflow = 'hidden'; // prevent bg scroll
        
        // Staggered fade-in for the cards inside this specific modal
        const cards = modal.querySelectorAll('.ed-card, .ed-image-full');
        gsap.fromTo(cards, 
          { y: 30, opacity: 0 }, 
          { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: "power2.out", delay: 0.2 }
        );
      }
    });
  });

  btnsClose.forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.dbx-modal');
      if (modal) {
        modal.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  });

  // 5. Fetch Supabase Logos
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
