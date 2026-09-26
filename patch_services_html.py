import re

with open('services.html', 'r') as f:
    content = f.read()

pattern = re.compile(r'<!-- 01 · Product Design -->.*<!-- 04 · Security -->.*?</div>\s*</div>\s*</div>', re.DOTALL)
content = pattern.sub('', content)

with open('services.html', 'w') as f:
    f.write(content)
