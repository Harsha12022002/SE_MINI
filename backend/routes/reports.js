const express = require('express');
const { Parser } = require('json2csv');
const { pool } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get KPI metrics
router.get('/kpis', authenticateToken, async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    let dateFilter = '';
    switch (period) {
      case 'week':
        dateFilter = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 1 WEEK)';
        break;
      case 'month':
        dateFilter = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)';
        break;
      case 'quarter':
        dateFilter = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 3 MONTH)';
        break;
    }

    const query = req.user.role === 'admin' 
      ? `
        SELECT 
          'total_deals' as kpi_name,
          COUNT(*) as value
        FROM deals
        WHERE 1=1 ${dateFilter}
        
        UNION ALL
        
        SELECT 
          'won_deals' as kpi_name,
          COUNT(*) as value
        FROM deals
        WHERE outcome = 'won' ${dateFilter}
        
        UNION ALL
        
        SELECT 
          'total_value' as kpi_name,
          COALESCE(SUM(value), 0) as value
        FROM deals
        WHERE outcome = 'won' ${dateFilter}
        
        UNION ALL
        
        SELECT 
          'conversion_rate' as kpi_name,
          CASE 
            WHEN COUNT(*) > 0 THEN 
              (SUM(CASE WHEN outcome = 'won' THEN 1 ELSE 0 END) / COUNT(*) * 100)
            ELSE 0 
          END as value
        FROM deals
        WHERE 1=1 ${dateFilter}
      `
      : `
        SELECT 
          'total_deals' as kpi_name,
          COUNT(*) as value
        FROM deals
        WHERE (assigned_to = ? OR created_by = ?) ${dateFilter}
        
        UNION ALL
        
        SELECT 
          'won_deals' as kpi_name,
          COUNT(*) as value
        FROM deals
        WHERE outcome = 'won' AND (assigned_to = ? OR created_by = ?) ${dateFilter}
        
        UNION ALL
        
        SELECT 
          'total_value' as kpi_name,
          COALESCE(SUM(value), 0) as value
        FROM deals
        WHERE outcome = 'won' AND (assigned_to = ? OR created_by = ?) ${dateFilter}
        
        UNION ALL
        
        SELECT 
          'conversion_rate' as kpi_name,
          CASE 
            WHEN COUNT(*) > 0 THEN 
              (SUM(CASE WHEN outcome = 'won' THEN 1 ELSE 0 END) / COUNT(*) * 100)
            ELSE 0 
          END as value
        FROM deals
        WHERE (assigned_to = ? OR created_by = ?) ${dateFilter}
      `;

    const params = req.user.role === 'admin' ? [] : [req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id];
    const [kpis] = await pool.execute(query, params);

    res.json(kpis);
  } catch (error) {
    console.error('Get KPIs error:', error);
    res.status(500).json({ message: 'Server error while fetching KPIs' });
  }
});

// Generate sales forecast
router.get('/forecast', authenticateToken, async (req, res) => {
  try {
    const { months = 3 } = req.query;
    
    const query = req.user.role === 'admin' 
      ? `
        SELECT 
          DATE_FORMAT(close_date, '%Y-%m') as month,
          SUM(value) as forecasted_value,
          COUNT(*) as deal_count
        FROM deals
        WHERE close_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL ? MONTH)
          AND outcome = 'pending'
        GROUP BY DATE_FORMAT(close_date, '%Y-%m')
        ORDER BY month
      `
      : `
        SELECT 
          DATE_FORMAT(close_date, '%Y-%m') as month,
          SUM(value) as forecasted_value,
          COUNT(*) as deal_count
        FROM deals
        WHERE close_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL ? MONTH)
          AND outcome = 'pending'
          AND (assigned_to = ? OR created_by = ?)
        GROUP BY DATE_FORMAT(close_date, '%Y-%m')
        ORDER BY month
      `;

    const params = req.user.role === 'admin' ? [parseInt(months)] : [parseInt(months), req.user.id, req.user.id];
    const [forecast] = await pool.execute(query, params);

    res.json(forecast);
  } catch (error) {
    console.error('Get forecast error:', error);
    res.status(500).json({ message: 'Server error while generating forecast' });
  }
});

// Export deals to CSV
router.get('/export/deals', authenticateToken, async (req, res) => {
  try {
    const query = req.user.role === 'admin' 
      ? `
        SELECT 
          d.title, d.description, d.value, ps.name as stage, d.close_date, d.outcome,
          u.username as assigned_to,
          d.created_at, d.updated_at
        FROM deals d
        LEFT JOIN users u ON d.assigned_to = u.id
        LEFT JOIN pipeline_stages ps ON d.stage_id = ps.id
      `
      : `
        SELECT 
          d.title, d.description, d.value, ps.name as stage, d.close_date, d.outcome,
          u.username as assigned_to,
          d.created_at, d.updated_at
        FROM deals d
        LEFT JOIN users u ON d.assigned_to = u.id
        LEFT JOIN pipeline_stages ps ON d.stage_id = ps.id
        WHERE d.assigned_to = ? OR d.created_by = ?
      `;

    const params = req.user.role === 'admin' ? [] : [req.user.id, req.user.id];
    const [deals] = await pool.execute(query, params);

    const fields = [
      'title', 'description', 'value', 'stage', 'close_date', 'outcome',
      'assigned_to', 'created_at', 'updated_at'
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(deals);

    res.header('Content-Type', 'text/csv');
    res.attachment('deals-export.csv');
    res.send(csv);
  } catch (error) {
    console.error('Export deals error:', error);
    res.status(500).json({ message: 'Server error while exporting deals' });
  }
});

// Get report insights with filtering (SIMPLIFIED VERSION)
router.get('/insights', authenticateToken, async (req, res) => {
  try {
    const { start_date, end_date, stage_id, outcome } = req.query;
    
    let whereClause = 'WHERE (d.assigned_to = ? OR d.created_by = ?)';
    const params = [req.user.id, req.user.id];

    if (start_date) {
      whereClause += ' AND d.created_at >= ?';
      params.push(start_date);
    }
    if (end_date) {
      whereClause += ' AND d.created_at <= ?';
      params.push(end_date);
    }
    if (stage_id) {
      whereClause += ' AND d.stage_id = ?';
      params.push(stage_id);
    }
    if (outcome) {
      whereClause += ' AND d.outcome = ?';
      params.push(outcome);
    }

    // Simplified query without complex subqueries
    const query = `
      SELECT 
        d.*,
        u.username as assigned_name,
        ps.name as stage_name,
        DATEDIFF(COALESCE(d.updated_at, NOW()), d.created_at) as days_in_pipeline
      FROM deals d
      LEFT JOIN users u ON d.assigned_to = u.id
      LEFT JOIN pipeline_stages ps ON d.stage_id = ps.id
      ${whereClause}
      ORDER BY d.created_at DESC
    `;

    const [insights] = await pool.execute(query, params);
    res.json(insights);
  } catch (error) {
    console.error('Get insights error:', error);
    res.status(500).json({ message: 'Server error while fetching insights' });
  }
});

module.exports = router;
