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
        gsap.to(cell, { y: 0, opacity: 1, duration: 1.2, ease: "power4.out", overwrite: true });
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
        const cards = modal.querySelectorAll('.ed-card, .ed-image-full, .arsenal-card');
        if(cards.length > 0) {
          gsap.fromTo(cards, 
            { y: 30, opacity: 0 }, 
            { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: "power2.out", delay: 0.2 }
          );
        }
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

  // 5. RESTORE ORIGINAL CONTENT: Populate Origin Chapters
  populateOrigin();

  // 6. RESTORE ORIGINAL CONTENT: Fetch Arsenal & Video & Logos
  initArsenalStack();
  loadCompanyLogos();
  initTransmission();
});

function populateOrigin() {
  const container = document.getElementById('origin-grid');
  if (!container) return;
  const chapters = [
    { era: "The Early Years: The Artist", title: "Born to Create", body: "Before code, before computers, there was art. A younger Okezie who wanted to draw, who taught himself by tracing, line by line, character by character. Physics class became a love affair: technical drawing, architectural plans, the geometry of the perfect building. I wanted to design world-class structures. Not just buildings, experiences that people would walk into and feel something." },
    { era: "The Discovery: The Technologist", title: "Then I Found Computers", body: "A machine that could do anything. I was fascinated, not just by what it could do, but by how it worked. So I learned. First as a student, watching everything. Then under a computer technician, hands inside machines, wires and circuits making sense where they hadn't before. I wasn't just using computers anymore. I was building with them." },
    { era: "The Canvas", title: "Digital Art & Animation", body: "My passion for drawing never left me. It evolved. I transitioned from pencil and paper to becoming a digital artist, creating cartoon pictures directly on my phone and sharing my creations with the world. This was my digital playground, and it sparked my desire to go into animation—bringing those static cartoon frames to life through motion and code." },
    { era: "The Convergence", title: "JX", body: "All these paths—the artist, the computer technician, the architect, the digital creator—converged into a single identity: JX. It was coined because I wanted to showcase myself—my true self. I wanted to show people who I am, what I can do, provide exceptional services, and grow immensely. JX is my identity. It is the culmination of every pixel drawn, every system built, and every world designed." }
  ];

  chapters.forEach(ch => {
    const card = document.createElement('div');
    card.className = 'ed-card';
    card.innerHTML = `
      <p style="color:var(--green); font-family:var(--font-mono); margin-bottom:0.5rem; font-size:0.875rem;">${ch.era}</p>
      <h3>${ch.title}</h3>
      <p>${ch.body}</p>
    `;
    container.appendChild(card);
  });
}

async function initArsenalStack() {
  const container = document.getElementById('arsenal-grid');
  if (!container) return;

  try {
    if (window.initSupabase) await window.initSupabase();
    if (typeof supabase === 'undefined') throw new Error('Database offline.');

    const { data, error } = await supabase
      .from('experience')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
      container.innerHTML = '<div style="color:var(--gray-2);">No arsenal entries found.</div>';
      return;
    }

    container.innerHTML = '';
    data.forEach(exp => {
      const card = document.createElement('div');
      card.className = 'ed-card arsenal-card';
      card.innerHTML = `
        <p style="color:var(--green); font-family:var(--font-mono); margin-bottom:0.5rem; font-size:0.875rem;">${exp.date_range} • ${exp.company}</p>
        <h3>${exp.role_title}</h3>
        <p>${exp.description || ''}</p>
      `;
      container.appendChild(card);
    });
  } catch (err) {
    console.error('Failed to load arsenal:', err);
    container.innerHTML = '<div style="color:var(--red);">Failed to load experience vault.</div>';
  }
}

async function loadCompanyLogos() {
  const container = document.getElementById('company-logos-container');
  if (!container) return;

  try {
    if (window.initSupabase) await window.initSupabase();
    if (typeof supabase === 'undefined') return;

    const { data, error } = await supabase
      .from('experience')
      .select('*')
      .order('priority', { ascending: false });
      
    if (error) throw error;
    if (!data) return;

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
  }
}

async function initTransmission() {
  const video = document.getElementById('intro-video');
  if (!video) return;
  try {
    if (window.initSupabase) await window.initSupabase();
    if (typeof supabase !== 'undefined') {
      const { data, error } = await supabase.from('site_settings').select('*').eq('key', 'about_video_url').single();
      if (data && data.value) video.src = data.value;
    }
  } catch (e) { console.warn("Video link failed", e); }
}
