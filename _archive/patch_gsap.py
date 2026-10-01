import sys

with open('script.js', 'r') as f:
    lines = f.readlines()

start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if "// Loop 2: Init physics now that layout is resolved" in line:
        start_idx = i
        break

if start_idx != -1:
    # Find the corresponding end of the block 
    # It ends with "      });" before the catch block
    for i in range(start_idx, len(lines)):
        if "    } catch (err) {" in lines[i]:
            end_idx = i - 1
            break

if start_idx != -1 and end_idx != -1:
    # Ensure end_idx is exactly the closing brace of the forEach loop. 
    # Because of indentation, the last line should be "      });\n"
    # Wait, the line before "    } catch (err) {" might be empty.
    # Let's adjust end_idx back to find "      });"
    while "});" not in lines[end_idx] and end_idx > start_idx:
        end_idx -= 1
        
    replacement = """      // Loop 2: Init premium grid and spotlight interactions
      containers.forEach(container => {
        const newNodes = container._physicsNodes || [];
        if (newNodes.length === 0) return;

        // 1. Dynamic Spotlight Hover Effect
        container.addEventListener('mousemove', (e) => {
          const rect = container.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          container.style.setProperty('--mouse-x', `${x}px`);
          container.style.setProperty('--mouse-y', `${y}px`);
        });

        // 2. Clear any lingering absolute positioning from previous iterations
        newNodes.forEach(el => {
            el.style.position = '';
            el.style.top = '';
            el.style.left = '';
            el.style.margin = '';
        });

        // 3. GSAP Stagger Reveal
        if (window.gsap && window.ScrollTrigger) {
            gsap.fromTo(newNodes, 
                { opacity: 0, y: 20, scale: 0.9 },
                { 
                    opacity: 1, 
                    y: 0, 
                    scale: 1,
                    duration: 0.6, 
                    stagger: 0.04, 
                    ease: 'back.out(1.5)',
                    scrollTrigger: {
                        trigger: container,
                        start: 'top 85%'
                    }
                }
            );
        } else {
            newNodes.forEach(el => {
                el.style.opacity = '1';
                el.style.transform = 'none';
            });
        }
      });\n"""
      
    new_lines = lines[:start_idx] + [replacement]
    # If end_idx ends on '      });\n', then the next line should be the empty line or catch block.
    # So we want to keep everything from end_idx+1 onwards.
    new_lines.extend(lines[end_idx+1:])
    
    with open('script.js', 'w') as f:
        f.writelines(new_lines)
    print(f"Success replacing lines {start_idx} to {end_idx}")
else:
    print("Block not found!")

