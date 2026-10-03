const sharp = require('sharp');
const fs = require('fs');

async function run() {
  await sharp('public/assets/images/jx-logo.webp')
    .resize(192, 192)
    .png()
    .toFile('public/assets/images/icon-192.png');
  await sharp('public/assets/images/jx-logo.webp')
    .resize(512, 512)
    .png()
    .toFile('public/assets/images/icon-512.png');
  await sharp('public/assets/images/jx-logo.webp')
    .resize(180, 180)
    .png()
    .toFile('public/assets/images/apple-touch-icon.png');
  console.log('Icons generated');
}
run();
