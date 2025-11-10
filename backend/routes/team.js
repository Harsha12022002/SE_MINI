const express = require('express');
const { pool } = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get team tasks (for managers and admins)
router.get('/tasks', [
  authenticateToken,
  requireRole(['admin', 'manager'])
], async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '', assigned_to = '' } = req.query;
    const offset = (page - 1) * limit;

    let baseQuery = `
      SELECT 
        t.*, 
        u.username as assigned_name,
        uc.username as created_by_name,
        CASE 
          WHEN t.related_to = 'deal' THEN d.title
          WHEN t.related_to = 'contact' THEN c.name
          ELSE NULL 
        END as related_title
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN users uc ON t.created_by = uc.id
      LEFT JOIN deals d ON t.related_to = 'deal' AND t.related_id = d.id
      LEFT JOIN contacts c ON t.related_to = 'contact' AND t.related_id = c.id
    `;
    
    let countQuery = `SELECT COUNT(*) as total FROM tasks t`;
    let whereConditions = [];
    let queryParams = [];

    // Apply filters
    if (status) {
      whereConditions.push('t.status = ?');
      queryParams.push(status);
    }

    if (assigned_to) {
      whereConditions.push('t.assigned_to = ?');
      queryParams.push(assigned_to);
    }

    // Build WHERE clause
    if (whereConditions.length > 0) {
      const whereClause = 'WHERE ' + whereConditions.join(' AND ');
      baseQuery += whereClause;
      countQuery += whereClause;
    }

    // Add ordering and pagination
    baseQuery += ' ORDER BY t.due_date ASC, t.priority DESC LIMIT ? OFFSET ?';
    queryParams.push(parseInt(limit), offset);

    // Execute queries
    const [teamTasks] = await pool.execute(baseQuery, queryParams);
    
    // Get total count for pagination
    const [countResult] = await pool.execute(countQuery, queryParams.slice(0, -2));
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    res.json({
      tasks: teamTasks,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalTasks: total,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get team tasks error:', error);
    res.status(500).json({ message: 'Server error while fetching team tasks' });
  }
});

// Get team interactions/activities
router.get('/interactions', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, action_type = '', user_id = '' } = req.query;
    const offset = (page - 1) * limit;

    let baseQuery = `
      SELECT 
        ti.*, 
        u.username as user_name
      FROM team_interactions ti
      LEFT JOIN users u ON ti.user_id = u.id
    `;
    
    let countQuery = `SELECT COUNT(*) as total FROM team_interactions ti`;
    let whereConditions = [];
    let queryParams = [];

    // Apply access control - regular users can only see their own activities and non-admin users
    if (req.user.role !== 'admin') {
      whereConditions.push('(ti.user_id = ? OR u.role != "admin")');
      queryParams.push(req.user.id);
    }

    // Apply filters
    if (action_type) {
      whereConditions.push('ti.action_type = ?');
      queryParams.push(action_type);
    }

    if (user_id) {
      whereConditions.push('ti.user_id = ?');
      queryParams.push(user_id);
    }

    // Build WHERE clause
    if (whereConditions.length > 0) {
      const whereClause = 'WHERE ' + whereConditions.join(' AND ');
      baseQuery += whereClause;
      countQuery += whereClause;
    }

    // Add ordering and pagination
    baseQuery += ' ORDER BY ti.created_at DESC LIMIT ? OFFSET ?';
    queryParams.push(parseInt(limit), offset);

    // Execute queries
    const [interactions] = await pool.execute(baseQuery, queryParams);
    
    // Get total count for pagination
    const [countResult] = await pool.execute(countQuery, queryParams.slice(0, -2));
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    res.json({
      interactions,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalInteractions: total,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get team interactions error:', error);
    res.status(500).json({ message: 'Server error while fetching team interactions' });
  }
});

// Get team performance metrics
router.get('/performance', [
  authenticateToken,
  requireRole(['admin', 'manager'])
], async (req, res) => {
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

    // User performance metrics
    const [userPerformance] = await pool.execute(
      `SELECT 
        u.id,
        u.username,
        u.email,
        u.role,
        COUNT(DISTINCT d.id) as total_deals,
        COUNT(DISTINCT CASE WHEN d.outcome = 'won' THEN d.id END) as won_deals,
        COUNT(DISTINCT t.id) as total_tasks,
        COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_tasks,
        COUNT(DISTINCT c.id) as total_contacts,
        COALESCE(SUM(CASE WHEN d.outcome = 'won' THEN d.value ELSE 0 END), 0) as total_revenue
      FROM users u
      LEFT JOIN deals d ON u.id = d.assigned_to ${dateFilter}
      LEFT JOIN tasks t ON u.id = t.assigned_to ${dateFilter}
      LEFT JOIN contacts c ON u.id = c.assigned_to ${dateFilter}
      WHERE u.is_active = TRUE
      GROUP BY u.id, u.username, u.email, u.role
      ORDER BY total_revenue DESC`
    );

    // Team activity summary
    const [activitySummary] = await pool.execute(
      `SELECT 
        action_type,
        COUNT(*) as count
      FROM team_interactions
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
      GROUP BY action_type
      ORDER BY count DESC`
    );

    res.json({
      userPerformance,
      activitySummary,
      period
    });
  } catch (error) {
    console.error('Get team performance error:', error);
    res.status(500).json({ message: 'Server error while fetching team performance' });
  }
});

// Get team members list
router.get('/members', authenticateToken, async (req, res) => {
  try {
    const [members] = await pool.execute(
      `SELECT 
        id,
        username,
        email,
        role,
        last_login,
        created_at
      FROM users 
      WHERE is_active = TRUE
      ORDER BY role, username`
    );

    res.json(members);
  } catch (error) {
    console.error('Get team members error:', error);
    res.status(500).json({ message: 'Server error while fetching team members' });
  }
});

// Get user-specific dashboard data
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Recent activities
    const [recentActivities] = await pool.execute(
      `SELECT 
        ti.*,
        u.username as user_name
      FROM team_interactions ti
      LEFT JOIN users u ON ti.user_id = u.id
      WHERE ti.user_id = ? OR (u.role != 'admin' AND ti.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY))
      ORDER BY ti.created_at DESC
      LIMIT 10`,
      [userId]
    );

    // Quick stats
    const [quickStats] = await pool.execute(
      `SELECT 
        (SELECT COUNT(*) FROM deals WHERE assigned_to = ? AND outcome = 'pending') as pending_deals,
        (SELECT COUNT(*) FROM tasks WHERE assigned_to = ? AND status = 'pending') as pending_tasks,
        (SELECT COUNT(*) FROM contacts WHERE assigned_to = ? AND status = 'lead') as new_leads,
        (SELECT COALESCE(SUM(value), 0) FROM deals WHERE assigned_to = ? AND outcome = 'won' AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as monthly_revenue`,
      [userId, userId, userId, userId]
    );

    // Upcoming deadlines
    const [upcomingDeadlines] = await pool.execute(
      `SELECT 
        'task' as type,
        title,
        due_date
      FROM tasks 
      WHERE assigned_to = ? AND status NOT IN ('completed', 'cancelled') AND due_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY)
      
      UNION ALL
      
      SELECT 
        'deal' as type,
        title,
        close_date as due_date
      FROM deals 
      WHERE assigned_to = ? AND outcome = 'pending' AND close_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY)
      
      ORDER BY due_date ASC
      LIMIT 10`,
      [userId, userId]
    );

    res.json({
      recentActivities,
      quickStats: quickStats[0],
      upcomingDeadlines
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ message: 'Server error while fetching dashboard data' });
  }
});

module.exports = router;
