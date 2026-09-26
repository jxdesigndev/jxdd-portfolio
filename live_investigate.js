const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf-8');
const script = fs.readFileSync('script.js', 'utf-8');

const dom = new JSDOM(html, { runScripts: "dangerously", resources: "usable" });

const consoleLogs = [];
dom.window.console.log = (...args) => consoleLogs.push("[LOG] " + args.join(" "));
dom.window.console.error = (...args) => consoleLogs.push("[ERROR] " + args.join(" "));
dom.window.console.warn = (...args) => consoleLogs.push("[WARN] " + args.join(" "));

dom.window.eval(`
  window.initSupabase = async () => {};
  window.supabase = {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: async () => ({
            data: [
              { name: 'Tool 1', category: 'dev', is_active: true, logo_url: 'http://test.com/1.jpg' }
            ],
            error: null
          })
        })
      })
    })
  };
  
  // Minimal Mock for Matter.js
  window.Matter = {
    Engine: { create: () => ({ world: { gravity: { x:0, y:0 } } }) },
    Runner: { run: () => {}, create: () => {} },
    Bodies: { rectangle: (x, y, w, h) => ({ position: {x, y}, angle: 0 }) },
    Composite: { add: () => {} },
    Constraint: { create: () => ({}) },
    Mouse: { create: () => {} },
    MouseConstraint: { create: () => {} },
    Events: { on: (engine, event, cb) => { window._matterUpdate = cb; } }
  };
`);

// Try running
try {
  dom.window.eval(script);
  // Wait a moment, then manually trigger the afterUpdate tick to simulate physics engine updating styles
  setTimeout(() => {
    if (dom.window._matterUpdate) dom.window._matterUpdate();
    
    console.log("=== REQUIREMENT 1: CONSOLE OUTPUT ===");
    consoleLogs.forEach(msg => console.log(msg));
    if (consoleLogs.length === 0) console.log("(No console errors or warnings were thrown by loadTools)");

    console.log("\n=== REQUIREMENT 2: DOM ELEMENT STATE ===");
    const devBox = dom.window.document.querySelector('.bento-dev .bento-content');
    if (!devBox) {
        console.log("Dev box not found.");
    } else {
        const tools = devBox.querySelectorAll('.tool-item');
        console.log(`Found ${tools.length} .tool-item elements in the DOM.`);
        tools.forEach((t, i) => {
            console.log(`\nTool ${i}:`);
            console.log("HTML:", t.outerHTML);
            console.log("Inline Styles:", t.getAttribute("style"));
            const img = t.querySelector('img');
            if (img) console.log("Image src:", img.src);
        });
    }
  }, 100);
} catch (e) {
  console.log("Global error:", e);
}
