import re

with open('script.js', 'r') as f:
    js = f.read()

old_block = """            // Walls (invisible)
            const wallOpts = { isStatic: true, render: { visible: false } };
            const floor = Bodies.rectangle(width/2, height + 25, width*2, 50, wallOpts);
            const leftWall = Bodies.rectangle(-25, height/2, 50, height*2, wallOpts);
            const rightWall = Bodies.rectangle(width + 25, height/2, 50, height*2, wallOpts);
            const ceiling = Bodies.rectangle(width/2, -100, width*2, 50, wallOpts);
            
            Composite.add(world, [floor, leftWall, rightWall, ceiling]);

            const bodyMap = [];
            const size = 64; // Approximated box size for tool

            newNodes.forEach((node, i) => {
               // Random start position near top across the ENTIRE width
               const startX = Math.random() * (width - size) + (size / 2);
               const startY = (Math.random() * -200) - 50;"""

new_block = """            // Walls (invisible)
            const wallOpts = { isStatic: true, render: { visible: false } };
            const floor = Bodies.rectangle(width/2, height + 25, width*2, 50, wallOpts);
            const leftWall = Bodies.rectangle(-25, height/2, 50, height*2, wallOpts);
            const rightWall = Bodies.rectangle(width + 25, height/2, 50, height*2, wallOpts);
            
            // Ceiling removed so items can spawn high and drop in, and be thrown into the air
            Composite.add(world, [floor, leftWall, rightWall]);

            const bodyMap = [];
            const size = 64; // Approximated box size for tool

            newNodes.forEach((node, i) => {
               // Random start position high above the box across the ENTIRE width
               const startX = Math.random() * (width - size) + (size / 2);
               const startY = (Math.random() * -400) - 100;"""

if old_block in js:
    js = js.replace(old_block, new_block)
    with open('script.js', 'w') as f:
        f.write(js)
    print("Patch applied successfully.")
else:
    print("Old block not found.")
