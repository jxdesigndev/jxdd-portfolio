import re

with open('project.html', 'r') as f:
    html = f.read()

# Use regex to find the block we want to replace
pattern = re.compile(r'\.screenshot-gallery \{.*?\.screenshot-frame\.frame-portrait:last-child:nth-child\(odd\) \{.*?\n  \}', re.DOTALL)

new_css = """  .screenshot-gallery {
    column-count: 2;
    column-gap: var(--s-8);
    margin: var(--s-16) 0;
  }

  @media (max-width: 768px) {
    .screenshot-gallery {
      column-count: 1;
    }
  }

  .screenshot-frame {
    break-inside: avoid;
    -webkit-column-break-inside: avoid;
    page-break-inside: avoid;
    margin-bottom: var(--s-8);
    background: linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01));
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 16px;
    padding: var(--s-8);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-shadow: inset 0 0 40px rgba(0,0,0,0.2), 0 10px 30px rgba(0,0,0,0.3);
    width: 100%;
    cursor: pointer;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }

  .screenshot-frame:hover {
    transform: translateY(-4px);
    box-shadow: inset 0 0 40px rgba(0,0,0,0.2), 0 20px 40px rgba(0,0,0,0.5);
  }

  .screenshot-gallery.single-portrait {
    column-count: 1;
    max-width: 480px;
    margin: var(--s-16) auto;
  }

  .screenshot-frame.frame-landscape {
    column-span: all;
    -webkit-column-span: all;
  }"""

if pattern.search(html):
    html = pattern.sub(new_css, html)
    print("SUCCESS: CSS block replaced.")
else:
    print("FAILED: Could not find regex pattern.")

with open('project.html', 'w') as f:
    f.write(html)
