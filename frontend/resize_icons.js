const sharp = require('sharp');
const path = require('path');

const inputPath = 'C:\\Users\\pc\\.gemini\\antigravity\\brain\\4fda994e-df66-4a31-a75d-c1026f787821\\pwa_icon_base_1774553774995.png';
const publicDir = path.join(__dirname, 'public');

async function resizer() {
  try {
    await sharp(inputPath)
      .resize(192, 192)
      .toFile(path.join(publicDir, 'icon-192.png'));
    console.log('✅ Created icon-192.png');

    await sharp(inputPath)
      .resize(512, 512)
      .toFile(path.join(publicDir, 'icon-512.png'));
    console.log('✅ Created icon-512.png');
  } catch (err) {
    console.error('❌ Error resizing icons:', err);
  }
}

resizer();
