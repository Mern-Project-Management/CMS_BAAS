const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const uploadsDir = path.join(__dirname, 'public', 'uploads');

async function compressImages() {
  const files = fs.readdirSync(uploadsDir);
  for (const file of files) {
    if (file.match(/\.(jpg|jpeg|png)$/i)) {
      const filePath = path.join(uploadsDir, file);
      const tempPath = path.join(uploadsDir, 'temp_' + file);
      try {
        const metadata = await sharp(filePath).metadata();
        // Only compress if it's quite large (>500KB) or very wide
        const stats = fs.statSync(filePath);
        if (stats.size > 200 * 1024 || metadata.width > 800) {
          console.log(`Compressing ${file}...`);
          let pipeline = sharp(filePath).resize({ width: 800, withoutEnlargement: true });
          
          if (file.match(/\.(jpg|jpeg)$/i)) {
            pipeline = pipeline.jpeg({ quality: 70 });
          } else if (file.match(/\.png$/i)) {
            pipeline = pipeline.png({ quality: 70, compressionLevel: 8 });
          }
          
          await pipeline.toFile(tempPath);
          fs.renameSync(tempPath, filePath);
          console.log(`Successfully compressed ${file}`);
        }
      } catch (err) {
        console.error(`Error compressing ${file}:`, err);
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      }
    }
  }
}

compressImages();
