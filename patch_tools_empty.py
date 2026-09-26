import re

with open('script.js', 'r') as f:
    js = f.read()

old_hide = """        if (filteredTools.length === 0) {
          // Hide specific empty category
          const group = container.closest('.tools-group') || container;
          group.style.display = 'none';
          return;
        }

        totalRenderedTools += filteredTools.length;

        const group = container.closest('.tools-group');
        if (group) group.style.display = '';"""

new_hide = """        if (filteredTools.length === 0) {
          // Hide specific empty category
          const group = container.closest('.tools-group') || container.closest('.bento-item') || container;
          group.style.display = 'none';
          return;
        }

        totalRenderedTools += filteredTools.length;

        const group = container.closest('.tools-group') || container.closest('.bento-item');
        if (group) group.style.display = '';"""

js = js.replace(old_hide, new_hide)

with open('script.js', 'w') as f:
    f.write(js)
