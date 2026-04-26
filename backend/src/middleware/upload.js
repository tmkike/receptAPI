const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { UPLOAD_DIR } = require('../config');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '');
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `recept-${unique}${ext}`);
  },
});

const upload = multer({ storage });

module.exports = { upload };
