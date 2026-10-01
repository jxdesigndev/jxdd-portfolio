import re

with open('admin.js', 'r') as f:
    js = f.read()

# Add DOM elements
old_dom = """    settingAboutVideo: document.getElementById('setting-about-video'),
    settingAboutVideoPreview: document.getElementById('setting-about-video-preview'),
    btnUploadVideo: document.getElementById('btn-upload-video'),"""

new_dom = """    settingAboutVideo: document.getElementById('setting-about-video'),
    settingAboutVideoPreview: document.getElementById('setting-about-video-preview'),
    settingAboutPoster: document.getElementById('setting-about-poster'),
    settingAboutPosterPreview: document.getElementById('setting-about-poster-preview'),
    btnUploadVideo: document.getElementById('btn-upload-video'),"""

js = js.replace(old_dom, new_dom)

# Load settings
old_load = """      if (s.key === 'about_video_url') DOM.settingAboutVideoPreview.value = s.value || '';"""
new_load = """      if (s.key === 'about_video_url') DOM.settingAboutVideoPreview.value = s.value || '';
      if (s.key === 'about_poster_url') DOM.settingAboutPosterPreview.value = s.value || '';"""
js = js.replace(old_load, new_load)

# Submit listener
old_submit = """  DOM.videoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const file = DOM.settingAboutVideo.files[0];
    if (!file) {
      alert('Please select a video file first.');
      return;
    }

    const originalText = DOM.btnUploadVideo.textContent;
    DOM.btnUploadVideo.textContent = 'Uploading...';
    DOM.btnUploadVideo.disabled = true;

    try {
      const publicUrl = await uploadMedia(file);
      
      const { error } = await supabase.from('site_settings').upsert({ key: 'about_video_url', value: publicUrl });
      if (error) throw error;

      DOM.settingAboutVideoPreview.value = publicUrl;
      DOM.settingAboutVideo.value = ''; // clear file input
      alert('Video uploaded and saved successfully.');
    } catch (err) {
      console.error(err);
      alert('Upload failed: ' + err.message);
    } finally {
      DOM.btnUploadVideo.textContent = originalText;
      DOM.btnUploadVideo.disabled = false;
    }
  });"""

new_submit = """  DOM.videoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const vidFile = DOM.settingAboutVideo.files[0];
    const posterFile = DOM.settingAboutPoster.files[0];
    
    if (!vidFile && !posterFile) {
      alert('Please select a video or poster file to upload.');
      return;
    }

    const originalText = DOM.btnUploadVideo.textContent;
    DOM.btnUploadVideo.textContent = 'Saving...';
    DOM.btnUploadVideo.disabled = true;

    try {
      if (vidFile) {
        const publicUrl = await uploadMedia(vidFile);
        const { error } = await supabase.from('site_settings').upsert({ key: 'about_video_url', value: publicUrl });
        if (error) throw error;
        DOM.settingAboutVideoPreview.value = publicUrl;
        DOM.settingAboutVideo.value = '';
      }
      
      if (posterFile) {
        // We can reuse uploadMedia for images too
        const publicUrl = await uploadMedia(posterFile);
        const { error } = await supabase.from('site_settings').upsert({ key: 'about_poster_url', value: publicUrl });
        if (error) throw error;
        DOM.settingAboutPosterPreview.value = publicUrl;
        DOM.settingAboutPoster.value = '';
      }
      
      alert('Media saved successfully.');
    } catch (err) {
      console.error(err);
      alert('Upload failed: ' + err.message);
    } finally {
      DOM.btnUploadVideo.textContent = originalText;
      DOM.btnUploadVideo.disabled = false;
    }
  });"""

js = js.replace(old_submit, new_submit)

with open('admin.js', 'w') as f:
    f.write(js)
