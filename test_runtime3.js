const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf-8');
let script = fs.readFileSync('script.js', 'utf-8');

// intercept console.error
script = `
  const origError = console.error;
  console.error = function(...args) {
    origError('[JSDOM ERROR]', ...args);
  };
` + script;

const dom = new JSDOM(html, { runScripts: "dangerously", resources: "usable" });
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
  
  window.Matter = {
    Engine: { create: () => ({ world: {} }) },
    Runner: { run: () => {}, create: () => {} },
    Bodies: { rectangle: () => ({ position: {x:0, y:0}, angle: 0 }) },
    Composite: { add: () => {} },
    Mouse: { create: () => {} },
    MouseConstraint: { create: () => {} },
    Events: { on: () => {} }
  };
`);

// Try running
try {
  dom.window.eval(script);
} catch (e) {
  console.log("Global error:", e);
}

setTimeout(() => {
  console.log("Section display:", dom.window.document.getElementById('tools-section').style.display);
}, 2000);
