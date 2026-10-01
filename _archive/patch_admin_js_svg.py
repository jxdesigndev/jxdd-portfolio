import re

with open('admin.js', 'r') as f:
    js = f.read()

old_upload = """  async function uploadCompressedImage(file) {
    if (!file) throw new Error('No file selected.');
    if (!file.type.startsWith('image/')) {
      throw new Error('File is not an image.');
    }"""

new_upload = """  async function uploadCompressedImage(file) {
    if (!file) throw new Error('No file selected.');
    if (!file.type.startsWith('image/')) {
      throw new Error('File is not an image.');
    }
    // Skip compression for SVGs to preserve vector quality
    if (file.type === 'image/svg+xml' || file.name.toLowerCase().endswith('.svg')) {
      return uploadRawFile(file);
    }"""

js = js.replace(old_upload, new_upload)

with open('admin.js', 'w') as f:
    f.write(js)
