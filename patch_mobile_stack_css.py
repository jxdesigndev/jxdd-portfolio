import re

with open('style.css', 'r') as f:
    content = f.read()

target_pattern = r"/\*\s*Mobile Fallback: Vertical Stack\s*\*/\s*@media\s*\(hover:\s*none\),\s*\(max-width:\s*768px\)\s*\{\s*\.reelfolio-container\s*\{.*?\s*margin:\s*0\s*auto;\s*\}"

replacement = """
    /* Mobile Fallback: Stacked Deck */
    @media (hover: none), (max-width: 768px) {
      .reelfolio-container {
        height: 80vh;
        min-height: 400px;
        padding: 0;
      }
      .reelfolio-card {
        width: 90vw;
        max-width: 380px;
        aspect-ratio: 16/9;
      }
"""

content = re.sub(target_pattern, replacement.strip(), content, flags=re.DOTALL)

with open('style.css', 'w') as f:
    f.write(content)

print("CSS updated for mobile stacked deck.")
