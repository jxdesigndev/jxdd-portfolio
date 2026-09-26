import re

with open('script.js', 'r') as f:
    js = f.read()

old_block = """            newNodes.forEach((node, i) => {
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
            });

            // Add Mouse Control
            const mouse = Mouse.create(container);
            const mouseConstraint = MouseConstraint.create(engine, {
                mouse: mouse,
                constraint: {
                    stiffness: 0.2,
                    render: { visible: false }
                }
            });
            Composite.add(world, mouseConstraint);"""

new_block = """            newNodes.forEach((node, i) => {
               // Calculate exact target position for this node in the grid
               const col = i % cols;
               const row = Math.floor(i / cols);
               const targetX = startX + (col * itemSize);
               const targetY = startY + (row * itemSize);
               
               // PROPER ENTRANCE: Spawn them wildly scattered outside the box so they violently fly in
               const spawnX = Math.random() * width;
               const spawnY = (Math.random() * -300) - 100; // Drop from above
               
               const body = Bodies.rectangle(spawnX, spawnY, size, size, {
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
            });

            // Add Mouse Control (Click & Drag)
            const mouse = Mouse.create(container);
            const mouseConstraint = MouseConstraint.create(engine, {
                mouse: mouse,
                constraint: {
                    stiffness: 0.2,
                    render: { visible: false }
                }
            });
            Composite.add(world, mouseConstraint);
            
            // PROPER HOVER REPULSION: Magnetic dodging
            container.addEventListener('mousemove', (e) => {
                const rect = container.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;
                
                bodyMap.forEach(({ body }) => {
                    const dx = body.position.x - mouseX;
                    const dy = body.position.y - mouseY;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    // Repel radius of 120px
                    if (dist < 120 && dist > 0) {
                        const forceMagnitude = 0.005 * (120 - dist) / 120;
                        Matter.Body.applyForce(body, body.position, {
                            x: (dx / dist) * forceMagnitude,
                            y: (dy / dist) * forceMagnitude
                        });
                    }
                });
            });"""

if old_block in js:
    js = js.replace(old_block, new_block)
    with open('script.js', 'w') as f:
        f.write(js)
    print("Script patch applied successfully.")
else:
    print("Old block not found.")
