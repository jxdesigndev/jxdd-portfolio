'use strict';

document.addEventListener('DOMContentLoaded', () => {
  
  // 1. Initial Page Fade In
  gsap.to('#page', { opacity: 1, duration: 0.5 });
  gsap.to('.bento-grid', { opacity: 1, duration: 1, delay: 0.5 });

  // 2. SVG JX Logo Draw Animation
  const svgText = document.querySelector('.sleek-text');
  if (svgText) {
    const tl = gsap.timeline();
    tl.to(svgText, {
      strokeDashoffset: 0,
      duration: 2,
      ease: "power2.inOut"
    })
    .to(svgText, {
      fill: "var(--white)",
      stroke: "transparent",
      duration: 0.5
    });
  }

  // 3. Takeover Transitions
  const wipe = document.getElementById('takeover-wipe');
  const hub = document.getElementById('hub-view');
  const interiorContainer = document.getElementById('interior-container');
  const btnBack = document.getElementById('btn-back-hub');
  const interiorViews = document.querySelectorAll('.interior-view');

  // Click a grid card
  document.querySelectorAll('.bento-card').forEach(card => {
    card.addEventListener('click', () => {
      const targetId = card.getAttribute('data-target');
      
      // Wipe Up
      gsap.to(wipe, {
        scaleY: 1,
        transformOrigin: "bottom",
        duration: 0.6,
        ease: "power4.inOut",
        onComplete: () => {
          // Swap visibility behind the wipe
          hub.style.display = 'none';
          interiorContainer.style.display = 'block';
          
          interiorViews.forEach(v => v.classList.remove('active'));
          document.getElementById(targetId).classList.add('active');
          
          window.scrollTo(0, 0);

          // Wipe Away (Reveal new page)
          gsap.to(wipe, {
            scaleY: 0,
            transformOrigin: "top",
            duration: 0.6,
            ease: "power4.inOut"
          });
          
          // Animate cards inside interior view
          gsap.fromTo(`#${targetId} .int-card`, 
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, delay: 0.2, ease: "power2.out" }
          );
        }
      });
    });
  });

  // Click Back to Hub
  btnBack.addEventListener('click', () => {
    gsap.to(wipe, {
      scaleY: 1,
      transformOrigin: "bottom",
      duration: 0.6,
      ease: "power4.inOut",
      onComplete: () => {
        interiorContainer.style.display = 'none';
        interiorViews.forEach(v => v.classList.remove('active'));
        hub.style.display = 'flex'; // It's a flex container for centering logo
        
        gsap.to(wipe, {
          scaleY: 0,
          transformOrigin: "top",
          duration: 0.6,
          ease: "power4.inOut"
        });
      }
    });
  });

  // 4. Fetch Supabase Logos
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

    // Only show ones that actually have a logo
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
