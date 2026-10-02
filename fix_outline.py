import glob
import re

css_files = glob.glob("*.css")
outline_pattern = re.compile(r'outline\s*:\s*none\s*;?')

for file in css_files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = outline_pattern.sub('/* outline removed for a11y */', content)
    
    if new_content != content:
        print(f"Fixed {file}")
        with open(file, 'w', encoding='utf-8') as f:
            f.write(new_content)

# Append to style.css
with open('style.css', 'a', encoding='utf-8') as f:
    f.write('\n\n/* Global a11y focus ring added to replace outline: none */\n*:focus-visible { outline: 2px solid var(--green); outline-offset: 2px; }\n')

