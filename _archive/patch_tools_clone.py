import re

with open('script.js', 'r') as f:
    js = f.read()

old_loop = """        filteredTools.forEach(tool => {
          const item = document.createElement('div');
          item.className = 'tool-item';

          if (tool.logo_url) {
            const img = document.createElement('img');
            img.src    = tool.logo_url;
            img.alt    = tool.name;
            img.title  = tool.name;
            img.width  = 48;
            img.height = 48;
            img.loading = 'lazy';
            item.appendChild(img);
          } else {
            const label = document.createElement('span');
            label.className   = 'tool-item-name';
            label.textContent = tool.name;
            item.appendChild(label);
          }

          container.appendChild(item);
          newNodes.push(item);
        });

        /* Animate */"""

new_loop = """        filteredTools.forEach(tool => {
          const item = document.createElement('div');
          item.className = 'tool-item';

          if (tool.logo_url) {
            const img = document.createElement('img');
            img.src    = tool.logo_url;
            img.alt    = tool.name;
            img.title  = tool.name;
            img.width  = 48;
            img.height = 48;
            img.loading = 'lazy';
            item.appendChild(img);
          } else {
            const label = document.createElement('span');
            label.className   = 'tool-item-name';
            label.textContent = tool.name;
            item.appendChild(label);
          }

          container.appendChild(item);
          newNodes.push(item);
        });
        
        if (container.classList.contains('marquee-track')) {
          // Clone nodes for infinite scroll
          const clones = newNodes.map(n => n.cloneNode(true));
          clones.forEach(c => container.appendChild(c));
          // Add second set just in case the track is short
          const clones2 = newNodes.map(n => n.cloneNode(true));
          clones2.forEach(c => container.appendChild(c));
        }

        /* Animate */"""

js = js.replace(old_loop, new_loop)

with open('script.js', 'w') as f:
    f.write(js)
