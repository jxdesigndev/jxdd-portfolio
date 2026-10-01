import re

with open('project.html', 'r') as f:
    html = f.read()

# Replace the grid CSS with masonry CSS Columns
old_css = """  .screenshot-gallery {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: var(--s-8);
    align-items: start;
    margin: var(--s-16) 0;
  }

  .screenshot-frame {
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
    transform: translateY(-8px) scale(1.02);
    box-shadow: inset 0 0 40px rgba(255,255,255,0.05), 0 20px 40px rgba(0,255,170,0.2);
  }

  .screenshot-gallery.single-portrait {
    grid-template-columns: minmax(260px, 480px);
    justify-content: center;
  }

  /* Landscape always spans full row */
  .screenshot-frame.frame-landscape {
    grid-column: 1 / -1;
  }

  /* Orphan last portrait: if there's an odd one out, let it fill the row gracefully */
  .screenshot-frame.frame-portrait:last-child:nth-child(odd) {
    grid-column: 1 / -1;
    max-width: 480px;
    justify-self: center;
  }"""

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
    transform: translateY(-8px) scale(1.02);
    box-shadow: inset 0 0 40px rgba(255,255,255,0.05), 0 20px 40px rgba(0,255,170,0.2);
  }

  .screenshot-gallery.single-portrait {
    column-count: 1;
    max-width: 480px;
    margin: var(--s-16) auto;
  }

  /* Landscape spans full width of masonry if possible */
  .screenshot-frame.frame-landscape {
    column-span: all;
    -webkit-column-span: all;
  }"""

html = html.replace(old_css, new_css)

with open('project.html', 'w') as f:
    f.write(html)
