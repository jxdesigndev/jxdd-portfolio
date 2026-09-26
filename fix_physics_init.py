import re

with open('script.js', 'r') as f:
    js = f.read()

# 1. We need to split the containers.forEach loop into two.
# The first loop builds the DOM.
# Then we show the section.
# Then the second loop inits the physics.

old_block = """        // Matter.js Physics implementation
        if (container.classList.contains('physics-grid')) {
          // Force visibility immediately
          newNodes.forEach(el => {
            el.style.opacity = '1';
            el.style.transform = 'none';
          });
          
          if (window.Matter && newNodes.length > 0) {
            const Engine = Matter.Engine,
                  Render = Matter.Render,
                  Runner = Matter.Runner,
                  Bodies = Matter.Bodies,
                  Composite = Matter.Composite,
                  Mouse = Matter.Mouse,
                  MouseConstraint = Matter.MouseConstraint,
                  Events = Matter.Events;

            const engine = Engine.create();
            const world = engine.world;
            
            // Container dimensions
            const rect = container.getBoundingClientRect();
            const width = rect.width || 400;
            const height = rect.height || 240;

            // Walls (invisible)
            const wallOpts = { isStatic: true, render: { visible: false } };
            const floor = Bodies.rectangle(width/2, height + 25, width*2, 50, wallOpts);
            const leftWall = Bodies.rectangle(-25, height/2, 50, height*2, wallOpts);
            const rightWall = Bodies.rectangle(width + 25, height/2, 50, height*2, wallOpts);
            const ceiling = Bodies.rectangle(width/2, -100, width*2, 50, wallOpts);
            
            Composite.add(world, [floor, leftWall, rightWall, ceiling]);

            const bodyMap = [];
            const size = 64; // Approximated box size for tool

            newNodes.forEach((node, i) => {
               // Random start position near top
               const startX = (width / 2) + (Math.random() * 100 - 50);
               const startY = Math.random() * -100 - 50;
               const body = Bodies.rectangle(startX, startY, size, size, {
                   restitution: 0.6, // Bounciness
                   friction: 0.1,
                   density: 0.04
               });
               bodyMap.push({ body, node });
               Composite.add(world, body);
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
            Composite.add(world, mouseConstraint);

            // Sync DOM elements with Physics bodies
            Events.on(engine, 'afterUpdate', function() {
                bodyMap.forEach(({ body, node }) => {
                    const x = body.position.x - size/2;
                    const y = body.position.y - size/2;
                    // Apply position and rotation
                    node.style.transform = `translate(${x}px, ${y}px) rotate(${body.angle}rad)`;
                });
            });

            // Run Physics
            Runner.run(Runner.create(), engine);
          }
        }
      });

      const globalSection = document.getElementById('tools-section');
      if (globalSection) {
        if (totalRenderedTools > 0) {
          globalSection.style.display = '';
        } else {
          globalSection.style.display = 'none';
        }
      }"""

new_block = """        // Store nodes for physics init later
        container._physicsNodes = newNodes;
      }); // end first loop

      const globalSection = document.getElementById('tools-section');
      if (globalSection) {
        if (totalRenderedTools > 0) {
          globalSection.style.display = 'block'; // MUST BE BLOCK BEFORE PHYSICS
        } else {
          globalSection.style.display = 'none';
        }
      }

      // Loop 2: Init physics now that layout is resolved
      containers.forEach(container => {
        const newNodes = container._physicsNodes || [];
        if (container.classList.contains('physics-grid')) {
          // Force visibility immediately
          newNodes.forEach(el => {
            el.style.opacity = '1';
            el.style.transform = 'none';
          });
          
          if (window.Matter && newNodes.length > 0) {
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
            const ceiling = Bodies.rectangle(width/2, -100, width*2, 50, wallOpts);
            
            Composite.add(world, [floor, leftWall, rightWall, ceiling]);

            const bodyMap = [];
            const size = 64; // Approximated box size for tool

            newNodes.forEach((node, i) => {
               // Random start position near top across the ENTIRE width
               const startX = Math.random() * (width - size) + (size / 2);
               const startY = (Math.random() * -200) - 50;
               const body = Bodies.rectangle(startX, startY, size, size, {
                   restitution: 0.6, // Bounciness
                   friction: 0.1,
                   density: 0.04
               });
               bodyMap.push({ body, node });
               Composite.add(world, body);
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
            Composite.add(world, mouseConstraint);

            // Sync DOM elements with Physics bodies
            Events.on(engine, 'afterUpdate', function() {
                bodyMap.forEach(({ body, node }) => {
                    const x = body.position.x - size/2;
                    const y = body.position.y - size/2;
                    // Apply position and rotation
                    node.style.transform = `translate(${x}px, ${y}px) rotate(${body.angle}rad)`;
                });
            });

            // Run Physics
            Runner.run(Runner.create(), engine);
          }
        }
      });"""

js = js.replace(old_block, new_block)

with open('script.js', 'w') as f:
    f.write(js)
