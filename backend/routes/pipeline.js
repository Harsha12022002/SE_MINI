// routes/pipeline.js
const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get pipeline stages
router.get('/stages', authenticateToken, async (req, res) => {
  try {
    const [stages] = await pool.execute(
      `SELECT * FROM pipeline_stages 
       WHERE created_by = ? OR is_default = TRUE 
       ORDER BY order_index`,
      [req.user.id]
    );
    res.json(stages);
  } catch (error) {
    console.error('Get pipeline stages error:', error);
    res.status(500).json({ message: 'Server error while fetching pipeline stages' });
  }
});

// Create custom pipeline stage
router.post('/stages', [
  authenticateToken,
  requireRole(['admin', 'manager']),
  body('name').trim().isLength({ min: 1 }).withMessage('Stage name is required'),
  body('order_index').isInt({ min: 0 }).withMessage('Order index must be a positive number')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, order_index } = req.body;

  try {
    const [result] = await pool.execute(
      'INSERT INTO pipeline_stages (name, order_index, created_by) VALUES (?, ?, ?)',
      [name.trim(), order_index, req.user.id]
    );

    res.status(201).json({ 
      message: 'Pipeline stage created successfully',
      stageId: result.insertId 
    });
  } catch (error) {
    console.error('Create pipeline stage error:', error);
    res.status(500).json({ message: 'Server error while creating pipeline stage' });
  }
});

// Get pipeline view with deal counts (FIXED - uses stage_id)
router.get('/view', authenticateToken, async (req, res) => {
  try {
    const [stages] = await pool.execute(
      `SELECT 
        ps.*, 
        COUNT(d.id) as deal_count,
        COALESCE(SUM(d.value), 0) as total_value
       FROM pipeline_stages ps
       LEFT JOIN deals d ON ps.id = d.stage_id AND (d.assigned_to = ? OR d.created_by = ? OR ? = (SELECT id FROM users WHERE role = 'admin'))
       WHERE ps.created_by = ? OR ps.is_default = TRUE
       GROUP BY ps.id
       ORDER BY ps.order_index`,
      [req.user.id, req.user.id, req.user.id, req.user.id]
    );

    res.json(stages);
  } catch (error) {
    console.error('Get pipeline view error:', error);
    res.status(500).json({ message: 'Server error while fetching pipeline view' });
  }
});

// Get pipeline analytics (FIXED - uses stage_id)
router.get('/analytics', authenticateToken, async (req, res) => {
  try {
    const [stageAnalytics] = await pool.execute(
      `SELECT 
        ps.name as stage_name,
        COUNT(d.id) as deal_count,
        COALESCE(SUM(d.value), 0) as total_value,
        AVG(DATEDIFF(COALESCE(d.updated_at, NOW()), d.created_at)) as avg_days_in_stage
       FROM pipeline_stages ps
       LEFT JOIN deals d ON ps.id = d.stage_id AND (d.assigned_to = ? OR d.created_by = ? OR ? = (SELECT id FROM users WHERE role = 'admin'))
       WHERE ps.created_by = ? OR ps.is_default = TRUE
       GROUP BY ps.id, ps.name
       ORDER BY ps.order_index`,
      [req.user.id, req.user.id, req.user.id, req.user.id]
    );

    // Get conversion rates between stages
    const [conversionRates] = await pool.execute(
      `SELECT 
        ps.name as stage,
        COUNT(d.id) as total_deals,
        SUM(CASE WHEN d.outcome = 'won' THEN 1 ELSE 0 END) as won_deals,
        CASE 
          WHEN COUNT(d.id) > 0 THEN 
            (SUM(CASE WHEN d.outcome = 'won' THEN 1 ELSE 0 END) / COUNT(d.id) * 100)
          ELSE 0 
        END as win_rate
       FROM pipeline_stages ps
       LEFT JOIN deals d ON ps.id = d.stage_id AND (d.assigned_to = ? OR d.created_by = ? OR ? = (SELECT id FROM users WHERE role = 'admin'))
       GROUP BY ps.id, ps.name
       ORDER BY ps.order_index`,
      [req.user.id, req.user.id, req.user.id]
    );

    res.json({
      stageAnalytics,
      conversionRates
    });
  } catch (error) {
    console.error('Get pipeline analytics error:', error);
    res.status(500).json({ message: 'Server error while fetching pipeline analytics' });
  }
});

module.exports = router;