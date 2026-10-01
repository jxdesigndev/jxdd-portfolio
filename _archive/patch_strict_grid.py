import sys

with open('script.js', 'r') as f:
    content = f.read()

# Step 1 blocks
old_block_1 = """               // PROPER ENTRANCE: Spawn them dynamically INSIDE the visible box
               const spawnX = (width / 2) + (Math.random() * 40 - 20);
               const spawnY = (height / 2) + (Math.random() * 40 - 20);
               
               const body = Bodies.rectangle(spawnX, spawnY, size, size, {
                   restitution: 0.8,
                   friction: 0.1,
                   frictionAir: 0.01, // Reduced friction so they snap into the grid instantly
                   density: 0.05
               });
               
               // The invisible rubber band constraint
               const spring = Constraint.create({
                   pointA: { x: targetX, y: targetY },
                   bodyB: body,
                   stiffness: 0.015, // Low stiffness = loose, smooth rubber band
                   damping: 0.05,
                   render: { visible: false }
               });"""

new_block_1 = """               // PERFECT ARRANGEMENT: Spawn directly into the calculated grid targets
               const spawnX = targetX;
               const spawnY = targetY;
               
               const body = Bodies.rectangle(spawnX, spawnY, size, size, {
                   restitution: 0.2, // Lower bounce to prevent chaotic tangling
                   friction: 0.1,
                   frictionAir: 0.05, // Higher air drag to keep them stable
                   density: 0.05,
                   inertia: Infinity // Mathematically locks rotation so they stay upright
               });
               
               // The invisible rubber band constraint
               const spring = Constraint.create({
                   pointA: { x: targetX, y: targetY },
                   bodyB: body,
                   stiffness: 0.08, // Tighter spring for a strict, professional grid
                   damping: 0.05,
                   render: { visible: false }
               });"""

# Step 2 blocks
old_block_2 = """            // Sync DOM elements with Physics bodies
            Events.on(engine, 'afterUpdate', function() {
                bodyMap.forEach(({ body, node }) => {
                    const x = body.position.x - size/2;
                    const y = body.position.y - size/2;
                    // Apply position and rotation
                    node.style.transform = `translate(${x}px, ${y}px) rotate(${body.angle}rad)`;
                });
            });"""

new_block_2 = """            // Sync DOM elements with Physics bodies
            Events.on(engine, 'afterUpdate', function() {
                bodyMap.forEach(({ body, node }) => {
                    const x = body.position.x - size/2;
                    const y = body.position.y - size/2;
                    // Apply position ONLY, keeping logos perfectly upright
                    node.style.transform = `translate(${x}px, ${y}px)`;
                });
            });"""

if old_block_1 in content and old_block_2 in content:
    content = content.replace(old_block_1, new_block_1)
    content = content.replace(old_block_2, new_block_2)
    with open('script.js', 'w') as f:
        f.write(content)
    print("Success")
else:
    print("Block not found!")
    if old_block_1 not in content: print("Missing block 1")
    if old_block_2 not in content: print("Missing block 2")

