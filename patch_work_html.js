const fs = require('fs');
let html = fs.readFileSync('work.html', 'utf8');

const oldSchema = `<script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": "https://www.jxdesign.dev/work.html",
    "url": "https://www.jxdesign.dev/work.html",
    "name": "The Vault | Work | JX Design & Dev",
    "description": "Portfolio of projects by Okezie Ferdinand — Product Design, Full-Stack Development, Automation, and Cybersecurity.",
    "author": {
      "@id": "https://www.jxdesign.dev/#person"
    },
    "hasPart": [
      {
        "@type": "CreativeWork",
        "name": "Zenflow",
        "url": "https://www.jxdesign.dev/projects/zenflow.html",
        "description": "A wellness app concept for women combining yoga and strength training into a single unified experience.",
        "image": "https://www.jxdesign.dev/assets/images/zenflow-cover.webp",
        "author": {
          "@id": "https://www.jxdesign.dev/#person"
        },
        "dateCreated": "2026",
        "genre": "Product Design"
      }
    ]
  }
  </script>`;

const newSchema = `<script type="application/ld+json" id="schema-work">
  {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": "https://www.jxdesign.dev/work.html",
    "url": "https://www.jxdesign.dev/work.html",
    "name": "The Vault | Work | JX Design & Dev",
    "description": "Portfolio of projects by Okezie Ferdinand — Product Design, Full-Stack Development, Automation, and Cybersecurity.",
    "author": {
      "@id": "https://www.jxdesign.dev/#person"
    }
  }
  </script>`;

if (html.includes(oldSchema)) {
  html = html.replace(oldSchema, newSchema);
  fs.writeFileSync('work.html', html);
  console.log("work.html patched successfully");
} else {
  console.log("Could not find exact schema to replace. Checking structure...");
}
