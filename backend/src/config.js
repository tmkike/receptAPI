const path = require('path');

require('dotenv').config();

const ROOT_DIR = path.resolve(__dirname, '..');

const config = {
  ROOT_DIR,
  PORT: Number(process.env.PORT) || 3000,
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-me',
  DB_PATH: process.env.DB_PATH || path.join(ROOT_DIR, 'data', 'app.db'),
  UPLOAD_DIR: process.env.UPLOAD_DIR || path.join(ROOT_DIR, 'uploads'),
};

module.exports = config;
