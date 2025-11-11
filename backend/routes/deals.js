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

    // Add grouping, ordering and pagination
    baseQuery += ` GROUP BY d.id ORDER BY d.created_at DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

    // Execute query
    const [deals] = await pool.execute(baseQuery, queryParams);

    // Count total deals for pagination
    let countQuery = `
      SELECT COUNT(DISTINCT d.id) as total
      FROM deals d
      LEFT JOIN users u ON d.assigned_to = u.id
      LEFT JOIN pipeline_stages ps ON d.stage_id = ps.id
    `;
    
    if (whereConditions.length > 0) {
      countQuery += ' WHERE ' + whereConditions.join(' AND ');
    }

    const [countResult] = await pool.execute(countQuery, queryParams);
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    res.json({
      deals,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalDeals: total,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get deals error:', error);
    res.status(500).json({ message: 'Server error while fetching deals' });
  }
});

// Get deal by ID
router.get('/:id', authenticateToken, checkDealAccess, async (req, res) => {
  try {
    const [deals] = await pool.execute(
      `SELECT 
        d.*, 
        u.username as assigned_name,
        uc.username as created_by_name,
        ps.name as stage_name,
        c.name as contact_name,
        c.email as contact_email,
        c.phone as contact_phone
       FROM deals d
       LEFT JOIN users u ON d.assigned_to = u.id
       LEFT JOIN users uc ON d.created_by = uc.id
       LEFT JOIN pipeline_stages ps ON d.stage_id = ps.id
       LEFT JOIN contacts c ON d.contact_id = c.id
       WHERE d.id = ?`,
      [req.params.id]
    );

    if (!deals.length) {
      return res.status(404).json({ message: 'Deal not found' });
    }

    res.json(deals[0]);
  } catch (error) {
    console.error('Get deal by ID error:', error);
    res.status(500).json({ message: 'Server error while fetching deal' });
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

    // Get the created deal
    const [newDeal] = await pool.execute(
      `SELECT 
        d.*, 
        u.username as assigned_name,
        ps.name as stage_name,
        c.name as contact_name
       FROM deals d
       LEFT JOIN users u ON d.assigned_to = u.id
       LEFT JOIN pipeline_stages ps ON d.stage_id = ps.id
       LEFT JOIN contacts c ON d.contact_id = c.id
       WHERE d.id = ?`,
      [result.insertId]
    );

    res.status(201).json({ 
      message: 'Deal created successfully',
      deal: newDeal[0]
    });
  } catch (error) {
    console.error('Create deal error:', error);
    res.status(500).json({ message: 'Server error while creating deal' });
  }
});

// Update deal (full update)
router.put('/:id', [
  authenticateToken,
  checkDealAccess,
  body('title').optional().trim().isLength({ min: 1 }).withMessage('Title cannot be empty'),
  body('description').optional().trim(),
  body('value').optional().isFloat({ min: 0 }).withMessage('Value must be a positive number'),
  body('stage_id').optional().isInt({ min: 1 }).withMessage('Valid stage ID is required'),
  body('close_date').optional().isISO8601().withMessage('Close date must be a valid date'),
  body('outcome').optional().isIn(['won', 'lost', 'pending']).withMessage('Invalid outcome'),
  body('contact_id').optional().isInt({ min: 1 }).withMessage('Valid contact ID is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const dealId = req.params.id;
  const { 
    title, 
    description, 
    value, 
    stage_id, 
    close_date, 
    outcome,
    contact_id 
  } = req.body;

  try {
    // Build dynamic update query
    const updateFields = [];
    const updateParams = [];

    if (title !== undefined) {
      updateFields.push('title = ?');
      updateParams.push(title.trim());
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateParams.push(description);
    }
    if (value !== undefined) {
      updateFields.push('value = ?');
      updateParams.push(value);
    }
    if (stage_id !== undefined) {
      updateFields.push('stage_id = ?');
      updateParams.push(stage_id);
    }
    if (close_date !== undefined) {
      updateFields.push('close_date = ?');
      updateParams.push(close_date);
    }
    if (outcome !== undefined) {
      updateFields.push('outcome = ?');
      updateParams.push(outcome);
    }
    if (contact_id !== undefined) {
      updateFields.push('contact_id = ?');
      updateParams.push(contact_id);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    updateFields.push('updated_at = NOW()');
    updateParams.push(dealId);

    const query = `UPDATE deals SET ${updateFields.join(', ')} WHERE id = ?`;
    
    await pool.execute(query, updateParams);

    // Get updated deal
    const [updatedDeal] = await pool.execute(
      `SELECT 
        d.*, 
        u.username as assigned_name,
        ps.name as stage_name,
        c.name as contact_name
       FROM deals d
       LEFT JOIN users u ON d.assigned_to = u.id
       LEFT JOIN pipeline_stages ps ON d.stage_id = ps.id
       LEFT JOIN contacts c ON d.contact_id = c.id
       WHERE d.id = ?`,
      [dealId]
    );

    res.json({ 
      message: 'Deal updated successfully',
      deal: updatedDeal[0]
    });
  } catch (error) {
    console.error('Update deal error:', error);
    res.status(500).json({ message: 'Server error while updating deal' });
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

// Delete deal
router.delete('/:id', authenticateToken, checkDealAccess, async (req, res) => {
  try {
    const dealId = req.params.id;

    const [result] = await pool.execute('DELETE FROM deals WHERE id = ?', [dealId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Deal not found' });
    }

    res.json({ message: 'Deal deleted successfully' });
  } catch (error) {
    console.error('Delete deal error:', error);
    res.status(500).json({ message: 'Server error while deleting deal' });
  }
});

// Get deal statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const query = req.user.role === 'admin' 
      ? `
        SELECT 
          outcome,
          COUNT(*) as count,
          COALESCE(SUM(value), 0) as total_value
        FROM deals 
        GROUP BY outcome
        ORDER BY outcome
      `
      : `
        SELECT 
          outcome,
          COUNT(*) as count,
          COALESCE(SUM(value), 0) as total_value
        FROM deals 
        WHERE assigned_to = ? OR created_by = ?
        GROUP BY outcome
        ORDER BY outcome
      `;

    const params = req.user.role === 'admin' ? [] : [req.user.id, req.user.id];
    const [stats] = await pool.execute(query, params);

    res.json(stats);
  } catch (error) {
    console.error('Get deal stats error:', error);
    res.status(500).json({ message: 'Server error while fetching deal statistics' });
  }
});

module.exports = router;