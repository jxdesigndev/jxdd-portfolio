import re

with open('admin.js', 'r') as f:
    js = f.read()

old_test = """  function openTestimonialModal(testm) {
    DOM.testimonialForm.reset();
    if (testm) {
      DOM.testimonialModalTitle.textContent = 'Edit Testimonial';
      document.getElementById('tf-id').value = testm.id;
      document.getElementById('tf-name').value = testm.name || '';
      document.getElementById('tf-role').value = testm.role_company || '';
      document.getElementById('tf-quote').value = testm.quote_text || '';
      document.getElementById('tf-website').value = testm.client_website_url || '';
      document.getElementById('tf-logo-preview').value = testm.logo_url || '';
      document.getElementById('tf-video-preview').value = testm.video_url || '';
      document.getElementById('tf-photo-preview').value = testm.photo_url || '';
      document.getElementById('tf-priority').value = testm.priority || 0;
      document.getElementById('tf-active').checked = testm.is_active !== false; // defaults to true
      DOM.btnDeleteTestimonial.style.display = 'block';
    } else {
      DOM.testimonialModalTitle.textContent = 'Add Testimonial';
      document.getElementById('tf-id').value = '';
      document.getElementById('tf-active').checked = true;
      DOM.btnDeleteTestimonial.style.display = 'none';
    }"""

new_test = """  function openTestimonialModal(testm) {
    DOM.testimonialForm.reset();
    currentEditingTestimonialLogo = null;
    currentEditingTestimonialVideo = null;
    currentEditingTestimonialPhoto = null;
    document.getElementById('tf-logo-preview').innerHTML = '';
    document.getElementById('tf-video-preview').innerHTML = '';
    document.getElementById('tf-photo-preview').innerHTML = '';
    
    if (testm) {
      DOM.testimonialModalTitle.textContent = 'Edit Testimonial';
      document.getElementById('tf-id').value = testm.id;
      document.getElementById('tf-name').value = testm.name || '';
      document.getElementById('tf-role').value = testm.role_company || '';
      document.getElementById('tf-quote').value = testm.quote_text || '';
      document.getElementById('tf-website').value = testm.client_website_url || '';
      
      currentEditingTestimonialLogo = testm.logo_url || null;
      renderSingleGallery('tf-logo-preview', currentEditingTestimonialLogo, 'testLogo');
      
      currentEditingTestimonialVideo = testm.video_url || null;
      renderSingleGallery('tf-video-preview', currentEditingTestimonialVideo, 'testVideo');
      
      currentEditingTestimonialPhoto = testm.photo_url || null;
      renderSingleGallery('tf-photo-preview', currentEditingTestimonialPhoto, 'testPhoto');

      document.getElementById('tf-priority').value = testm.priority || 0;
      document.getElementById('tf-active').checked = testm.is_active !== false; // defaults to true
      DOM.btnDeleteTestimonial.style.display = 'block';
    } else {
      DOM.testimonialModalTitle.textContent = 'Add Testimonial';
      document.getElementById('tf-id').value = '';
      document.getElementById('tf-active').checked = true;
      DOM.btnDeleteTestimonial.style.display = 'none';
    }"""

js = js.replace(old_test, new_test)

with open('admin.js', 'w') as f:
    f.write(js)
