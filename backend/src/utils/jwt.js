const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');

function createToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

module.exports = { createToken };
