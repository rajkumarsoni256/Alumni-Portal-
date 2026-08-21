const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { logger } = require('../utils/logger');

const UPLOADS_BASE_DIR = path.join(__dirname, '../../uploads/posts');

if (!fs.existsSync(UPLOADS_BASE_DIR)) {
  fs.mkdirSync(UPLOADS_BASE_DIR, { recursive: true });
}

// Configure Cloudinary if environment variables exist
if (process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_URL) {
  if (process.env.CLOUDINARY_CLOUD_NAME) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }
}

class StorageService {
  /**
   * Register file and return public URL & storage metadata
   */
  async uploadFile(file) {
    if (!file) return null;

    const ext = path.extname(file.originalname || '').toLowerCase();
    const isVideo = (file.mimetype || '').startsWith('video/') || ['.mp4', '.webm', '.mov'].includes(ext);
    const mediaType = isVideo ? 'VIDEO' : 'IMAGE';

    const isCloudinaryConfigured = Boolean(process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_URL);

    if (isCloudinaryConfigured) {
      try {
        logger.info('MEDIA', `Uploading file to Cloudinary: ${file.originalname} (${file.size} bytes)`);

        const uploadOptions = {
          folder: 'ju_connect_posts',
          resource_type: isVideo ? 'video' : 'image',
        };

        const result = await cloudinary.uploader.upload(file.path, uploadOptions);

        // Delete temporary Multer file from disk after successful Cloudinary upload
        if (file.path && fs.existsSync(file.path)) {
          try {
            fs.unlinkSync(file.path);
          } catch (unlinkErr) {
            logger.warn('MEDIA', `Failed to clean up temp file: ${file.path}`);
          }
        }

        logger.block('MEDIA', 'CLOUDINARY UPLOAD SUCCESS', {
          File: file.originalname,
          MIME: file.mimetype,
          Size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
          Storage: 'CLOUDINARY',
          'Public ID': result.public_id,
          URL: result.secure_url,
        });

        return {
          mediaUrl: result.secure_url,
          storageKey: result.public_id,
          mediaType: mediaType,
          originalFilename: file.originalname,
          mimeType: file.mimetype,
          fileSize: file.size || result.bytes,
        };
      } catch (err) {
        logger.error('MEDIA', `Cloudinary upload failed for ${file.originalname}`, err);
        const uploadError = new Error(`Cloudinary file upload failed: ${err.message}`);
        uploadError.statusCode = 500;
        uploadError.errorCode = 'FILE_UPLOAD_FAILED';
        throw uploadError;
      }
    }

    // Local disk fallback for local dev when Cloudinary is not configured
    logger.warn('MEDIA', 'CLOUDINARY_CLOUD_NAME not set. Using local disk storage fallback.');
    const relativePath = `/uploads/posts/${file.filename}`;

    return {
      mediaUrl: relativePath,
      storageKey: file.filename,
      mediaType: mediaType,
      originalFilename: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
    };
  }

  /**
   * Delete file from storage
   */
  async deleteFile(storageKeyOrUrl) {
    if (!storageKeyOrUrl) return;

    const isCloudinaryConfigured = Boolean(process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_URL);

    if (isCloudinaryConfigured && !storageKeyOrUrl.startsWith('/uploads/')) {
      try {
        await cloudinary.uploader.destroy(storageKeyOrUrl);
        return;
      } catch (err) {
        console.warn('[StorageService Cloudinary Delete Warning]', err.message);
      }
    }

    const filename = path.basename(storageKeyOrUrl);
    const filePath = path.join(UPLOADS_BASE_DIR, filename);

    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.warn('Failed to delete file from disk:', filePath, err.message);
      }
    }
  }

  /**
   * Format public URL
   */
  getUrl(storageKey) {
    if (!storageKey) return null;
    if (storageKey.startsWith('http://') || storageKey.startsWith('https://') || storageKey.startsWith('/')) {
      return storageKey;
    }
    return `/uploads/posts/${storageKey}`;
  }
}

module.exports = new StorageService();
