import sys

with open('script.js', 'r') as f:
    script_content = f.read()

old_script_block = """      // Loop 2: Init premium grid and spotlight interactions
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
      });"""

new_script_block = """      // Loop 2: Init premium grid and spotlight interactions
      containers.forEach(container => {
        const newNodes = container._physicsNodes || [];
        if (newNodes.length === 0) return;

        // Clean CSS-native stagger reveal (No GSAP conflicts)
        newNodes.forEach((el, index) => {
            el.style.position = '';
            el.style.top = '';
            el.style.left = '';
            el.style.margin = '';
            el.style.opacity = '0';
            el.style.transform = '';
            
            setTimeout(() => {
                el.classList.add('tool-reveal');
            }, index * 60);
        });
      });"""

if old_script_block in script_content:
    script_content = script_content.replace(old_script_block, new_script_block)
    with open('script.js', 'w') as f:
        f.write(script_content)
    print("Script JS replaced successfully.")
else:
    print("Script JS block not found.")

with open('style.css', 'r') as f:
    style_content = f.read()

import re
css_marker = "/* --- PREMIUM BENTO TOOL GRID --- */"
if css_marker in style_content:
    # Everything from the marker to the end
    prefix = style_content.split(css_marker)[0]
    
    new_css = """/* --- PREMIUM BENTO TOOL GRID --- */
.db-tools-container {
    display: grid !important;
    grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
    gap: 1.25rem;
    width: 100%;
    /* Removed the ugly double-padding and backgrounds */
}

/* Individual Tool Cards */
.tool-item {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    aspect-ratio: 1;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.tool-reveal {
    animation: tool-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes tool-pop {
    0% { opacity: 0; transform: translateY(15px) scale(0.9); }
    100% { opacity: 1; transform: translateY(0) scale(1); }
}

.tool-item img {
    width: 44px; /* Increased from 36px to 44px for maximum clarity */
    height: 44px;
    object-fit: contain;
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
    transition: filter 0.3s ease;
    /* Moved ambient float to the image to prevent transform conflicts with the parent */
    animation: ambient-float 6s ease-in-out infinite; 
}

/* Staggered breathing offset */
.tool-item:nth-child(even) img { animation-delay: -3s; }
.tool-item:nth-child(3n) img { animation-delay: -1.5s; }

.tool-item:hover {
    transform: translateY(-4px) scale(1.05);
    border-color: rgba(0, 255, 170, 0.5);
    background: rgba(0, 255, 170, 0.05);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3), 0 0 15px rgba(0, 255, 170, 0.2);
    z-index: 2;
}

.tool-item:hover img {
    filter: drop-shadow(0 4px 10px rgba(0, 255, 170, 0.6));
}

@keyframes ambient-float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-4px); }
}
"""
    with open('style.css', 'w') as f:
        f.write(prefix + new_css)
    print("Style CSS replaced successfully.")
else:
    print("CSS marker not found.")
    
