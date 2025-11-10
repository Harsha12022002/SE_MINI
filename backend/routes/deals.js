const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const { checkDealAccess } = require('../middleware/accessControl');

const router = express.Router();

// Get all deals with pagination and filtering
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      stage_id = '', 
      outcome = '', 
      assigned_to = '',
      search = '' 
    } = req.query;
    
    const offset = (page - 1) * limit;

    let baseQuery = `
      SELECT 
        d.*, 
        u.username as assigned_name,
        uc.username as created_by_name,
        ps.name as stage_name,
        c.name as contact_name,
        COUNT(t.id) as task_count,
        SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_tasks
      FROM deals d
      LEFT JOIN users u ON d.assigned_to = u.id
      LEFT JOIN users uc ON d.created_by = uc.id
      LEFT JOIN pipeline_stages ps ON d.stage_id = ps.id
      LEFT JOIN contacts c ON d.contact_id = c.id
      LEFT JOIN tasks t ON d.id = t.related_id AND t.related_to = 'deal'
    `;
    
    let whereConditions = [];
    let queryParams = [];

    // Apply access control
    if (req.user.role !== 'admin') {
      whereConditions.push('(d.assigned_to = ? OR d.created_by = ?)');
      queryParams.push(req.user.id, req.user.id);
    }

    // Apply filters
    if (stage_id) {
      whereConditions.push('d.stage_id = ?');
      queryParams.push(stage_id);
    }

    if (outcome) {
      whereConditions.push('d.outcome = ?');
      queryParams.push(outcome);
    }

    if (assigned_to) {
      whereConditions.push('d.assigned_to = ?');
      queryParams.push(assigned_to);
    }

    if (search) {
      whereConditions.push('(d.title LIKE ? OR d.description LIKE ?)');
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    // Build WHERE clause
    if (whereConditions.length > 0) {
      baseQuery += ' WHERE ' + whereConditions.join(' AND ');
    }

    // Add grouping, ordering and pagination (limit/offset cannot use ? placeholders)
    baseQuery += ` GROUP BY d.id ORDER BY d.created_at DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

    // Execute query
    const [deals] = await pool.execute(baseQuery, queryParams);

    res.json({
      deals,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(deals.length / limit),
        totalDeals: deals.length,
        hasNext: page < Math.ceil(deals.length / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get deals error:', error);
    res.status(500).json({ message: 'Server error while fetching deals' });
  }
});

// Create new deal
router.post('/', [
  authenticateToken,
  body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
  body('description').optional().trim(),
  body('value').optional().isFloat({ min: 0 }).withMessage('Value must be a positive number'),
  body('stage_id').isInt({ min: 1 }).withMessage('Valid stage ID is required'),
  body('close_date').optional().isISO8601().withMessage('Close date must be a valid date'),
  body('outcome').optional().isIn(['won', 'lost', 'pending']).withMessage('Invalid outcome'),
  body('contact_id').optional().isInt({ min: 1 }).withMessage('Valid contact ID is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { 
    title, 
    description, 
    value, 
    stage_id, 
    close_date, 
    outcome = 'pending',
    contact_id 
  } = req.body;

  try {
    const assignedTo = req.user.id;

    const [result] = await pool.execute(
      `INSERT INTO deals 
       (title, description, value, stage_id, close_date, outcome, assigned_to, created_by, contact_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title.trim(), description, value, stage_id, close_date, outcome, assignedTo, req.user.id, contact_id]
    );

    res.status(201).json({ 
      message: 'Deal created successfully',
      dealId: result.insertId
    });
  } catch (error) {
    console.error('Create deal error:', error);
    res.status(500).json({ message: 'Server error while creating deal' });
  }
});

// Update deal stage (drag-and-drop)
router.put('/:id/stage', [
  authenticateToken,
  checkDealAccess,
  body('stage_id').isInt({ min: 1 }).withMessage('Valid stage ID is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const dealId = req.params.id;
  const { stage_id } = req.body;

  try {
    await pool.execute(
      'UPDATE deals SET stage_id = ?, updated_at = NOW() WHERE id = ?',
      [stage_id, dealId]
    );

    res.json({ message: 'Deal stage updated successfully' });
  } catch (error) {
    console.error('Update deal stage error:', error);
    res.status(500).json({ message: 'Server error while updating deal stage' });
  }
});

module.exports = router;
