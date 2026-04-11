// src/utils/tokens.js
const jwt = require('jsonwebtoken');

const signAccess  = id => jwt.sign({ id }, process.env.JWT_SECRET,         { expiresIn: process.env.JWT_EXPIRES_IN  || '7d' });
const signRefresh = id => jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' });
const verifyRefresh = token => jwt.verify(token, process.env.JWT_REFRESH_SECRET);

module.exports = { signAccess, signRefresh, verifyRefresh };
