import re

with open('admin.js', 'r') as f:
    js = f.read()

old_load = """      data.forEach(row => {
        if (row.key === 'availability_status') DOM.settingAvailability.value = row.value;
        if (row.key === 'about_video_url') DOM.settingAboutVideoPreview.value = row.value;
        if (row.key === 'social_twitter') DOM.settingSocialTwitter.value = row.value;"""

new_load = """      data.forEach(row => {
        if (row.key === 'availability_status') DOM.settingAvailability.value = row.value;
        if (row.key === 'about_video_url') {
          currentSettingAboutVideo = row.value || null;
          renderSingleGallery('setting-about-video-preview', currentSettingAboutVideo, 'aboutVideo');
        }
        if (row.key === 'about_poster_url') {
          currentSettingAboutPoster = row.value || null;
          renderSingleGallery('setting-about-poster-preview', currentSettingAboutPoster, 'aboutPoster');
        }
        if (row.key === 'social_twitter') DOM.settingSocialTwitter.value = row.value;"""

js = js.replace(old_load, new_load)

with open('admin.js', 'w') as f:
    f.write(js)
