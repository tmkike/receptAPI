const express = require('express');
const { db } = require('../db/sqlite');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/getProfile', requireAuth, (req, res) => {
  const user = db
    .prepare('SELECT username FROM users WHERE id = ?')
    .get(req.user.userid);

  if (!user) {
    return res.status(404).json({ error: 'user_not_found' });
  }

  return res.json({ username: user.username });
});

module.exports = router;
