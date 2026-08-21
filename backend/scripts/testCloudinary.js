const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const fs = require('fs');
const storageService = require('../src/services/storageService');
const cloudinary = require('cloudinary').v2;

async function testCloudinaryConnection() {
  console.log('\n======================================================');
  console.log('       TESTING CLOUDINARY CREDENTIALS & UPLOAD        ');
  console.log('======================================================\n');

  console.log(`Cloud Name : ${process.env.CLOUDINARY_CLOUD_NAME}`);
  console.log(`API Key    : ${process.env.CLOUDINARY_API_KEY ? process.env.CLOUDINARY_API_KEY.substring(0, 6) + '...' : 'MISSING'}`);
  console.log(`API Secret : ${process.env.CLOUDINARY_API_SECRET ? '***SET***' : 'MISSING'}\n`);

  try {
    // 1. API Ping Test
    console.log('[1/2] Testing API Ping...');
    const pingResult = await cloudinary.api.ping();
    console.log('  ✅ Cloudinary API Ping Status:', pingResult.status);

    // 2. Sample File Upload via storageService
    console.log('\n[2/2] Testing StorageService File Upload...');
    const tempFilePath = path.join(__dirname, 'test_sample_image.png');
    
    // Create a dummy 1x1 PNG file
    const samplePngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    fs.writeFileSync(tempFilePath, Buffer.from(samplePngBase64, 'base64'));

    const mockMulterFile = {
      filename: 'test_sample_image.png',
      originalname: 'test_sample_image.png',
      mimetype: 'image/png',
      path: tempFilePath,
      size: fs.statSync(tempFilePath).size,
    };

    const uploadResult = await storageService.uploadFile(mockMulterFile);

    console.log('\n======================================================');
    console.log('      🎉 CLOUDINARY UPLOAD SUCCESSFUL!              ');
    console.log('======================================================');
    console.log('  Media URL   :', uploadResult.mediaUrl);
    console.log('  Storage Key :', uploadResult.storageKey);
    console.log('  Media Type  :', uploadResult.mediaType);
    console.log('  File Size   :', uploadResult.fileSize, 'bytes');
    console.log('======================================================\n');

    // Clean up temporary local test file if it still exists
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }

    // Clean up uploaded test asset from Cloudinary
    if (uploadResult.storageKey) {
      await storageService.deleteFile(uploadResult.storageKey);
      console.log('  🧹 Cleaned up test asset from Cloudinary:', uploadResult.storageKey);
    }

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Cloudinary Verification Failed!');
    console.error('Error Details:', err.message);
    process.exit(1);
  }
}

testCloudinaryConnection();
