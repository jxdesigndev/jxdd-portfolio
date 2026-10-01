import re

with open('script.js', 'r') as f:
    js = f.read()

js = js.replace("img.loading = 'lazy';", "")

with open('script.js', 'w') as f:
    f.write(js)
