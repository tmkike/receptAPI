const express = require('express');
const cors = require('cors');
const path = require('path');
const { UPLOAD_DIR } = require('./config');

const authRoutes = require('./routes/auth.routes');
const recipeRoutes = require('./routes/recipes.routes');
const favoriteRoutes = require('./routes/favorites.routes');
const profileRoutes = require('./routes/profile.routes');

function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.use('/uploads', express.static(path.resolve(UPLOAD_DIR)));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api', authRoutes);
  app.use('/api', recipeRoutes);
  app.use('/api', favoriteRoutes);
  app.use('/api', profileRoutes);

  app.use((_req, res) => {
    res.status(404).json({ error: 'not_found' });
  });

  app.use((error, _req, res, _next) => {
    console.error(error);
    res.status(500).json({ error: 'internal_server_error' });
  });

  return app;
}

module.exports = { createApp };
