#!/bin/bash
sed -i 's/width: clamp(32px, 5vw, 56px); height: clamp(32px, 5vw, 56px);/width: 48px; height: 48px;/g' style.css
# Now re-apply only to .tool-item img
sed -i '/.tool-item img {/,/}/ s/width: 48px;/width: clamp(32px, 5vw, 56px);/' style.css
sed -i '/.tool-item img {/,/}/ s/height: 48px;/height: clamp(32px, 5vw, 56px);/' style.css
