const fs = require('fs');

const zenflow = fs.readFileSync('projects/zenflow.html', 'utf8');
const styleMatch = zenflow.match(/<style>([\s\S]*?)<\/style>/);
const styleCSS = styleMatch ? styleMatch[1] : '';

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Case Study | JX Design & Dev</title>
  
  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500&family=Playfair+Display:ital,wght@1,900&display=swap" rel="stylesheet">

  <!-- GSAP -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js" defer></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js" defer></script>
  <!-- Lenis -->
  <script src="https://cdn.jsdelivr.net/npm/lenis@1.1.14/dist/lenis.min.js" defer></script>

  <!-- Supabase -->
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2" defer></script>
  <script src="supabase.js" defer></script>

  <link rel="stylesheet" href="style.css">

  <style>
${styleCSS}
  </style>
</head>
<body>
  <a href="#page" class="skip-to-content">Skip to content</a>
  <div id="page">
    <main id="main-content">
      <div id="loading-state" style="padding: 160px var(--s-8); text-align: center; color: var(--gray-2); font-family: var(--font-mono); font-size: var(--text-sm); letter-spacing: var(--track-widest);">
        INITIATING...
      </div>
    </main>

    <!-- ── FOOTER ── -->
    <footer style="border-top: 1px solid var(--border); padding: var(--s-8) var(--s-8); display:flex; justify-content:space-between; align-items:center; flex-wrap: wrap; gap: var(--s-4);">
      <span style="font-family: var(--font-mono); font-size: var(--text-xs); color: var(--gray-2);">
        © 2026 JX. Nigeria.
      </span>
      <span id="footer-project-title" style="font-family: var(--font-mono); font-size: var(--text-xs); color: var(--green);">
        CASE STUDY
      </span>
    </footer>
  </div>

  <script src="nav.js" defer></script>
  <script src="project.js" defer></script>
</body>
</html>`;

fs.writeFileSync('project.html', html);
console.log('project.html written successfully.');
