const fs = require('fs');
let js = fs.readFileSync('work.js', 'utf8');

const anchor = `      if (allProjects.length > 0) {
        initViscoseRing(allProjects);
      } else {`;

const injection = `      if (allProjects.length > 0) {
        initViscoseRing(allProjects);
        
        // Dynamically populate JSON-LD CollectionPage hasPart
        try {
          const ldScript = document.getElementById('schema-work');
          if (ldScript) {
            const ldData = JSON.parse(ldScript.textContent);
            ldData.hasPart = allProjects.map(p => ({
              "@type": "CreativeWork",
              "name": p.title || p.name || "",
              "url": p.slug ? \`https://www.jxdesign.dev/project.html?slug=\${encodeURIComponent(p.slug)}\` : "https://www.jxdesign.dev/work.html",
              "description": p.shortDesc || "",
              "image": p.cover_image_url || p.image_url || "",
              "author": { "@id": "https://www.jxdesign.dev/#person" },
              "dateCreated": p.year || "",
              "genre": p.category || ""
            }));
            ldScript.textContent = JSON.stringify(ldData, null, 2);
          }
        } catch (e) {
          console.warn("Failed to update JSON-LD", e);
        }
      } else {`;

if (js.includes(anchor)) {
  js = js.replace(anchor, injection);
  fs.writeFileSync('work.js', js);
  console.log("work.js patched successfully");
} else {
  console.log("Failed to find anchor in work.js");
}
