import re

with open('script.js', 'r') as f:
    js = f.read()

old_scramble = """      function scrambleText(element, originalText) {
        let iterations = 0;
        const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
        const interval = setInterval(() => {
          element.textContent = originalText.split("").map((letter, index) => {
            if(index < iterations) {
              return originalText[index];
            }
            return letters[Math.floor(Math.random() * letters.length)]
          }).join("");
          if(iterations >= originalText.length) {
            clearInterval(interval);
          }
          iterations += 1;
        }, 15);
      }"""

new_scramble = """      function scrambleText(element, originalText) {
        if (element.dataset.scrambling === 'true') return;
        element.dataset.scrambling = 'true';
        let iterations = 0;
        const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
        const interval = setInterval(() => {
          element.textContent = originalText.split("").map((letter, index) => {
            if(index < Math.floor(iterations)) {
              return originalText[index];
            }
            return letters[Math.floor(Math.random() * letters.length)]
          }).join("");
          if(iterations >= originalText.length) {
            clearInterval(interval);
            element.dataset.scrambling = 'false';
            element.textContent = originalText;
          }
          iterations += 1/2; // Smoother decrypt reveal
        }, 20);
      }"""

js = js.replace(old_scramble, new_scramble)

with open('script.js', 'w') as f:
    f.write(js)
