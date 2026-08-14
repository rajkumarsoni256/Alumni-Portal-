const fs = require('fs');
const path = require('path');

const UPLOADS_BASE_DIR = path.join(__dirname, '../../uploads/posts');

if (!fs.existsSync(UPLOADS_BASE_DIR)) {
  fs.mkdirSync(UPLOADS_BASE_DIR, { recursive: true });
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
