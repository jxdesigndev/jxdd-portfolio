export function attach(universe) {
  universe.initCLI = () {
    const panel   = document.getElementById('cli-panel');
    const trigger = document.getElementById('cli-trigger');
    const closeBtn = document.getElementById('cli-close');
    const input   = document.getElementById('cli-input');
    const output  = document.getElementById('cli-output');
    if (!panel || !input || !output) return;

    const BOOT_MESSAGES = [
      { text: '╔══════════════════════════════════╗', class: 'green' },
      { text: '║     JX UNIVERSE — v3.0           ║', class: 'green' },
      { text: '║     jxdesigndev.com              ║', class: 'green' },
      { text: '╚══════════════════════════════════╝', class: 'green' },
      { text: '' },
      { text: 'SYSTEM: Consciousness online.', class: 'dim' },
      { text: 'LOCATION: Lagos, Nigeria · NGT', class: 'dim' },
      { text: 'STATUS: Ready.', class: 'dim' },
      { text: '' },
      { text: "Type 'help' to see available commands.", class: 'dim' },
    ];

    const COMMANDS = {
      help: [
        { text: '┌─ AVAILABLE COMMANDS ────────────────┐', class: 'green' },
        { text: '│  about     → Who is JX?             │' },
        { text: '│  skills    → Full skill stack        │' },
        { text: '│  work      → View project vault      │' },
        { text: '│  services  → The Forge               │' },
        { text: '│  contact   → Get in touch            │' },
        { text: '│  hire me   → Let\'s build together    │' },
        { text: '│  pong      → Play Particle Pong      │', class: 'amber' },
        { text: '│  clear     → Clear terminal          │' },
        { text: '│  status    → System vitals           │' },
        { text: '└─────────────────────────────────────┘', class: 'green' },
      ],
      about: [
        { text: '> Scanning JX consciousness...', class: 'dim' },
        { text: '' },
        { text: 'NAME:       Okezie Ferdinand', class: 'green' },
        { text: 'ALIAS:      JX' },
        { text: 'ORIGIN:     Lagos, Nigeria' },
        { text: 'MISSION:    Build the world\'s best digital experiences.' },
        { text: '' },
        { text: 'JOURNEY:    Cartoon Artist → Character Designer', class: 'amber' },
        { text: '            → UI/UX Designer → Product Designer', class: 'amber' },
        { text: '            → Full-Stack Developer → Security Learner', class: 'amber' },
        { text: '            → Game Builder → [UNDEFINED — STILL GROWING]', class: 'amber' },
        { text: '' },
        { text: 'TRUTH:      "I don\'t just build websites. I build worlds."', class: 'green' },
      ],
      skills: [
        { text: '> Loading skill matrix...', class: 'dim' },
        { text: '' },
        { text: '[ DESIGN ]', class: 'green' },
        { text: '  Figma · Prototyping · Design Systems · UX Research' },
        { text: '' },
        { text: '[ DEVELOPMENT ]', class: 'green' },
        { text: '  HTML · CSS · JavaScript · React · Next.js · Node.js' },
        { text: '  Three.js · WebGL · GSAP · Supabase · PostgreSQL' },
        { text: '' },
        { text: '[ AUTOMATION ]', class: 'green' },
        { text: '  N8N · Workflow Design · API Integration' },
        { text: '' },
        { text: '[ SECURITY ]', class: 'green' },
        { text: '  Ethical Hacking · Penetration Testing [LEARNING]' },
        { text: '' },
        { text: '[ GAMES ]', class: 'green' },
        { text: '  Afrocentric character design · Game logic [IN PROGRESS]' },
      ],
      status: [
        { text: '> Running diagnostics...', class: 'dim' },
        { text: '' },
        { text: '● CONSCIOUSNESS:  ONLINE', class: 'green' },
        { text: `● LOCATION:       Lagos, Nigeria — NGT` },
        { text: '● AVAILABILITY:   OPEN TO WORK', class: 'amber' },
        { text: '● CREATIVITY:     ████████████ 100%', class: 'green' },
        { text: '● AMBITION:       INFINITE', class: 'amber' },
        { text: '● COFFEE LEVEL:   SUFFICIENT', class: 'dim' },
      ],
      work: [
        { text: '> Opening The Vault...', class: 'green' },
        { text: 'Navigating to work.html in 1 second...', class: 'dim' },
      ],
      services: [
        { text: '> Activating The Forge...', class: 'green' },
        { text: 'Navigating to services.html in 1 second...', class: 'dim' },
      ],
      contact: [
        { text: '> Opening The Signal...', class: 'green' },
        { text: 'Navigating to contact.html in 1 second...', class: 'dim' },
      ],
      'hire me': [
        { text: '> EXCELLENT DECISION.', class: 'green' },
        { text: '' },
        { text: '  Initiating hire sequence...', class: 'amber' },
        { text: '  Calibrating genius levels...', class: 'dim' },
        { text: '  Opening contact portal...', class: 'dim' },
        { text: '' },
        { text: "  Let's build something historic.", class: 'green' },
      ],
      pong: [
        { text: '> INITIATING PARTICLE PONG...', class: 'green' },
        { text: '' },
        { text: '  55,000 particles are rearranging...', class: 'dim' },
        { text: '  Move your mouse to control the left paddle.', class: 'amber' },
        { text: '  Press ESC to return to the universe.', class: 'dim' },
        { text: '' },
        { text: '  May the best consciousness win.', class: 'green' },
      ],
    };

    const print = (lines, delay = 0) => {
      lines.forEach((line, i) => {
        setTimeout(() => {
          const el = document.createElement('p');
          el.className = 'cli-line ' + (line.class || '');
          el.textContent = line.text || '\u00A0';
          output.append(el);
          output.scrollTop = output.scrollHeight;
        }, delay + i * 30);
      });
    };

    const open = () => {
      panel.classList.add('open');
      universe.cliOpen = true;
      if (output.children.length === 0) {
        print(BOOT_MESSAGES);
      }
      setTimeout(() => input.focus(), 200);
      if (window.JXLenis) window.JXLenis.stop();
    };

    const close = () => {
      panel.classList.remove('open');
      universe.cliOpen = false;
      if (window.JXLenis) window.JXLenis.start();
    };

    trigger?.addEventListener('click', () => universe.cliOpen ? close() : open());
    closeBtn?.addEventListener('click', close);

    /* Focus Trap for CLI Modal */
    panel.addEventListener('keydown', e => {
      if (e.key === 'Tab') {
        const focusable = panel.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    });

    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        universe.cliOpen ? close() : open();
      }
      if (e.key === 'Escape' && universe.cliOpen) close();
    });

    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const cmd = input.value.trim().toLowerCase();
        input.value = '';
        if (!cmd) return;

        /* Echo command */
        const cmdLine = document.createElement('p');
        cmdLine.className = 'cli-line';
        cmdLine.textContent = `jx@universe:~$ ${cmd}`;
        output.append(cmdLine);
        output.scrollTop = output.scrollHeight;

        universe.cliHistory.unshift(cmd);
        universe.cliIndex = -1;

        if (cmd === 'clear') {
          output.innerHTML = '';
          return;
        }

        const response = COMMANDS[cmd];
        if (response) {
          print(response, 80);
          /* Navigate commands */
          if (cmd === 'work')     setTimeout(() => { sessionStorage.setItem('ct-active','1'); window.location.href = '/work.html'; }, 1500);
          if (cmd === 'services') setTimeout(() => { sessionStorage.setItem('ct-active','1'); window.location.href = '/services.html'; }, 1500);
          if (cmd === 'contact' || cmd === 'hire me') setTimeout(() => { sessionStorage.setItem('ct-active','1'); window.location.href = '/contact.html'; }, 2200);
          /* Phase 4: Pong launch */
          if (cmd === 'pong') setTimeout(() => { close(); universe.initPong(); }, 1600);
        } else {
          print([
            { text: `Command not found: '${cmd}'`, class: 'error' },
            { text: "Type 'help' for available commands.", class: 'dim' },
          ], 80);
        }
      }

      /* History navigation */
      if (e.key === 'ArrowUp') {
        if (universe.cliIndex < universe.cliHistory.length - 1) {
          universe.cliIndex++;
          input.value = universe.cliHistory[universe.cliIndex];
        }
      }
      if (e.key === 'ArrowDown') {
        if (universe.cliIndex > 0) {
          universe.cliIndex--;
          input.value = universe.cliHistory[universe.cliIndex];
        } else {
          universe.cliIndex = -1;
          input.value = '';
        }
      }
    });
  };

}
