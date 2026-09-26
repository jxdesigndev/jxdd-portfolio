#!/bin/bash

# Change pf-image label
sed -i 's/<label class="form-label" for="pf-image">Cover Image URL<\/label>/<label class="form-label" for="pf-image">Thumbnail Image URL (Listings)<\/label>/g' admin.html

# Insert pf-cover and pf-process before pf-persona
cat << 'INNER_EOF' > insert_html.txt
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="pf-cover">Cover Image (single)</label>
            <input type="file" id="pf-cover" class="form-input" accept="image/*">
            <div id="pf-cover-preview" style="margin-top:var(--s-2); font-size:var(--text-xs); color:var(--gray-2); word-break: break-all;"></div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="pf-process">Process Images (Wireframes, Multiple)</label>
            <input type="file" id="pf-process" class="form-input" accept="image/*" multiple>
            <div id="pf-process-preview" style="margin-top:var(--s-2); font-size:var(--text-xs); color:var(--gray-2); word-break: break-all;"></div>
          </div>
        </div>

INNER_EOF

# Find line of pf-persona and insert
line_num=$(grep -n 'for="pf-persona"' admin.html | cut -d: -f1)
insert_line=$((line_num - 2))

head -n $insert_line admin.html > admin_new.html
cat insert_html.txt >> admin_new.html
tail -n +$((insert_line + 1)) admin.html >> admin_new.html

mv admin_new.html admin.html
rm insert_html.txt
