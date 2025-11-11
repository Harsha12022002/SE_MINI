const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log('🔐 Auth Header:', authHeader);
  console.log('🔐 Token:', token ? 'Present' : 'Missing');

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
    console.log('✅ JWT Decoded:', decoded);

    const [users] = await pool.execute(
      'SELECT id, username, email, role FROM users WHERE id = ?',
      [decoded.userId]
    );

    console.log('🔍 Database query result:', users);

    if (users.length === 0) {
      console.log('❌ User not found in database for ID:', decoded.userId);
      return res.status(403).json({ message: 'Invalid token - user not found' });
    }

    req.user = users[0];
    console.log('✅ User authenticated:', req.user);
    next();
  } catch (error) {
    console.log('❌ JWT Error:', error.message);
    return res.status(403).json({ message: 'Invalid token' });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
};

module.exports = { authenticateToken, requireRole };