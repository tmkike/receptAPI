const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../db/sqlite');
const { createToken } = require('../utils/jwt');

const router = express.Router();

router.post('/register', async (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ is_valid: 'no', error: 'missing_credentials' });
  }

  if (String(username).trim().length < 3) {
    return res.status(400).json({ is_valid: 'no', error: 'username_too_short' });
  }

  if (String(password).length < 6) {
    return res.status(400).json({ is_valid: 'no', error: 'password_too_short' });
  }

  try {
    const passwordHash = await bcrypt.hash(String(password), 10);
    const insertUser = db.prepare(
      'INSERT INTO users (username, password_hash) VALUES (?, ?)'
    );
    const info = insertUser.run(String(username).trim(), passwordHash);

    const userid = String(info.lastInsertRowid);
    const token = createToken({ userid, username: String(username).trim() });

    return res.json({ token, userid, is_valid: 'ok' });
  } catch (error) {
    if (error && error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ is_valid: 'no', error: 'username_exists' });
    }
    return res.status(500).json({ is_valid: 'no', error: 'register_failed' });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: 'missing_credentials' });
  }

  const getUser = db.prepare('SELECT id, username, password_hash FROM users WHERE username = ?');
  const user = getUser.get(String(username).trim());

  if (!user) {
    return res.status(401).json({ error: 'invalid_credentials' });
  }

  const ok = await bcrypt.compare(String(password), user.password_hash);
  if (!ok) {
    return res.status(401).json({ error: 'invalid_credentials' });
  }

  const userid = String(user.id);
  const token = createToken({ userid, username: user.username });

  return res.json({ token, userid });
});

router.post('/reset-password', async (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ is_updated: 'no', error: 'missing_credentials' });
  }

  if (String(password).length < 6) {
    return res.status(400).json({ is_updated: 'no', error: 'password_too_short' });
  }

  const trimmedUsername = String(username).trim();
  const user = db.prepare('SELECT id FROM users WHERE username = ?').get(trimmedUsername);

  if (!user) {
    return res.status(404).json({ is_updated: 'no', error: 'user_not_found' });
  }

  try {
    const passwordHash = await bcrypt.hash(String(password), 10);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, user.id);

    return res.json({ is_updated: 'yes' });
  } catch (error) {
    return res.status(500).json({ is_updated: 'no', error: 'password_reset_failed' });
  }
});

module.exports = router;
