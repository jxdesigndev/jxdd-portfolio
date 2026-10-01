import re

with open('about.html', 'r') as f:
    html = f.read()

# We need to replace everything inside <main id="page"> ... </main> EXCEPT the footer.
target = r'<main id="page">.*?(?=<!-- ── FOOTER ── -->)'

new_main = """<main id="page">
    
    <!-- ── THE WIPE OVERLAY ── -->
    <div id="page-wipe" class="page-wipe"></div>
    <button id="back-to-hub" class="back-to-hub" aria-label="Back to Hub">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
      HUB
    </button>

    <!-- ── 1. THE HUB VIEW ── -->
    <section id="hub-view" class="hub-view">
      <div class="hub-sticky">
        <h1 class="hub-logo">JX</h1>
        <p class="hub-manifesto">I didn't just grow up.<br>I <em>leveled up.</em></p>
        
        <div class="hub-grid">
          <div class="hub-card" data-target="view-origin">
            <div class="hc-num">01</div>
            <div class="hc-title">The Origin</div>
            <div class="hc-sub">My Story</div>
          </div>
          <div class="hub-card" data-target="view-arsenal">
            <div class="hc-num">02</div>
            <div class="hc-title">The Arsenal</div>
            <div class="hc-sub">Experience & Stack</div>
          </div>
          <div class="hub-card" data-target="view-philosophy">
            <div class="hc-num">03</div>
            <div class="hc-title">The Philosophy</div>
            <div class="hc-sub">The Vision</div>
          </div>
          <div class="hub-card" data-target="view-transmission">
            <div class="hc-num">04</div>
            <div class="hc-title">Transmission</div>
            <div class="hc-sub">Intro Video</div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── 2. THE ORIGIN (Timeline) ── -->
    <section id="view-origin" class="content-view" style="display: none;">
      <div class="cv-header">
        <h2 class="cv-title">The Origin</h2>
      </div>
      <div class="origin-timeline-container">
        <div class="timeline-line"></div>
        <div class="timeline-nodes">
          <!-- Will be injected by JS or hardcoded -->
        </div>
      </div>
    </section>

    <!-- ── 3. THE ARSENAL (Sticky Stack) ── -->
    <section id="view-arsenal" class="content-view" style="display: none;">
      <div class="cv-header">
        <h2 class="cv-title">The Arsenal</h2>
      </div>
      <div class="arsenal-stack-container">
        <!-- Will be populated by JS -->
      </div>
    </section>

    <!-- ── 4. THE PHILOSOPHY (Kinetic) ── -->
    <section id="view-philosophy" class="content-view" style="display: none;">
      <div class="philosophy-kinetic-container">
        <div class="kinetic-text">I wanted to showcase myself.</div>
        <div class="kinetic-text">To show people who I am.</div>
        <div class="kinetic-text">JX isn't a brand;</div>
        <div class="kinetic-text">It's a <span class="glow">universe.</span></div>
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

html = re.sub(target, new_main, html, flags=re.DOTALL)

with open('about.html', 'w') as f:
    f.write(html)

print("about.html updated.")
