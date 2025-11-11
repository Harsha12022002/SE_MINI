const pool = require('../config/db');

const checkDealAccess = async (req, res, next) => {
  const dealId = req.params.id || req.body.dealId;
  const userId = req.user.id;

  try {
    // If user is admin, allow access to all deals
    if (req.user.role === 'admin') {
      return next();
    }

    const [deals] = await pool.execute(
      `SELECT * FROM deals WHERE id = ? AND (assigned_to = ? OR created_by = ?)`,
      [dealId, userId, userId]
    );

    if (deals.length === 0) {
      return res.status(403).json({ message: 'Access denied to this deal' });
    }

    next();
  } catch (error) {
    console.error('Deal access check error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const checkContactAccess = async (req, res, next) => {
  const contactId = req.params.id || req.body.contactId;
  const userId = req.user.id;

  try {
    // If user is admin, allow access to all contacts
    if (req.user.role === 'admin') {
      return next();
    }

    const [contacts] = await pool.execute(
      `SELECT * FROM contacts WHERE id = ? AND assigned_to = ?`,
      [contactId, userId]
    );

    if (contacts.length === 0) {
      return res.status(403).json({ message: 'Access denied to this contact' });
    }

    next();
  } catch (error) {
    console.error('Contact access check error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { checkDealAccess, checkContactAccess };