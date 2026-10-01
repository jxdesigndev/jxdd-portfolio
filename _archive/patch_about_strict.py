import re

# 1. HTML OVERHAUL
with open('about.html', 'r') as f:
    html = f.read()

# Replace the entire <main id="page"> ... </main> block, preserving footer.
target_html = r'<main id="page">.*?(?=<!-- ── FOOTER ── -->)'

new_html = """<main id="page" style="opacity: 1;">
    <!-- ── GLOBAL WIPE & NAV ── -->
    <div id="dbx-takeover-layer" class="dbx-takeover-layer"></div>
    <button id="back-to-hub" class="back-to-hub" aria-label="Back to Hub">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
      CLOSE
    </button>

    <!-- ── 1. THE HERO / BENTO HUB ── -->
    <section id="dbx-hub-view" class="dbx-hub-view">
      
      <!-- Massive Hero Logo -->
      <h1 class="dbx-massive-logo">JX</h1>
      <p class="dbx-hero-manifesto">I didn't just grow up.<br>I <em>leveled up.</em></p>

      <!-- Sticky Grid Container -->
      <div class="dbx-bento-container">
        <div class="dbx-bento-grid">
          
          <div class="dbx-cell" data-target="view-origin">
            <div class="dbx-cell-bg" style="background-image: url('assets/images/okezie-1.webp')"></div>
            <div class="dbx-cell-overlay"></div>
            <div class="dbx-cell-content">
              <div class="dbx-num">01</div>
              <h2 class="dbx-title"><span class="mask-text">The Origin</span></h2>
            </div>
          </div>

          <div class="dbx-cell" data-target="view-arsenal">
            <div class="dbx-cell-bg dbx-marquee-bg">
              <div class="marquee-track">
                <span>REACT / GSAP / SUPABASE / NODE / FIGMA / THREE.JS / WEBGL / </span>
                <span>REACT / GSAP / SUPABASE / NODE / FIGMA / THREE.JS / WEBGL / </span>
              </div>
            </div>
            <div class="dbx-cell-overlay"></div>
            <div class="dbx-cell-content">
              <div class="dbx-num">02</div>
              <h2 class="dbx-title"><span class="mask-text">The Arsenal</span></h2>
            </div>
          </div>

          <div class="dbx-cell" data-target="view-philosophy">
            <div class="dbx-cell-bg" style="background-image: url('assets/images/okezie-designer.webp')"></div>
            <div class="dbx-cell-overlay"></div>
            <div class="dbx-cell-content">
              <div class="dbx-num">03</div>
              <h2 class="dbx-title"><span class="mask-text">The Philosophy</span></h2>
            </div>
          </div>

          <div class="dbx-cell" data-target="view-transmission">
            <div class="dbx-cell-bg" style="background-image: url('assets/images/okezie-coder.webp')"></div>
            <div class="dbx-cell-overlay"></div>
            <div class="dbx-cell-content">
              <div class="dbx-num">04</div>
              <h2 class="dbx-title"><span class="mask-text">Transmission</span></h2>
            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- ── 2. THE ORIGIN (Timeline) ── -->
    <section id="view-origin" class="content-view" style="display: none;">
      <div class="cv-header">
        <h2 class="cv-title"><span class="cv-title-inner">The Origin</span></h2>
      </div>
      <div class="origin-timeline-container">
        <div class="timeline-line"></div>
        <div class="timeline-line-fill"></div>
        <div class="timeline-nodes"></div>
      </div>
    </section>

    <!-- ── 3. THE ARSENAL (Sticky Stack) ── -->
    <section id="view-arsenal" class="content-view" style="display: none;">
      <div class="cv-header">
        <h2 class="cv-title"><span class="cv-title-inner">The Arsenal</span></h2>
      </div>
      <div class="arsenal-stack-container"></div>
    </section>

    <!-- ── 4. THE PHILOSOPHY (Kinetic) ── -->
    <section id="view-philosophy" class="content-view" style="display: none;">
      <div class="philosophy-kinetic-container">
        <div class="kinetic-sticky">
          <div class="kinetic-text">I wanted to showcase myself.</div>
          <div class="kinetic-text">To show people who I am.</div>
          <div class="kinetic-text">JX isn't a brand;</div>
          <div class="kinetic-text">It's a <span class="glow">universe.</span></div>
        </div>
      </div>
    </section>

    <!-- ── 5. TRANSMISSION (Video Portal) ── -->
    <div id="view-transmission" class="transmission-portal" style="display: none;">
      <div class="tp-ring"></div>
      <div class="tp-video-wrapper">
        <video id="intro-video" src="/assets/videos/showreel.mp4" playsinline controls></video>
      </div>
    </div>

    """

html = re.sub(target_html, new_html, html, flags=re.DOTALL)
# Remove the #page { opacity: 0; } from <style> in <head>
html = re.sub(r'#page\s*\{\s*opacity:\s*0;\s*\}', '', html)

with open('about.html', 'w') as f:
    f.write(html)

print("about.html rebuilt cleanly.")
