const fs = require('fs');
const acorn = require('acorn');
const P = '/home/jx/Documents/JX/jxdd-portfolio/';
const code = fs.readFileSync(P + 'script.js', 'utf8');

const ast = acorn.parse(code, { ecmaVersion: 2022, ranges: true, locations: true });

let jxDecl;
ast.body.forEach(node => {
  if (node.type === 'VariableDeclaration' && node.declarations[0].id.name === 'JXUniverse') {
    jxDecl = node.declarations[0].init;
  }
});

const props = jxDecl.properties;

const webglProps = ['initParticles', 'initThreeJS', 'initCanvas2D', 'tweenUniform', 'typewriterTransition'];
const pongProps = ['initPong'];
const cliProps = ['initCLI'];
const testimonialsProps = ['loadTestimonials'];
const toolsProps = ['loadTools'];
const modalProps = ['openModal', 'closeModal'];

function extractProps(propNames, outName) {
  let extractedCode = 'export function attach(universe) {\n';
  propNames.forEach(name => {
    const prop = props.find(p => p.key && p.key.name === name);
    if (prop) {
      let valCode = code.substring(prop.value.start, prop.value.end);
      valCode = valCode.replace(/this\./g, 'universe.');
      extractedCode += "  universe." + name + " = " + valCode + ";\n\n";
    }
  });
  extractedCode += '}\n';
  fs.writeFileSync(P + 'src/' + outName + '.js', extractedCode);
}

extractProps(webglProps, 'webgl');
extractProps(pongProps, 'pong');
extractProps(cliProps, 'cli');
extractProps(testimonialsProps, 'testimonials');
extractProps(toolsProps, 'tools');
extractProps(modalProps, 'modal');

let newCode = code;
const allExtracted = [...webglProps, ...pongProps, ...cliProps, ...testimonialsProps, ...toolsProps, ...modalProps];

let replacements = [];
allExtracted.forEach(name => {
  const prop = props.find(p => p.key && p.key.name === name);
  if (prop) {
    replacements.push({
      start: prop.start,
      end: prop.end,
      name: name
    });
  }
});

replacements.sort((a, b) => b.start - a.start);
replacements.forEach(r => {
  let end = r.end;
  while (newCode[end] === ' ' || newCode[end] === '\n' || newCode[end] === '\r') end++;
  if (newCode[end] === ',') end++;
  
  let loader = '';
  if (pongProps.includes(r.name)) {
    loader = "async function(...args) { const m = await import('./src/pong.js'); m.attach(this); return this." + r.name + "(...args); }";
  } else if (webglProps.includes(r.name)) {
    loader = "async function(...args) { const m = await import('./src/webgl.js'); m.attach(this); return this." + r.name + "(...args); }";
  } else if (cliProps.includes(r.name)) {
    loader = "async function(...args) { const m = await import('./src/cli.js'); m.attach(this); return this." + r.name + "(...args); }";
  } else if (testimonialsProps.includes(r.name)) {
    loader = "async function(...args) { const m = await import('./src/testimonials.js'); m.attach(this); return this." + r.name + "(...args); }";
  } else if (toolsProps.includes(r.name)) {
    loader = "async function(...args) { const m = await import('./src/tools.js'); m.attach(this); return this." + r.name + "(...args); }";
  } else if (modalProps.includes(r.name)) {
    loader = "async function(...args) { const m = await import('./src/modal.js'); m.attach(this); return this." + r.name + "(...args); }";
  }
  
  newCode = newCode.substring(0, r.start) + r.name + ': ' + loader + newCode.substring(end);
});

fs.writeFileSync(P + 'script.js', newCode);
console.log('Split complete via acorn.');
