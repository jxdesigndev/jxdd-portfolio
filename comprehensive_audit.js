/**
 * COMPREHENSIVE AUDIT SCRIPT — Sections A B C D
 * Run: node comprehensive_audit.js
 */
'use strict';
const http      = require('http');
const fs        = require('fs');
const path      = require('path');
const puppeteer = require('puppeteer');

const PORT = 19090;
const ROOT = __dirname;
const OUT  = path.join(__dirname, 'audit_screenshots');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const MIME = {
  '.html':'text/html','.css':'text/css','.js':'application/javascript',
  '.json':'application/json','.png':'image/png','.jpg':'image/jpeg',
  '.jpeg':'image/jpeg','.svg':'image/svg+xml','.ico':'image/x-icon',
  '.woff2':'font/woff2','.woff':'font/woff','.ttf':'font/ttf','.mp4':'video/mp4'
};
const server = http.createServer((req,res)=>{
  let p = req.url==='/'?'/index.html':req.url.split('?')[0];
  const abs=path.join(ROOT,p), ext=path.extname(p).toLowerCase();
  fs.readFile(abs,(err,data)=>{
    if(err){res.writeHead(404);res.end('404');return;}
    res.writeHead(200,{'Content-Type':MIME[ext]||'application/octet-stream','Cache-Control':'no-cache'});
    res.end(data);
  });
});

const BASE=`http://localhost:${PORT}`;
const PAGES=[
  {name:'index',url:`${BASE}/index.html`},
  {name:'about',url:`${BASE}/about.html`},
  {name:'work',url:`${BASE}/work.html`},
  {name:'services',url:`${BASE}/services.html`},
  {name:'contact',url:`${BASE}/contact.html`},
  {name:'project',url:`${BASE}/project.html?slug=zenflow`},
];
const BPS=[
  {label:'375',width:375,height:812},
  {label:'768',width:768,height:1024},
  {label:'1024',width:1024,height:768},
  {label:'1440',width:1440,height:900},
];
const report={sectionA:{},sectionB:{},sectionC:{},sectionD:{}};

async function nav(page,url){
  try{await page.goto(url,{waitUntil:'domcontentloaded',timeout:25000});}
  catch(e){console.error('NAV ERR',url,e.message);}
  await new Promise(r=>setTimeout(r,2500));
}

async function checkOverflow(page){
  return page.evaluate(()=>{
    const docW=document.documentElement.scrollWidth,winW=window.innerWidth;
    const spilling=[];
    document.querySelectorAll('*').forEach(el=>{
      const r=el.getBoundingClientRect();
      if(r.right>winW+2||r.left<-2){
        const tag=el.tagName.toLowerCase(),id=el.id?`#${el.id}`:'';
        const cls=typeof el.className==='string'?`.${el.className.split(' ')[0]}`:'';
        spilling.push(`${tag}${id}${cls} (l=${Math.round(r.left)},r=${Math.round(r.right)},winW=${winW})`);
      }
    });
    return{overflow:docW>winW,docW,winW,spilling:spilling.slice(0,15)};
  });
}

async function checkWordBreak(page){
  return page.evaluate(()=>{
    const issues=[];
    ['#hl-1','#hl-2','#ah-title','#sh-title','.hero-name-line','h2.headline-lg'].forEach(sel=>{
      document.querySelectorAll(sel).forEach(el=>{
        const cs=window.getComputedStyle(el);
        const rect=el.getBoundingClientRect();
        // Check children for line wrapping inside a single "word"
        const children=[...el.children];
        let wordWrapOccurred=false;
        if(children.length>1){
          const firstY=children[0].getBoundingClientRect().top;
          const multipleLines=children.some(c=>Math.abs(c.getBoundingClientRect().top-firstY)>8);
          if(multipleLines){
            // Are there word wrappers? If type=words,chars, there should be .gsap-split-text or divs wrapping words
            const hasWordDivs=el.querySelectorAll('div').length>0||el.querySelectorAll('[class*="word"]').length>0;
            wordWrapOccurred=!hasWordDivs;
          }
        }
        issues.push({
          selector:sel,
          id:el.id,
          display:cs.display,
          whiteSpace:cs.whiteSpace,
          wordBreak:cs.wordBreak,
          overflowWrap:cs.overflowWrap,
          childCount:children.length,
          wordWrapOccurredWithoutWordWrappers:wordWrapOccurred,
          rectW:Math.round(rect.width),
          rectH:Math.round(rect.height),
        });
      });
    });
    return issues;
  });
}

/* SECTION A */
async function runSectionA(browser){
  console.log('\n=== SECTION A: Screenshots + Responsiveness ===');
  for(const pg of PAGES){
    report.sectionA[pg.name]={};
    for(const bp of BPS){
      const page=await browser.newPage();
      const consoleLogs=[],networkErrors=[];
      page.on('console',m=>{if(['error','warn'].includes(m.type()))consoleLogs.push(`[${m.type().toUpperCase()}] ${m.text()}`);});
      page.on('requestfailed',r=>{if(!r.url().includes('favicon'))networkErrors.push(`FAILED:${r.url()}`);});
      page.on('response',r=>{if(r.status()>=400)networkErrors.push(`HTTP ${r.status()}:${r.url()}`);});
      await page.setViewport({width:bp.width,height:bp.height,deviceScaleFactor:1});
      await nav(page,pg.url);
      const ssFile=path.join(OUT,`${pg.name}_${bp.label}.png`);
      await page.screenshot({path:ssFile,fullPage:true});
      const overflow=await checkOverflow(page);
      const wordBreak=await checkWordBreak(page);
      report.sectionA[pg.name][bp.label]={screenshot:ssFile,overflow,wordBreak,consoleLogs:consoleLogs.slice(0,10),networkErrors:networkErrors.slice(0,10)};
      console.log(`  [${pg.name}@${bp.label}] overflow=${overflow.overflow} spillers=${overflow.spilling.length} screenshot=SAVED`);
      await page.close();
    }
  }
}

/* SECTION B */
async function runSectionB(browser){
  console.log('\n=== SECTION B: Typography ===');
  const SELS=['h1','h2','h3','.hero-name','.hero-eyebrow','.hero-desc','p','body','.headline-lg','.headline-hero','.headline-md'];
  for(const pg of PAGES){
    const page=await browser.newPage();
    await page.setViewport({width:1440,height:900});
    await nav(page,pg.url);
    const entries=await page.evaluate((sels)=>{
      const results=[],seen=new Set();
      sels.forEach(sel=>{
        document.querySelectorAll(sel).forEach(el=>{
          const cs=window.getComputedStyle(el);
          if(cs.display==='none'||cs.visibility==='hidden')return;
          const key=`${el.tagName}|${cs.fontSize}|${cs.fontWeight}|${cs.lineHeight}`;
          if(seen.has(key))return;
          seen.add(key);
          const id=el.id?`#${el.id}`:'';
          const cls=typeof el.className==='string'?el.className.split(' ').slice(0,2).join('.'):'';
          results.push({
            element:`${el.tagName.toLowerCase()}${id}${cls?'.'+cls:''}`,
            fontSize:cs.fontSize,fontWeight:cs.fontWeight,lineHeight:cs.lineHeight,
            fontFamily:cs.fontFamily.split(',')[0].trim().replace(/['"]/g,''),
            color:cs.color,letterSpacing:cs.letterSpacing,textTransform:cs.textTransform,
          });
        });
      });
      return results;
    },SELS);
    report.sectionB[pg.name]=entries;
    console.log(`  [${pg.name}] ${entries.length} distinct type combos`);
    entries.forEach(e=>console.log(`    ${e.element}: ${e.fontSize}/${e.fontWeight}/${e.lineHeight} font=${e.fontFamily}`));
    await page.close();
  }
}

/* SECTION C */
async function runSectionC(browser){
  console.log('\n=== SECTION C: Colors ===');
  // Extract CSS vars from index
  const varPage=await browser.newPage();
  await varPage.setViewport({width:1440,height:900});
  await nav(varPage,`${BASE}/index.html`);
  const cssVars=await varPage.evaluate(()=>{
    const vars={};
    for(const sheet of document.styleSheets){
      try{
        for(const rule of sheet.cssRules){
          if(rule.selectorText===':root'){
            const matches=rule.cssText.matchAll(/--([\w-]+):\s*([^;]+);/g);
            for(const m of matches)vars[`--${m[1]}`]=m[2].trim();
          }
        }
      }catch(e){}
    }
    return vars;
  });
  await varPage.close();
  console.log(`  CSS Variables defined: ${Object.keys(cssVars).length}`);
  
  for(const pg of PAGES){
    const page=await browser.newPage();
    await page.setViewport({width:1440,height:900});
    await nav(page,pg.url);
    const colorData=await page.evaluate(()=>{
      const colorMap=new Map();
      document.querySelectorAll('*').forEach(el=>{
        const cs=window.getComputedStyle(el);
        ['color','background-color','border-top-color','outline-color'].forEach(prop=>{
          const val=cs.getPropertyValue(prop).trim();
          if(!val||val==='rgba(0, 0, 0, 0)'||val==='transparent')return;
          const tag=el.tagName.toLowerCase(),id=el.id?`#${el.id}`:'';
          const cls=typeof el.className==='string'?`.${el.className.split(' ')[0]}`:'';
          if(!colorMap.has(val))colorMap.set(val,{value:val,prop,refs:[]});
          const entry=colorMap.get(val);
          const ref=`${tag}${id}${cls}`;
          if(entry.refs.length<2&&!entry.refs.includes(ref))entry.refs.push(ref);
        });
      });
      return Array.from(colorMap.values());
    });
    const parseRGB=str=>{const m=str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);return m?[+m[1],+m[2],+m[3]]:null;};
    const dist=(a,b)=>{const pa=parseRGB(a),pb=parseRGB(b);if(!pa||!pb)return 999;return Math.sqrt((pa[0]-pb[0])**2+(pa[1]-pb[1])**2+(pa[2]-pb[2])**2);};
    const nearDuplicates=[];
    for(let i=0;i<colorData.length;i++)for(let j=i+1;j<colorData.length;j++){const d=dist(colorData[i].value,colorData[j].value);if(d>0&&d<20)nearDuplicates.push({a:colorData[i].value,b:colorData[j].value,distance:Math.round(d)});}
    report.sectionC[pg.name]={colors:colorData,nearDuplicates};
    console.log(`  [${pg.name}] ${colorData.length} distinct colors, ${nearDuplicates.length} near-duplicates`);
    nearDuplicates.slice(0,5).forEach(d=>console.log(`    NEAR-DUP: "${d.a}" vs "${d.b}" dist=${d.distance}`));
    await page.close();
  }
  report.sectionC._cssVars=cssVars;
}

/* SECTION D */
async function runSectionD(browser){
  console.log('\n=== SECTION D: Interactive Elements ===');
  for(const pg of PAGES){
    const page=await browser.newPage();
    await page.setViewport({width:1440,height:900});
    await nav(page,pg.url);
    const checks=await page.evaluate(()=>{
      const results=[];
      [...document.querySelectorAll('a,button,input,textarea,select,[tabindex]')].forEach(el=>{
        const cs=window.getComputedStyle(el);
        const rect=el.getBoundingClientRect();
        if(rect.width===0||rect.height===0||cs.display==='none'||cs.visibility==='hidden')return;
        const tag=el.tagName.toLowerCase(),id=el.id?`#${el.id}`:'';
        const cls=typeof el.className==='string'?el.className.split(' ').slice(0,2).join('.'):'';
        const txt=(el.textContent||el.value||el.placeholder||el.href||'').trim().slice(0,40);
        results.push({
          element:`${tag}${id}${cls?'.'+cls:''}`,text:txt,
          w:Math.round(rect.width),h:Math.round(rect.height),
          cursor:cs.cursor,
          outlineStyle:cs.outlineStyle,outlineWidth:cs.outlineWidth,
          outlineNone:cs.outlineStyle==='none'&&cs.outlineWidth==='0px',
          touchTarget:rect.width>=44&&rect.height>=44,
        });
      });
      return results;
    });
    const navLinks=await page.evaluate(()=>[...document.querySelectorAll('nav a,.nav-link,.nav-logo')].map(a=>({href:a.href,text:a.textContent.trim().slice(0,30)})));
    let filterBtns=[];
    if(pg.name==='work')filterBtns=await page.evaluate(()=>[...document.querySelectorAll('.filter-btn,[data-filter]')].map(b=>({text:b.textContent.trim(),filter:b.dataset.filter,active:b.classList.contains('active'),cursor:window.getComputedStyle(b).cursor})));
    let formFields=[];
    if(pg.name==='contact')formFields=await page.evaluate(()=>[...document.querySelectorAll('input,textarea,select')].map(el=>({id:el.id,name:el.name,type:el.type,required:el.required,placeholder:el.placeholder,hasLabel:!!document.querySelector(`label[for="${el.id}"]`)})));
    report.sectionD[pg.name]={interactiveElements:checks,navLinks,filterBtns,formFields};
    console.log(`  [${pg.name}] ${checks.length} interactive elements`);
    const outlineNone=checks.filter(c=>c.outlineNone&&['button','a'].includes(c.element.split('#')[0].split('.')[0]));
    if(outlineNone.length)console.log(`    WARNING: ${outlineNone.length} buttons/links have outline:none (may break keyboard focus)`);
    const smallTargets=checks.filter(c=>!c.touchTarget&&['button','a'].includes(c.element.split('#')[0].split('.')[0]));
    if(smallTargets.length)console.log(`    WARNING: ${smallTargets.length} buttons/links below 44x44px touch target`);
    await page.close();
  }
}

async function main(){
  console.log('Starting server on port',PORT);
  await new Promise(r=>server.listen(PORT,r));
  const browser=await puppeteer.launch({
    headless:'new',
    args:['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage',
          '--disable-web-security','--enable-unsafe-swiftshader'],
    timeout:60000,
  });
  try{
    await runSectionA(browser);
    await runSectionB(browser);
    await runSectionC(browser);
    await runSectionD(browser);
  }finally{
    await browser.close();
    server.close();
  }
  const reportPath=path.join(__dirname,'comprehensive_audit_results.json');
  fs.writeFileSync(reportPath,JSON.stringify(report,null,2));
  console.log('\nFull report written to:',reportPath);
  console.log('Screenshots in:',OUT);
}
main().catch(e=>{console.error('FATAL:',e);process.exit(1);});
