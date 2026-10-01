import sys

with open('script.js', 'r') as f:
    content = f.read()

old_block = """               // PROPER ENTRANCE: Spawn them wildly scattered outside the box so they violently fly in
               const spawnX = Math.random() * width;
               const spawnY = (Math.random() * -300) - 100; // Drop from above
               
               const body = Bodies.rectangle(spawnX, spawnY, size, size, {
                   restitution: 0.8, // Bounciness against other nodes
                   friction: 0.1,
                   frictionAir: 0.05, // Important for the floating magnetic feel
                   density: 0.05
               });"""

new_block = """               // PROPER ENTRANCE: Spawn them dynamically INSIDE the visible box
               const spawnX = (width / 2) + (Math.random() * 40 - 20);
               const spawnY = (height / 2) + (Math.random() * 40 - 20);
               
               const body = Bodies.rectangle(spawnX, spawnY, size, size, {
                   restitution: 0.8,
                   friction: 0.1,
                   frictionAir: 0.01, // Reduced friction so they snap into the grid instantly
                   density: 0.05
               });"""

if old_block in content:
    content = content.replace(old_block, new_block)
    with open('script.js', 'w') as f:
        f.write(content)
    print("Success")
else:
    print("Block not found!")

