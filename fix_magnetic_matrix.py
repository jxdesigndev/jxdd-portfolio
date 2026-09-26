import re

with open('script.js', 'r') as f:
    js = f.read()

old_block = """          if (window.Matter && newNodes.length > 0) {
            const Engine = Matter.Engine,
                  Runner = Matter.Runner,
                  Bodies = Matter.Bodies,
                  Composite = Matter.Composite,
                  Mouse = Matter.Mouse,
                  MouseConstraint = Matter.MouseConstraint,
                  Events = Matter.Events;

            const engine = Engine.create();
            const world = engine.world;
            
            // Container dimensions (NOW ACCURATE)
            const rect = container.getBoundingClientRect();
            const width = rect.width || 400;
            const height = rect.height || 240;

            // Walls (invisible)
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
               const startY = (Math.random() * -400) - 100;
               const body = Bodies.rectangle(startX, startY, size, size, {
                   restitution: 0.6, // Bounciness
                   friction: 0.1,
                   density: 0.04
               });
               bodyMap.push({ body, node });
               Composite.add(world, body);
            });"""


new_block = """          if (window.Matter && newNodes.length > 0) {
            const Engine = Matter.Engine,
                  Runner = Matter.Runner,
                  Bodies = Matter.Bodies,
                  Composite = Matter.Composite,
                  Constraint = Matter.Constraint,
                  Mouse = Matter.Mouse,
                  MouseConstraint = Matter.MouseConstraint,
                  Events = Matter.Events;

            const engine = Engine.create();
            const world = engine.world;
            
            // Turn off gravity for magnetic matrix effect
            engine.world.gravity.y = 0;
            engine.world.gravity.x = 0;
            
            // Container dimensions
            const rect = container.getBoundingClientRect();
            const width = rect.width || 400;
            const height = rect.height || 240;

            // Walls (invisible) so they don't get thrown out
            const wallOpts = { isStatic: true, render: { visible: false } };
            const floor = Bodies.rectangle(width/2, height + 25, width*2, 50, wallOpts);
            const ceiling = Bodies.rectangle(width/2, -25, width*2, 50, wallOpts);
            const leftWall = Bodies.rectangle(-25, height/2, 50, height*2, wallOpts);
            const rightWall = Bodies.rectangle(width + 25, height/2, 50, height*2, wallOpts);
            
            Composite.add(world, [floor, ceiling, leftWall, rightWall]);

            const bodyMap = [];
            const size = 64; // Approximated box size for tool
            const gap = 24;  // Gap between grid items
            const itemSize = size + gap;
            
            // Calculate grid columns and rows based on container width
            // leaving some padding around edges
            const cols = Math.max(1, Math.floor((width - 40) / itemSize));
            const rows = Math.ceil(newNodes.length / cols);
            
            // Calculate grid total dimensions to center it
            const gridWidth = cols * itemSize;
            const gridHeight = rows * itemSize;
            
            const startX = (width - gridWidth) / 2 + (itemSize / 2);
            // Center vertically, but ensure it doesn't clip top
            const startY = Math.max(itemSize / 2 + 10, (height - gridHeight) / 2 + (itemSize / 2));

            newNodes.forEach((node, i) => {
               // Calculate exact target position for this node in the grid
               const col = i % cols;
               const row = Math.floor(i / cols);
               const targetX = startX + (col * itemSize);
               const targetY = startY + (row * itemSize);
               
               // Spawn them slightly offset from target so they smoothly slide into place on load
               const body = Bodies.rectangle(targetX + (Math.random() * 20 - 10), targetY + (Math.random() * 20 - 10), size, size, {
                   restitution: 0.8, // Bounciness against other nodes
                   friction: 0.1,
                   frictionAir: 0.05, // Important for the floating magnetic feel
                   density: 0.05
               });
               
               // The invisible rubber band constraint
               const spring = Constraint.create({
                   pointA: { x: targetX, y: targetY },
                   bodyB: body,
                   stiffness: 0.015, // Low stiffness = loose, smooth rubber band
                   damping: 0.05,
                   render: { visible: false }
               });
               
               bodyMap.push({ body, node });
               Composite.add(world, [body, spring]);
            });"""

if old_block in js:
    js = js.replace(old_block, new_block)
    with open('script.js', 'w') as f:
        f.write(js)
    print("Patch applied successfully.")
else:
    print("Old block not found.")
