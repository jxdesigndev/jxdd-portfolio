#!/bin/bash
sed -i 's/<label class="form-label" for="pf-image">Thumbnail Image URL (Listings)<\/label>/<label class="form-label" for="pf-image">Thumbnail Image (Listings, single)<\/label>/g' admin.html
sed -i 's/<input type="text" id="pf-image" class="form-input" placeholder="https:\/\/...">/<input type="file" id="pf-image" class="form-input" accept="image\/*">\n          <div id="pf-image-preview" style="margin-top:var(--s-2); font-size:var(--text-xs); color:var(--gray-2); word-break: break-all;"><\/div>/g' admin.html
