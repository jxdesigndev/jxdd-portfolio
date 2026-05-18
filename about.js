/* =========================================
   JX Design & Dev — About Page Script
   about.js — Photo Shuffle Animations
   ========================================= */

document.addEventListener('DOMContentLoaded', () => {
  // --- Dynamic Content Fetch ---
  async function initDynamicAboutPage() {
    if (!window.initSupabase || !window.supabaseClient) return;
    await window.initSupabase();
    
    try {
      const { data, error } = await window.supabaseClient
        .from('site_settings')
        .select('about_content')
        .limit(1)
        .single();
        
      if (data && data.about_content && Object.keys(data.about_content).length > 0) {
        const a = data.about_content;
        
        const heading = document.getElementById('about-page-heading');
        if (heading) {
          heading.innerHTML = `<span>${a.h1 || ''} <span class="accent">✦</span></span>
          <span>${a.h2 || ''}</span>
          <span>${a.h3 || ''}</span>`;
        }
        
        const subtext = document.getElementById('about-page-subtext');
        if (subtext && a.desc) {
          subtext.innerHTML = a.desc.replace(/\n/g, '<br/>');
        }
        
        const expGrid = document.getElementById('about-page-exp-grid');
        if (expGrid && a.experience && Array.isArray(a.experience)) {
          // Keep existing innerHTML or replace? Admin panel overwrites the whole array.
          // Let's replace the whole grid content with dynamic.
          expGrid.innerHTML = '';
          a.experience.forEach(exp => {
            const card = document.createElement('div');
            card.className = 'ap-exp-card';
            
            // Format bullet points
            const bullets = exp.desc.split('\n').filter(s => s.trim()).map(s => `<li>${s.trim()}</li>`).join('');
            
            card.innerHTML = `
              <div class="ap-exp-header">
                <div>
                  <div class="ap-exp-role">${exp.role}</div>
                  <div class="ap-exp-company">${exp.company}</div>
                </div>
                <div class="ap-exp-date">${exp.dateRange}</div>
              </div>
              <ul class="ap-exp-list">
                ${bullets}
              </ul>
            `;
            expGrid.appendChild(card);
          });
        }
      }
    } catch (err) {
      console.warn("Could not load dynamic about page content:", err);
    }
  }

  // Fire dynamic fetch immediately
  initDynamicAboutPage();

  if (typeof gsap === 'undefined') return;

  const deck = document.querySelector('.ap-deck');
  if (!deck) return;

  const cards = Array.from(deck.querySelectorAll('.ap-card'));
  if (cards.length === 0) return;

  // Track the visual order: [front, second, third, back]
  let order = [...cards];
  let isHovered = false;
  let isAnimating = false;

  // Smaller spread so it doesn't leave the hero area
  const spreadConfigs = [
    { x: -45, rotation: -8 }, 
    { x: -15, rotation: -3 },
    { x: 15, rotation: 3 },
    { x: 45, rotation: 8 }
  ];

  function updateZIndex() {
    order.forEach((card, idx) => {
      card.style.zIndex = order.length - idx;
    });
  }
  updateZIndex(); // initial setup

  function applyHoverState(duration = 0.5) {
    order.forEach((card, i) => {
      const configIdx = order.length <= 2 ? i + 1 : (i % spreadConfigs.length);
      const conf = spreadConfigs[configIdx];
      
      gsap.to(card, {
        x: conf.x,
        y: -10 + Math.abs(conf.rotation),
        rotation: conf.rotation,
        scale: 1,
        duration: duration,
        ease: 'back.out(1.5)',
        overwrite: true
      });
    });
  }

  function applyCollapsedState(duration = 0.4) {
    order.forEach((card) => {
      // Very slight random organic rotation when collapsed
      const randomRot = (Math.random() - 0.5) * 4;
      gsap.to(card, {
        x: 0,
        y: 0,
        rotation: randomRot,
        scale: 1,
        duration: duration,
        ease: 'power3.out',
        overwrite: true
      });
    });
  }

  // Initial organic settled state
  applyCollapsedState(0);

  deck.addEventListener('mouseenter', () => {
    isHovered = true;
    if (!isAnimating) applyHoverState();
  });

  deck.addEventListener('mouseleave', () => {
    isHovered = false;
    if (!isAnimating) applyCollapsedState();
  });

  // Perform a shuffle action
  deck.addEventListener('click', () => {
    if (isAnimating) return;
    isAnimating = true;

    // Grab the current top card
    const frontCard = order[0];

    // 1. Throw it to the right
    gsap.to(frontCard, {
      x: 180,           // push out right
      y: 40,            // drop down slightly
      rotation: 25,
      scale: 0.95,
      duration: 0.35,
      ease: 'power2.in',
      onComplete: () => {
        // 2. Mathematically send to back
        order.push(order.shift());
        updateZIndex();

        // 3. Bring everything back to normal 
        if (isHovered) {
          applyHoverState(0.4);
        } else {
          applyCollapsedState(0.4);
        }

        // Release animation lock slightly before it visually finishes
        setTimeout(() => { isAnimating = false; }, 300);
      }
    });

    // Also adjust the remaining cards immediately while front card flies out
    // They shift up to fill the visual space. We shift a temporary array to calculate.
    let tempArray = [...order];
    tempArray.push(tempArray.shift());
    
    // Animate the remaining cards to their NEW positions slightly early for fluidity
    for (let i = 0; i < tempArray.length - 1; i++) {
        const c = tempArray[i];
        if (isHovered) {
            const conf = spreadConfigs[i % spreadConfigs.length];
            gsap.to(c, { x: conf.x, y: -10 + Math.abs(conf.rotation), rotation: conf.rotation, duration: 0.4, ease: 'power2.out' });
        } else {
            const randomRot = (Math.random() - 0.5) * 4;
            gsap.to(c, { x: 0, y: 0, rotation: randomRot, duration: 0.4, ease: 'power2.out' });
        }
    }
  });

  // Fade in elements on scroll
  if (typeof ScrollTrigger !== 'undefined') {
    const fadeElements = document.querySelectorAll('.ap-timeline-item, .ap-exp-card, .ap-acc-line');
    fadeElements.forEach((el) => {
      gsap.fromTo(el, 
        { opacity: 0, y: 30 },
        {
          opacity: 1, 
          y: 0, 
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            once: true
          }
        }
      );
    });
  }
});
