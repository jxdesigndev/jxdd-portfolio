import sys

with open('script.js', 'r') as f:
    content = f.read()

old_block = """        if (category && category !== 'all') {
          const cats = category.split(',').map(c => c.trim().toLowerCase());
          filteredTools = tools.filter(t => cats.includes((t.category || '').toLowerCase()));
        }"""

new_block = """        if (category && category !== 'all') {
          const cats = category.split(',').map(c => c.trim().toLowerCase());
          filteredTools = tools.filter(t => {
            const dbCat = (t.category || '').toLowerCase();
            return cats.some(c => dbCat.includes(c));
          });
        }"""

if old_block in content:
    content = content.replace(old_block, new_block)
    with open('script.js', 'w') as f:
        f.write(content)
    print("Success")
else:
    print("Block not found!")
    
