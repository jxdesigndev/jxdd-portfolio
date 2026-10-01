with open('about.js', 'r') as f:
    js = f.read()

js = js.replace(
    "gsap.fromTo('.hub-logo', { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 1.5, ease: 'power3.out' });",
    """gsap.to('#page', { opacity: 1, duration: 0.7, ease: 'power2.inOut' });
    gsap.fromTo('.hub-logo', { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 1.5, ease: 'power3.out', delay: 0.2 });"""
)

with open('about.js', 'w') as f:
    f.write(js)
