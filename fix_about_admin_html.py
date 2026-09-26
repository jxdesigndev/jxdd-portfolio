import re

with open('admin.html', 'r') as f:
    html = f.read()

old_form = """          <form id="video-form">
            <div class="form-group">
              <label class="form-label" for="setting-about-video">Upload Intro Video (MP4 / WebM)</label>
              <input type="file" id="setting-about-video" class="form-input" accept="video/mp4,video/webm">
            </div>
            <div class="form-group" style="margin-top:var(--s-4);">
              <label class="form-label">Current Video URL</label>
              <input type="url" id="setting-about-video-preview" class="form-input" readonly placeholder="No video uploaded yet">
            </div>
            <button type="submit" id="btn-upload-video" class="btn btn-primary btn-sm" style="margin-top:var(--s-4);">Upload Video</button>
          </form>"""

new_form = """          <form id="video-form">
            <div class="form-group">
              <label class="form-label" for="setting-about-video">Upload Intro Video (MP4 / WebM)</label>
              <input type="file" id="setting-about-video" class="form-input" accept="video/mp4,video/webm">
            </div>
            <div class="form-group" style="margin-top:var(--s-2);">
              <label class="form-label">Current Video URL</label>
              <input type="url" id="setting-about-video-preview" class="form-input" readonly placeholder="No video uploaded yet">
            </div>
            <div class="form-group" style="margin-top:var(--s-4);">
              <label class="form-label" for="setting-about-poster">Upload Intro Poster (Image)</label>
              <input type="file" id="setting-about-poster" class="form-input" accept="image/*">
            </div>
            <div class="form-group" style="margin-top:var(--s-2);">
              <label class="form-label">Current Poster URL</label>
              <input type="url" id="setting-about-poster-preview" class="form-input" readonly placeholder="No poster uploaded yet">
            </div>
            <button type="submit" id="btn-upload-video" class="btn btn-primary btn-sm" style="margin-top:var(--s-4);">Save About Media</button>
          </form>"""

html = html.replace(old_form, new_form)
with open('admin.html', 'w') as f:
    f.write(html)
