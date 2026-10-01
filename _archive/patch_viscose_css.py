import re

with open('style.css', 'r') as f:
    content = f.read()

new_css = """
@media (max-width: 768px) {
  .viscose-details {
    flex-direction: column;
    height: 80vh;
    top: 50%;
    transform: translateY(-50%);
    justify-content: space-between;
    padding: 0 4vw;
  }
  .vd-left, .vd-right {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--s-2);
  }
  .vd-right {
    align-items: flex-end;
    text-align: right;
  }
  .vd-title {
    font-size: clamp(2.5rem, 8vw, 4rem);
  }
  .viscose-card {
    width: 32vh; /* Make it slightly smaller natively to prevent screen crush */
  }
}
"""

content += "\n" + new_css.strip() + "\n"

with open('style.css', 'w') as f:
    f.write(content)

print("CSS updated for mobile viscose.")
