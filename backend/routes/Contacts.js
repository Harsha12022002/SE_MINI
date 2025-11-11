const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const { checkContactAccess } = require('../middleware/accessControl');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status || '';

    let baseQuery = `
      SELECT c.*, u.username AS assigned_name
      FROM contacts c
      LEFT JOIN users u ON c.assigned_to = u.id
    `;

    const whereConditions = [];
    const queryParams = [];

    if (req.user.role !== 'admin') {
      whereConditions.push('c.assigned_to = ?');
      queryParams.push(req.user.id);
    }

    if (search) {
      whereConditions.push('(c.name LIKE ? OR c.email LIKE ? OR c.company LIKE ?)');
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`); // ✅ FIXED: Added backticks
    }

    if (status) {
      whereConditions.push('c.status = ?');
      queryParams.push(status);
    }

    if (whereConditions.length > 0) {
      baseQuery += ' WHERE ' + whereConditions.join(' AND ');
    }

    // Append LIMIT/OFFSET directly as numbers (cannot use placeholders)
    baseQuery += ` ORDER BY c.created_at DESC LIMIT ${limit} OFFSET ${offset}`;

    console.log('🔍 Main Query:\n', baseQuery);
    console.log('🔍 Main Query Params:', queryParams);

    const [contacts] = await pool.execute(baseQuery, queryParams);

    // Count total contacts
    let countQuery = 'SELECT COUNT(*) AS total FROM contacts c';
    if (whereConditions.length > 0) {
      countQuery += ' WHERE ' + whereConditions.join(' AND ');
    }

    const countParams = queryParams.slice(); // just the where params
    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    res.json({
      contacts,
      pagination: {
        currentPage: page,
        totalPages,
        totalContacts: total,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ message: 'Server error while fetching contacts' });
  }
});

// Get contact by ID
router.get('/:id', authenticateToken, checkContactAccess, async (req, res) => {
  try {
    const [contacts] = await pool.execute(
      `SELECT c.*, u.username AS assigned_name
       FROM contacts c
       LEFT JOIN users u ON c.assigned_to = u.id
       WHERE c.id = ?`,
      [req.params.id]
    );

    if (!contacts.length) return res.status(404).json({ message: 'Contact not found' });

    res.json(contacts[0]);
  } catch (error) {
    console.error('Get contact by ID error:', error);
    res.status(500).json({ message: 'Server error while fetching contact' });
  }
});

// Create contact
router.post(
  '/',
  [
    authenticateToken,
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('phone').optional().isLength({ min: 10 }).withMessage('Phone must be at least 10 characters'),
    body('company').optional().trim().escape(),
    body('status').optional().isIn(['lead', 'prospect', 'customer']).withMessage('Invalid status'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, phone, company, status = 'lead' } = req.body;

    try {
      const [existingContacts] = await pool.execute(
        'SELECT id FROM contacts WHERE email = ?',
        [email]
      );

      if (existingContacts.length) {
        return res.status(409).json({ message: 'Contact with this email already exists' });
      }

      const [result] = await pool.execute(
        `INSERT INTO contacts (name, email, phone, company, status, assigned_to, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [name.trim(), email, phone, company, status, req.user.id, req.user.id]
      );

      await pool.execute(
        `INSERT INTO team_interactions (user_id, action_type, target_type, target_id, description)
         VALUES (?, 'create', 'contact', ?, ?)`,
        [req.user.id, result.insertId, `Created contact: ${name}`] // ✅ FIXED: Added backticks
      );

      res.status(201).json({
        message: 'Contact created successfully',
        contactId: result.insertId,
        contact: { id: result.insertId, name, email, phone, company, status, assigned_to: req.user.id },
      });
    } catch (error) {
      console.error('Create contact error:', error);
      res.status(500).json({ message: 'Server error while creating contact' });
    }
  }
);

router.put('/:id', async (req, res) => {
  console.log('🎯 PUT ENDPOINT HIT - ID:', req.params.id);
  
  try {
    const contactId = req.params.id;
    const { name } = req.body;
    
    console.log('Updating name to:', name);
    
    // Simple update
    const [result] = await pool.execute(
      'UPDATE contacts SET name = ?, updated_at = NOW() WHERE id = ?',
      [name, contactId]
    );
    
    console.log('Update result:', result);
    res.json({ message: 'PUT worked!', affectedRows: result.affectedRows });
  } catch (error) {
    console.log('❌ PUT ERROR:', error.message);
    res.status(500).json({ message: 'PUT failed: ' + error.message });
  }
});

router.delete('/:id', async (req, res) => {
  console.log('🔍 DELETE endpoint reached - ID:', req.params.id);
  
  try {
    const contactId = req.params.id;
    console.log('Trying to delete contact:', contactId);
    
    const [result] = await pool.execute('DELETE FROM contacts WHERE id = ?', [contactId]);
    console.log('Delete result:', result);
    
    res.json({ message: 'Delete worked!' });
  } catch (error) {
    console.log('❌ DELETE ERROR:', error.message);
    res.status(500).json({ message: 'Delete failed: ' + error.message });
  }
});

// Get contact statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const query = req.user.role === 'admin'
      ? `SELECT status, COUNT(*) AS count FROM contacts GROUP BY status ORDER BY status` // ✅ FIXED: Added backticks
      : `SELECT status, COUNT(*) AS count FROM contacts WHERE assigned_to = ? GROUP BY status ORDER BY status`; // ✅ FIXED: Added backticks

    const params = req.user.role === 'admin' ? [] : [req.user.id];
    const [stats] = await pool.execute(query, params);

    res.json(stats);
  } catch (error) {
    console.error('Get contact stats error:', error);
    res.status(500).json({ message: 'Server error while fetching contact statistics' });
  }
});

module.exports = router;