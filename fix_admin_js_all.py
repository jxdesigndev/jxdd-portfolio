import re

with open('admin.js', 'r') as f:
    js = f.read()

# 1. State Variables & renderSingleGallery
old_render = """      if (stateKey === 'thumbnail') currentEditingThumbnail = null;
      if (stateKey === 'cover') currentEditingCover = null;
      if (stateKey === 'persona') currentEditingPersona = null;
      renderSingleGallery(containerId, null, stateKey);
    });
  }"""

new_render = """      if (stateKey === 'thumbnail') currentEditingThumbnail = null;
      if (stateKey === 'cover') currentEditingCover = null;
      if (stateKey === 'persona') currentEditingPersona = null;
      if (stateKey === 'testLogo') currentEditingTestimonialLogo = null;
      if (stateKey === 'testVideo') currentEditingTestimonialVideo = null;
      if (stateKey === 'testPhoto') currentEditingTestimonialPhoto = null;
      if (stateKey === 'toolLogo') currentEditingToolLogo = null;
      if (stateKey === 'serviceImg') currentEditingServiceImage = null;
      if (stateKey === 'serviceVid') currentEditingServiceVideo = null;
      if (stateKey === 'aboutVideo') currentSettingAboutVideo = null;
      if (stateKey === 'aboutPoster') currentSettingAboutPoster = null;
      renderSingleGallery(containerId, null, stateKey);
    });
  }
  
  let currentEditingTestimonialLogo = null;
  let currentEditingTestimonialVideo = null;
  let currentEditingTestimonialPhoto = null;
  let currentEditingToolLogo = null;
  let currentEditingServiceImage = null;
  let currentEditingServiceVideo = null;
  let currentSettingAboutVideo = null;
  let currentSettingAboutPoster = null;"""

js = js.replace(old_render, new_render)

# 2. Testimonials
old_test_open = """    document.getElementById('tf-logo-preview').value = '';
    document.getElementById('tf-video-preview').value = '';
    document.getElementById('tf-photo-preview').value = '';
    
    if (testimonial) {
      document.getElementById('tf-id').value = testimonial.id;
      document.getElementById('tf-name').value = testimonial.client_name || '';
      document.getElementById('tf-role').value = testimonial.client_role || '';
      document.getElementById('tf-quote').value = testimonial.quote || '';
      document.getElementById('tf-website').value = testimonial.website_url || '';
      document.getElementById('tf-logo-preview').value = testimonial.company_logo_url || '';
      document.getElementById('tf-video-preview').value = testimonial.video_url || '';
      document.getElementById('tf-photo-preview').value = testimonial.profile_photo_url || '';
      document.getElementById('tf-priority').value = testimonial.priority || 0;
      document.getElementById('tf-active').checked = !!testimonial.is_active;"""

new_test_open = """    currentEditingTestimonialLogo = null;
    currentEditingTestimonialVideo = null;
    currentEditingTestimonialPhoto = null;
    document.getElementById('tf-logo-preview').innerHTML = '';
    document.getElementById('tf-video-preview').innerHTML = '';
    document.getElementById('tf-photo-preview').innerHTML = '';
    
    if (testimonial) {
      document.getElementById('tf-id').value = testimonial.id;
      document.getElementById('tf-name').value = testimonial.client_name || '';
      document.getElementById('tf-role').value = testimonial.client_role || '';
      document.getElementById('tf-quote').value = testimonial.quote || '';
      document.getElementById('tf-website').value = testimonial.website_url || '';
      
      currentEditingTestimonialLogo = testimonial.company_logo_url || null;
      renderSingleGallery('tf-logo-preview', currentEditingTestimonialLogo, 'testLogo');
      
      currentEditingTestimonialVideo = testimonial.video_url || null;
      renderSingleGallery('tf-video-preview', currentEditingTestimonialVideo, 'testVideo');
      
      currentEditingTestimonialPhoto = testimonial.profile_photo_url || null;
      renderSingleGallery('tf-photo-preview', currentEditingTestimonialPhoto, 'testPhoto');

      document.getElementById('tf-priority').value = testimonial.priority || 0;
      document.getElementById('tf-active').checked = !!testimonial.is_active;"""

js = js.replace(old_test_open, new_test_open)

old_test_sub = """      let newLogoUrl = DOM.testimonialForm.querySelector('#tf-logo-preview').value;
      const logoFile = document.getElementById('tf-logo-file').files[0];
      if (logoFile) newLogoUrl = await uploadCompressedImage(logoFile);

      let newVideoUrl = DOM.testimonialForm.querySelector('#tf-video-preview').value;
      const videoFile = document.getElementById('tf-video-file').files[0];
      if (videoFile) newVideoUrl = await uploadMedia(videoFile);

      let newPhotoUrl = DOM.testimonialForm.querySelector('#tf-photo-preview').value;
      const photoFile = document.getElementById('tf-photo-file').files[0];
      if (photoFile) newPhotoUrl = await uploadCompressedImage(photoFile);"""

new_test_sub = """      let newLogoUrl = currentEditingTestimonialLogo;
      const logoFile = document.getElementById('tf-logo-file').files[0];
      if (logoFile) newLogoUrl = await uploadCompressedImage(logoFile);

      let newVideoUrl = currentEditingTestimonialVideo;
      const videoFile = document.getElementById('tf-video-file').files[0];
      if (videoFile) newVideoUrl = await uploadMedia(videoFile);

      let newPhotoUrl = currentEditingTestimonialPhoto;
      const photoFile = document.getElementById('tf-photo-file').files[0];
      if (photoFile) newPhotoUrl = await uploadCompressedImage(photoFile);"""

js = js.replace(old_test_sub, new_test_sub)


# 3. Tools
old_tool_open = """    document.getElementById('tlf-logo-preview').value = '';
    
    if (tool) {
      document.getElementById('tlf-id').value = tool.id || '';
      document.getElementById('tlf-name').value = tool.name || '';
      document.getElementById('tlf-category').value = tool.category || 'design';
      document.getElementById('tlf-logo-preview').value = tool.logo_url || '';
      document.getElementById('tlf-priority').value = tool.priority || 0;
      document.getElementById('tlf-active').checked = !!tool.is_active;"""

new_tool_open = """    currentEditingToolLogo = null;
    document.getElementById('tlf-logo-preview').innerHTML = '';
    
    if (tool) {
      document.getElementById('tlf-id').value = tool.id || '';
      document.getElementById('tlf-name').value = tool.name || '';
      document.getElementById('tlf-category').value = tool.category || 'design';
      
      currentEditingToolLogo = tool.logo_url || null;
      renderSingleGallery('tlf-logo-preview', currentEditingToolLogo, 'toolLogo');
      
      document.getElementById('tlf-priority').value = tool.priority || 0;
      document.getElementById('tlf-active').checked = !!tool.is_active;"""

js = js.replace(old_tool_open, new_tool_open)

old_tool_sub = """      let newLogoUrl = DOM.toolForm.querySelector('#tlf-logo-preview').value;
      const logoFile = document.getElementById('tlf-logo-file').files[0];
      if (logoFile) newLogoUrl = await uploadCompressedImage(logoFile);"""

new_tool_sub = """      let newLogoUrl = currentEditingToolLogo;
      const logoFile = document.getElementById('tlf-logo-file').files[0];
      if (logoFile) newLogoUrl = await uploadCompressedImage(logoFile);"""

js = js.replace(old_tool_sub, new_tool_sub)


# 4. Services
old_serv_open = """      document.getElementById('sv-image-preview').textContent = '';
      document.getElementById('sv-video-preview').textContent = '';
      if (sv.image_url) document.getElementById('sv-image-preview').textContent = `Current: ${sv.image_url.split('/').pop()}`;
      if (sv.video_url) document.getElementById('sv-video-preview').textContent = `Current: ${sv.video_url.split('/').pop()}`;
    } else {
      document.getElementById('sv-id').value = '';
      document.getElementById('sv-name').value = '';
      document.getElementById('sv-tool-category').value = '';
      document.getElementById('sv-desc').value = '';
      document.getElementById('sv-deliverables').value = '';
      document.getElementById('sv-icon').value = '';
      document.getElementById('sv-label').value = '';
      document.getElementById('sv-image').value = '';
      document.getElementById('sv-video').value = '';
      document.getElementById('sv-image-preview').textContent = '';
      document.getElementById('sv-video-preview').textContent = '';"""

new_serv_open = """      currentEditingServiceImage = sv.image_url || null;
      renderSingleGallery('sv-image-preview', currentEditingServiceImage, 'serviceImg');
      
      currentEditingServiceVideo = sv.video_url || null;
      renderSingleGallery('sv-video-preview', currentEditingServiceVideo, 'serviceVid');
    } else {
      document.getElementById('sv-id').value = '';
      document.getElementById('sv-name').value = '';
      document.getElementById('sv-tool-category').value = '';
      document.getElementById('sv-desc').value = '';
      document.getElementById('sv-deliverables').value = '';
      document.getElementById('sv-icon').value = '';
      document.getElementById('sv-label').value = '';
      document.getElementById('sv-image').value = '';
      document.getElementById('sv-video').value = '';
      
      currentEditingServiceImage = null;
      currentEditingServiceVideo = null;
      document.getElementById('sv-image-preview').innerHTML = '';
      document.getElementById('sv-video-preview').innerHTML = '';"""

js = js.replace(old_serv_open, new_serv_open)

old_serv_sub = """    let newImg = currentEditingService ? currentEditingService.image_url : null;
    if (imgFile) newImg = await uploadCompressedImage(imgFile);

    let newVid = currentEditingService ? currentEditingService.video_url : null;
    if (vidFile) newVid = await uploadMedia(vidFile);"""

new_serv_sub = """    let newImg = currentEditingServiceImage;
    if (imgFile) newImg = await uploadCompressedImage(imgFile);

    let newVid = currentEditingServiceVideo;
    if (vidFile) newVid = await uploadMedia(vidFile);"""

js = js.replace(old_serv_sub, new_serv_sub)


# 5. Settings / About
old_settings_load = """      if (s.key === 'about_video_url') DOM.settingAboutVideoPreview.value = s.value || '';
      if (s.key === 'about_poster_url') DOM.settingAboutPosterPreview.value = s.value || '';"""

new_settings_load = """      if (s.key === 'about_video_url') {
        currentSettingAboutVideo = s.value || null;
        renderSingleGallery('setting-about-video-preview', currentSettingAboutVideo, 'aboutVideo');
      }
      if (s.key === 'about_poster_url') {
        currentSettingAboutPoster = s.value || null;
        renderSingleGallery('setting-about-poster-preview', currentSettingAboutPoster, 'aboutPoster');
      }"""

js = js.replace(old_settings_load, new_settings_load)

old_settings_sub = """  DOM.videoForm.addEventListener('submit', async (e) => {
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
    } catch (err) {"""

new_settings_sub = """  DOM.videoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const vidFile = DOM.settingAboutVideo.files[0];
    const posterFile = DOM.settingAboutPoster.files[0];

    const originalText = DOM.btnUploadVideo.textContent;
    DOM.btnUploadVideo.textContent = 'Saving...';
    DOM.btnUploadVideo.disabled = true;

    try {
      let finalVid = currentSettingAboutVideo;
      if (vidFile) finalVid = await uploadMedia(vidFile);
      
      let finalPoster = currentSettingAboutPoster;
      if (posterFile) finalPoster = await uploadMedia(posterFile);

      if (finalVid === null) {
        await supabase.from('site_settings').delete().eq('key', 'about_video_url');
      } else {
        await supabase.from('site_settings').upsert({ key: 'about_video_url', value: finalVid });
      }

      if (finalPoster === null) {
        await supabase.from('site_settings').delete().eq('key', 'about_poster_url');
      } else {
        await supabase.from('site_settings').upsert({ key: 'about_poster_url', value: finalPoster });
      }

      currentSettingAboutVideo = finalVid;
      currentSettingAboutPoster = finalPoster;
      renderSingleGallery('setting-about-video-preview', currentSettingAboutVideo, 'aboutVideo');
      renderSingleGallery('setting-about-poster-preview', currentSettingAboutPoster, 'aboutPoster');
      DOM.settingAboutVideo.value = '';
      DOM.settingAboutPoster.value = '';
      
      alert('Media saved successfully.');
    } catch (err) {"""

js = js.replace(old_settings_sub, new_settings_sub)

with open('admin.js', 'w') as f:
    f.write(js)
