const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const uploadDir = path.join(__dirname, '../../uploads/posts');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
    const ext = path.extname(file.originalname || '').toLowerCase();
    cb(null, `post-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
    'video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska'
  ];
  const ext = path.extname(file.originalname || '').toLowerCase();
  const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.mp4', '.webm', '.mov'];

  if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    const err = new Error('Unsupported file format. Allowed formats: JPG, PNG, WEBP, MP4, WEBM, MOV');
    err.statusCode = 400;
    err.errorCode = 'VALIDATION_ERROR';
    cb(err, false);
  }
};

const uploadPostMedia = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for video/image files
  },
}).any();

module.exports = {
  uploadPostMedia,
};
