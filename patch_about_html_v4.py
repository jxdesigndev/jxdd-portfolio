import re

html_content = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>About | JX Design & Dev</title>
  
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500&display=swap" rel="stylesheet">

  <script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js" defer></script>
  <script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/ScrollToPlugin.min.js" defer></script>
  <script src="https://cdn.jsdelivr.net/npm/lenis@1.1.14/dist/lenis.min.js" defer></script>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2" defer></script>
  <script src="supabase.js" defer></script>
  
  <link rel="stylesheet" href="style.css">
  <link rel="stylesheet" href="about-grid.css">
  <link rel="icon" type="image/jpeg" href="assets/images/jx-logo.jpeg">
</head>
<body>
  <main id="page">
    
    <!-- ── THE HYBRID HUB GRID ── -->
    <section class="about-entry-wrapper">
      <div class="bento-container" id="bento-grid">
        
        <!-- Center Logo Hero Cell -->
        <div class="bento-cell hero-cell">
          <svg class="jx-svg-logo" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <!-- Hand-coded geometric JX -->
            <!-- J -->
            <path class="jx-svg-path" d="M 80 40 L 80 120 Q 80 160 50 160 Q 20 160 20 120 L 20 100" />
            <path class="jx-svg-filled" d="M 90 40 L 90 120 Q 90 170 50 170 Q 10 170 10 120 L 10 100 L 30 100 L 30 120 Q 30 150 50 150 Q 70 150 70 120 L 70 40 Z" />
            <!-- X -->
            <path class="jx-svg-path" d="M 110 40 L 190 160 M 190 40 L 110 160" />
            <polygon class="jx-svg-filled" points="110,40 130,40 150,90 170,40 190,40 165,100 190,160 170,160 150,110 130,160 110,160 135,100" />
          </svg>
        </div>

        <!-- 01: The Origin -->
        <a href="#origin" class="bento-cell" data-scroll-to>
          <div class="cell-bg" style="background-image: url('assets/images/okezie-1.webp');"></div>
          <div class="cell-flood"></div>
          <svg class="cell-symbol" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>
          <div class="cell-content">
            <span class="cell-num">01</span>
            <span class="cell-title">The Origin</span>
          </div>
        </a>

        <!-- 02: The Arsenal -->
        <a href="#arsenal" class="bento-cell" data-scroll-to>
          <div class="cell-bg" style="background-image: url('assets/images/okezie-coder.webp');"></div>
          <div class="cell-flood"></div>
          <!-- Bracket/Code Symbol -->
          <svg class="cell-symbol" viewBox="0 0 24 24" fill="currentColor"><path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg>
          <div class="cell-content">
            <span class="cell-num">02</span>
            <span class="cell-title">The Arsenal</span>
          </div>
        </a>

        <!-- 03: The Philosophy -->
        <a href="#philosophy" class="bento-cell span-2" data-scroll-to>
          <div class="cell-bg" style="background-image: url('assets/images/okezie-designer.webp');"></div>
          <div class="cell-flood"></div>
          <!-- Abstract Eye/Vision Symbol -->
          <svg class="cell-symbol" style="width: 30%;" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
          <div class="cell-content">
            <span class="cell-num">03</span>
            <span class="cell-title">The Philosophy</span>
          </div>
        </a>

      </div>
    </section>

    <!-- ── EDITORIAL INTERIORS ── -->
    
    <section id="origin" class="editorial-section">
      <div class="section-header reveal-up">
        <h2>The Origin.</h2>
        <p style="color:var(--gray-2); font-family:var(--font-mono);">Nigeria // 2089 // The Awakening</p>
      </div>
      <div class="editorial-grid">
        <div class="editorial-card reveal-up">
          <h3>Humble Beginnings</h3>
          <p>I started with nothing but a broken laptop and a sheer obsession for how things worked on the web. Every night was a deep dive into the unknown, ripping apart source codes just to see the matrix underneath.</p>
        </div>
        <div class="editorial-card reveal-up">
          <h3>The Pivot</h3>
          <p>Design wasn't enough. Code wasn't enough. I realized that the true power lay in the intersection—Product Engineering. I didn't just want to paint the interface; I wanted to wire the explosive logic behind it.</p>
        </div>
      </div>
      <img src="assets/images/okezie-1.webp" class="editorial-image-full reveal-up" alt="Workspace">
    </section>

    <section id="arsenal" class="editorial-section">
      <div class="section-header reveal-up">
        <h2>The Arsenal.</h2>
        <p style="color:var(--gray-2); font-family:var(--font-mono);">Stack // Integrations // Experience</p>
      </div>
      <div class="editorial-grid">
        <div class="editorial-card reveal-up">
          <h3>Frontend Engineering</h3>
          <p>React, Next.js, and raw WebGL. I build cinematic, hardware-accelerated interfaces that run at 60fps.</p>
        </div>
        <div class="editorial-card reveal-up">
          <h3>Backend & Automation</h3>
          <p>Node.js, Supabase, and N8N. I don't just build apps; I build autonomous systems that scale.</p>
        </div>
      </div>
      
      <!-- Company Logos (Supabase Integration) -->
      <div style="margin-top: var(--s-20);" class="reveal-up">
        <h3 style="color:var(--green); font-family:var(--font-mono); margin-bottom:var(--s-4);">// ALLIES & CLIENTS</h3>
        <div class="company-logo-grid" id="company-logos-container">
          <div style="color:var(--gray-3); font-family:var(--font-mono); padding:var(--s-4);">Initializing Vault Data...</div>
        </div>
      </div>
    </section>

    <section id="philosophy" class="editorial-section" style="margin-bottom: 200px;">
      <div class="section-header reveal-up">
        <h2>The Philosophy.</h2>
        <p style="color:var(--gray-2); font-family:var(--font-mono);">Form // Function // Future</p>
      </div>
      <div class="editorial-grid">
        <div class="editorial-card reveal-up">
          <h3>Dark Tech</h3>
          <p>I believe software should feel like a command center. Interfaces should be sharp, precise, and void of unnecessary noise.</p>
        </div>
        <div class="editorial-card reveal-up">
          <h3>Unapologetic Excellence</h3>
          <p>We don't ship "good enough". If it doesn't drop jaws, it doesn't deploy.</p>
        </div>
      </div>
      <img src="assets/images/okezie-designer.webp" class="editorial-image-full reveal-up" alt="Concept Art">
    </section>

  </main>

  <script src="nav.js" defer></script>
  <script src="about_new.js" defer></script>
</body>
</html>
"""

with open('about.html', 'w') as f:
    f.write(html_content)

