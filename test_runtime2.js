const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf-8');
const script = fs.readFileSync('script.js', 'utf-8');

const dom = new JSDOM(html, { runScripts: "dangerously", resources: "usable" });
dom.window.eval(`
  // Mock Supabase
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
  
  // Mock Matter
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

// Now run the script
dom.window.eval(script);

setTimeout(() => {
  console.log("Section display:", dom.window.document.getElementById('tools-section').style.display);
  const container = dom.window.document.querySelector('.bento-dev .bento-content');
  console.log("Container child nodes count:", container.childNodes.length);
  const node = container.querySelector('.tool-item');
  if (node) {
    console.log("Tool item opacity:", node.style.opacity);
    console.log("Tool item transform:", node.style.transform);
  } else {
    console.log("No tool item found!");
  }
}, 1000);
