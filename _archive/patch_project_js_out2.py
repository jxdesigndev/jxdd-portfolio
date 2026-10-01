import re

with open('project.js', 'r') as f:
    content = f.read()

out_logic = """
    // Outcome
    if (project.outcome_text) {
      const outHeading = document.createElement('h2');
      outHeading.className = 'reveal';
      outHeading.textContent = 'Outcome';
      contentSection.appendChild(outHeading);

      const cleanHTML = window.DOMPurify ? window.DOMPurify.sanitize(project.outcome_text, { ALLOWED_TAGS: ['b', 'strong', 'i', 'em', 'blockquote', 'p', 'br'] }) : project.outcome_text.replace(/<[^>]*>?/gm, '');
      const tempDiv = document.createElement('div');
      tempDiv.className = 'tiptap-content';
      tempDiv.innerHTML = cleanHTML;
      
      // Add reveal class for GSAP
      tempDiv.querySelectorAll('p, blockquote').forEach(el => el.classList.add('reveal'));
      
      contentSection.appendChild(tempDiv);
    }
"""

content = re.sub(r'    // Outcome\n    if \(project\.outcome_text\) \{\n      const outHeading = document\.createElement\(\'h2\'\);\n      outHeading\.className = \'reveal\';\n      outHeading\.textContent = \'Outcome\';\n      contentSection\.appendChild\(outHeading\);\n\n      const outParas = project\.outcome_text\.split\(\'\\n\\n\'\)\.filter\(p => p\.trim\(\) !== \'\'\);\n      outParas\.forEach\(pText => \{\n        const p = document\.createElement\(\'p\'\);\n        p\.className = \'reveal\';\n        p\.textContent = pText\.trim\(\);\n        contentSection\.appendChild\(p\);\n      \}\);\n    \}', out_logic, content)

with open('project.js', 'w') as f:
    f.write(content)
