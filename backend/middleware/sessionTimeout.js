const pool = require('../config/db');

const checkSessionTimeout = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      // Check if token is expired in our database
      const [sessions] = await pool.execute(
        'SELECT * FROM sessions WHERE token = ? AND expires_at > NOW()',
        [token]
      );

      if (sessions.length === 0) {
        return res.status(401).json({ message: 'Session expired' });
      }
    } catch (error) {
      console.error('Session check error:', error);
    }
  }
  next();
};

module.exports = checkSessionTimeout;
