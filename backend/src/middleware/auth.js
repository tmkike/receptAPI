const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';

  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'missing_or_invalid_token' });
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = {
      userid: String(payload.userid),
      username: payload.username,
    };
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'invalid_or_expired_token' });
  }
}

module.exports = { requireAuth };
