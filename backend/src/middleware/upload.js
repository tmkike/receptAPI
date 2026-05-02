const fs = require('fs');
const path = require('path');
const multer = require('multer');
const sharp = require('sharp');
const { UPLOAD_DIR } = require('../config');

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 500 * 1024;
const MAX_PIXELS = 1_000_000;

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

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_UPLOAD_BYTES,
  },
  fileFilter: (_req, file, cb) => {
    if (String(file.mimetype || '').startsWith('image/')) {
      return cb(null, true);
    }

    const error = new Error('invalid_image_type');
    error.code = 'invalid_image_type';
    return cb(error);
  },
});

function getResizeDimensions(width, height) {
  const safeWidth = Number(width) || 0;
  const safeHeight = Number(height) || 0;

  if (!safeWidth || !safeHeight) {
    return { width: null, height: null };
  }

  const pixels = safeWidth * safeHeight;
  if (pixels <= MAX_PIXELS) {
    return { width: safeWidth, height: safeHeight };
  }

  const ratio = Math.sqrt(MAX_PIXELS / pixels);
  return {
    width: Math.max(1, Math.floor(safeWidth * ratio)),
    height: Math.max(1, Math.floor(safeHeight * ratio)),
  };
}

async function processUploadedRecipeImage(file) {
  if (!file || !file.path) {
    return file;
  }

  const inputPath = file.path;
  const parsed = path.parse(file.filename);
  const outputFilename = `${parsed.name}.jpg`;
  const outputPath = path.join(UPLOAD_DIR, outputFilename);

  try {
    const metadata = await sharp(inputPath).metadata();
    const dimensions = getResizeDimensions(metadata.width, metadata.height);
    const qualities = [85, 75, 65, 55, 45, 35];

    let bestBuffer = null;

    for (const quality of qualities) {
      const transformer = sharp(inputPath).rotate();

      if (dimensions.width && dimensions.height) {
        transformer.resize(dimensions.width, dimensions.height, {
          fit: 'inside',
          withoutEnlargement: true,
        });
      }

      const buffer = await transformer
        .jpeg({ quality, mozjpeg: true, force: true })
        .toBuffer();

      if (!bestBuffer || buffer.length < bestBuffer.length) {
        bestBuffer = buffer;
      }

      if (buffer.length <= MAX_OUTPUT_BYTES) {
        bestBuffer = buffer;
        break;
      }
    }

    if (!bestBuffer || bestBuffer.length > MAX_OUTPUT_BYTES) {
      const error = new Error('image_size_target_unreachable');
      error.code = 'image_size_target_unreachable';
      throw error;
    }

    await fs.promises.writeFile(outputPath, bestBuffer);

    if (outputPath !== inputPath && fs.existsSync(inputPath)) {
      await fs.promises.unlink(inputPath);
    }

    file.filename = outputFilename;
    file.path = outputPath;
    file.mimetype = 'image/jpeg';
    file.size = bestBuffer.length;
    return file;
  } catch (error) {
    if (fs.existsSync(inputPath)) {
      await fs.promises.unlink(inputPath).catch(() => undefined);
    }

    if (fs.existsSync(outputPath)) {
      await fs.promises.unlink(outputPath).catch(() => undefined);
    }

    if (error && error.code) {
      throw error;
    }

    const wrappedError = new Error('image_processing_failed');
    wrappedError.code = 'image_processing_failed';
    throw wrappedError;
  }
}

module.exports = {
  upload,
  processUploadedRecipeImage,
  MAX_UPLOAD_BYTES,
  MAX_OUTPUT_BYTES,
  MAX_PIXELS,
};
