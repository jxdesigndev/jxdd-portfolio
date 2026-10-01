import re

with open('about.js', 'r') as f:
    js = f.read()

old_init = """  async function initAboutVideo() {
    const videoSection = document.getElementById('about-video-section');
    const videoPlayer = document.getElementById('about-video-player');
    if (!videoSection || !videoPlayer) return;

    try {
      if (window.initSupabase) await window.initSupabase();
      if (typeof supabase === 'undefined') throw new Error('Database offline.');

      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('key', 'about_video_url')
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"

      if (!data || !data.value) {
        // Hide section gracefully if no video exists
        videoSection.style.display = 'none';
        return;
      }

      // Update the video src and reveal normally
      videoPlayer.src = data.value;
      if (window.JX && window.JX.initLoopingPreviewVideo) {
        window.JX.initLoopingPreviewVideo(videoPlayer);
      }
      
    } catch (err) {
      console.error('Failed to load about video:', err);
      videoSection.style.display = 'none';
    }
  }"""

new_init = """  async function initAboutVideo() {
    const videoSection = document.getElementById('about-video-section');
    const videoPlayer = document.getElementById('about-video-player');
    if (!videoSection || !videoPlayer) return;

    try {
      if (window.initSupabase) await window.initSupabase();
      if (typeof supabase === 'undefined') throw new Error('Database offline.');

      // Fetch video URL
      const { data: vidData, error: vidErr } = await supabase
        .from('site_settings')
        .select('*')
        .eq('key', 'about_video_url')
        .single();

      if (vidErr && vidErr.code !== 'PGRST116') throw vidErr;

      if (!vidData || !vidData.value) {
        // Hide section gracefully if no video exists
        videoSection.style.display = 'none';
        return;
      }
      
      // Update the video src
      videoPlayer.src = vidData.value;
      
      // Fetch poster URL
      const { data: posterData, error: posterErr } = await supabase
        .from('site_settings')
        .select('*')
        .eq('key', 'about_poster_url')
        .single();
        
      if (posterData && posterData.value) {
        videoPlayer.poster = posterData.value;
      }

      if (window.JX && window.JX.initLoopingPreviewVideo) {
        window.JX.initLoopingPreviewVideo(videoPlayer);
      }
      
    } catch (err) {
      console.error('Failed to load about video:', err);
      videoSection.style.display = 'none';
    }
  }"""

js = js.replace(old_init, new_init)

with open('about.js', 'w') as f:
    f.write(js)
