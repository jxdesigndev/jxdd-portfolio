import sys

with open('script.js', 'r') as f:
    content = f.read()

old_block = """            const ceiling = Bodies.rectangle(width/2, -25, width*2, 50, wallOpts);
            const leftWall = Bodies.rectangle(-25, height/2, 50, height*2, wallOpts);
            const rightWall = Bodies.rectangle(width + 25, height/2, 50, height*2, wallOpts);
            
            Composite.add(world, [floor, ceiling, leftWall, rightWall]);"""

new_block = """            const leftWall = Bodies.rectangle(-25, height/2, 50, height*2, wallOpts);
            const rightWall = Bodies.rectangle(width + 25, height/2, 50, height*2, wallOpts);
            
            Composite.add(world, [floor, leftWall, rightWall]);"""

if old_block in content:
    content = content.replace(old_block, new_block)
    with open('script.js', 'w') as f:
        f.write(content)
    print("Success")
else:
    print("Block not found!")
    
