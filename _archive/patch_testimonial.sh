#!/bin/bash
cat << 'INNER_EOF' > temp_testimonial.txt
        <div class="form-group">
          <label class="form-label" for="tf-quote">Quote Text *</label>
          <textarea id="tf-quote" class="form-textarea" rows="3" required></textarea>
        </div>

        <div class="form-group">
          <label class="form-label" for="tf-website">Client Website URL</label>
          <input type="url" id="tf-website" class="form-input" placeholder="https://...">
        </div>
INNER_EOF

# Replace tf-quote block with the updated block
sed -i -e '/<label class="form-label" for="tf-quote">Quote Text \*<\/label>/,/<textarea id="tf-quote" class="form-textarea" rows="3" required><\/textarea>/c\
          <label class="form-label" for="tf-quote">Quote Text *<\/label>\
          <textarea id="tf-quote" class="form-textarea" rows="3" required><\/textarea>\
        <\/div>\
\
        <div class="form-group">\
          <label class="form-label" for="tf-website">Client Website URL<\/label>\
          <input type="url" id="tf-website" class="form-input" placeholder="https://...">\
' admin.html

