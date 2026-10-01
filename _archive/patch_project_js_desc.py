import re

with open('project.js', 'r') as f:
    content = f.read()

# Replace description
desc_logic = """
      if (project.description) {
        const cleanHTML = window.DOMPurify ? window.DOMPurify.sanitize(project.description, { ALLOWED_TAGS: ['b', 'strong', 'i', 'em', 'blockquote', 'p', 'br'] }) : project.description.replace(/<[^>]*>?/gm, '');
        const tempDiv = document.createElement('div');
        tempDiv.className = 'tiptap-content';
        tempDiv.innerHTML = cleanHTML;
        
        // Add reveal class to paragraphs for GSAP
        tempDiv.querySelectorAll('p, blockquote').forEach(el => el.classList.add('reveal'));
        
        textWrapper.appendChild(tempDiv);
      }
"""

content = re.sub(r'      if \(project\.description\) \{\n        // Split description by double newlines into paragraphs\n        const paras = project\.description\.split\(\'\\n\\n\'\)\.filter\(p => p\.trim\(\) !== \'\'\);\n        paras\.forEach\(pText => \{\n          const p = document\.createElement\(\'p\'\);\n          p\.className = \'reveal\';\n          p\.textContent = pText\.trim\(\);\n          textWrapper\.appendChild\(p\);\n        \}\);\n      \}', desc_logic, content)

with open('project.js', 'w') as f:
    f.write(content)
