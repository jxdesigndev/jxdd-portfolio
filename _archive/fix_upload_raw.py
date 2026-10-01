import re

with open('admin.js', 'r') as f:
    js = f.read()

upload_raw_func = """  async function uploadRawFile(file) {
    if (!file) throw new Error('No file selected.');
    const ext = file.name.split('.').pop().toLowerCase();
    const uniqueName = `media_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const { data, error } = await supabase.storage
      .from('portfolio_media')
      .upload(uniqueName, file, { contentType: file.type });
    if (error) throw error;
    const { data: publicData } = supabase.storage
      .from('portfolio_media')
      .getPublicUrl(uniqueName);
    if (!publicData || !publicData.publicUrl) throw new Error('Failed to get public URL.');
    return publicData.publicUrl;
  }

  async function uploadCompressedImage(file) {"""

js = js.replace("  async function uploadCompressedImage(file) {", upload_raw_func)

with open('admin.js', 'w') as f:
    f.write(js)
