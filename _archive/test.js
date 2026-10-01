const fs = require('fs');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const html = fs.readFileSync('project.html', 'utf8');
const js = fs.readFileSync('project.js', 'utf8');

const dom = new JSDOM(html, { runScripts: "dangerously" });
try {
  dom.window.eval(js);
  console.log("JS executed without throwing synchronously.");
} catch (e) {
  console.error("JS error:", e);
}
