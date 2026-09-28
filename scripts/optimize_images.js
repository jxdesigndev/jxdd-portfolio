const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const dir = '/home/jx/Documents/JX/jxdd-portfolio/assets/images';

async function optimizeImages() {
  const files = fs.readdirSync(dir);
  let totalSaved = 0;

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (['.png', '.jpg', '.jpeg'].includes(ext)) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      const newPath = path.join(dir, file.replace(ext, '.webp'));
      
      // If we already have a webp and it's small, we can just ensure HTML points to it.
      // But let's re-encode everything to ensure < 200KB if possible.
      
      const image = sharp(fullPath);
      const metadata = await image.metadata();
      
      let width = metadata.width;
      if (width > 1920) {
        width = 1920;
      }
      
      await image
        .resize(width)
        .webp({ quality: 80, effort: 6 })
        .toFile(newPath);
        
      const newStat = fs.statSync(newPath);
      console.log(`Optimized ${file}: ${(stat.size/1024/1024).toFixed(2)}MB -> ${(newStat.size/1024).toFixed(2)}KB`);
      totalSaved += (stat.size - newStat.size);
      
      // Remove original if successful to ensure no legacy loads
      fs.unlinkSync(fullPath);
    }
  }
  console.log(`Total saved: ${(totalSaved/1024/1024).toFixed(2)}MB`);
}

optimizeImages().catch(console.error);
