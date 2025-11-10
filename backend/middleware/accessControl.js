const pool = require('../config/db');

const checkDealAccess = async (req, res, next) => {
  const dealId = req.params.id || req.body.dealId;
  const userId = req.user.id;

  try {
    const [deals] = await pool.execute(
      `SELECT * FROM deals WHERE id = ? AND (assigned_to = ? OR created_by = ?)`,
      [dealId, userId, userId]
    );

    if (deals.length === 0 && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied to this deal' });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const checkContactAccess = async (req, res, next) => {
  const contactId = req.params.id || req.body.contactId;
  const userId = req.user.id;

  try {
    const [contacts] = await pool.execute(
      `SELECT * FROM contacts WHERE id = ? AND (assigned_to = ? OR ? IN (SELECT id FROM users WHERE role = 'admin'))`,
      [contactId, userId, userId]
    );

    if (contacts.length === 0) {
      return res.status(403).json({ message: 'Access denied to this contact' });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { checkDealAccess, checkContactAccess };

