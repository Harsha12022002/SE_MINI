const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status || '';
    const priority = req.query.priority || '';

    console.log('🔍 Task filters:', { search, status, priority, page, limit });

    // Base query
    let query = `
      SELECT t.*, 
             u.username as assigned_name, 
             uc.username as created_by_name
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN users uc ON t.created_by = uc.id
    `;
    
    let countQuery = `SELECT COUNT(*) as total FROM tasks t`;
    const params = [];
    const whereConditions = [];

    if (search) {
      whereConditions.push('(t.title LIKE ? OR t.description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (status) {
      whereConditions.push('t.status = ?');
      params.push(status);
    }

    if (priority) {
      whereConditions.push('t.priority = ?');
      params.push(priority);
    }

    if (req.user.role !== 'admin') {
      whereConditions.push('t.assigned_to = ?');
      params.push(req.user.id);
    }

    if (whereConditions.length > 0) {
      const whereClause = ' WHERE ' + whereConditions.join(' AND ');
      query += whereClause;
      countQuery += whereClause;
    }

    query += ` ORDER BY t.due_date ASC, t.priority DESC LIMIT ${limit} OFFSET ${offset}`;

    console.log('📝 Query:', query);
    console.log('📝 Query params:', params);

    const [tasks] = await pool.execute(query, params);
    console.log('✅ Tasks found:', tasks.length);
    
    const [countResult] = await pool.execute(countQuery, params);
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    console.log('📊 Pagination:', { total, totalPages, currentPage: page });

    res.json({
      tasks,
      pagination: {
        currentPage: page,
        totalPages,
        totalTasks: total,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('❌ Get tasks error:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Server error while fetching tasks',
      error: error.message 
    });
  }
});
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const taskId = req.params.id;

    const query = `
      SELECT t.*, 
             u.username as assigned_name, 
             uc.username as created_by_name
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN users uc ON t.created_by = uc.id
      WHERE t.id = ?
    `;

    const [tasks] = await pool.execute(query, [taskId]);

    if (tasks.length === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const task = tasks[0];

    // Check access - users can only access their assigned tasks
    if (req.user.role !== 'admin' && task.assigned_to !== req.user.id) {
      return res.status(403).json({ message: 'Access denied to this task' });
    }

    res.json(task);
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ message: 'Server error while fetching task' });
  }
});

router.post('/', [
  authenticateToken,
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('due_date').isISO8601().withMessage('Due date must be a valid date'),
  body('priority').isIn(['low','medium','high']).withMessage('Priority must be low, medium, or high'),
  body('status').optional().isIn(['pending','in_progress','completed','cancelled']),
  body('assigned_to').optional().isInt(),
  body('related_to').optional().isIn(['deal','contact','general']),
  body('related_id').optional().isInt()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { 
    title, 
    description, 
    due_date, 
    priority, 
    status = 'pending', 
    assigned_to,
    related_to = 'general',
    related_id 
  } = req.body;

  try {
    const assignedTo = assigned_to || req.user.id;

    const [result] = await pool.execute(
      `
      INSERT INTO tasks 
        (title, description, due_date, priority, status, assigned_to, created_by, related_to, related_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [title.trim(), description || null, due_date, priority, status, assignedTo, req.user.id, related_to, related_id]
    );

    res.status(201).json({ 
      message: 'Task created successfully', 
      taskId: result.insertId 
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Server error while creating task' });
  }
});

// ------------------- UPDATE task -------------------
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const { title, description, due_date, priority, status, assigned_to } = req.body;

    const [tasks] = await pool.execute('SELECT * FROM tasks WHERE id = ?', [taskId]);
    if (!tasks.length) return res.status(404).json({ message: 'Task not found' });

    const task = tasks[0];
    if (req.user.role !== 'admin' && task.assigned_to !== req.user.id) {
      return res.status(403).json({ message: 'Access denied to update this task' });
    }

    const fields = [];
    const params = [];

    if (title) { fields.push('title = ?'); params.push(title.trim()); }
    if (description) { fields.push('description = ?'); params.push(description); }
    if (due_date) { fields.push('due_date = ?'); params.push(due_date); }
    if (priority) { fields.push('priority = ?'); params.push(priority); }
    if (status) { fields.push('status = ?'); params.push(status); }
    if (assigned_to) { fields.push('assigned_to = ?'); params.push(assigned_to); }

    if (!fields.length) return res.status(400).json({ message: 'No fields to update' });

    fields.push('updated_at = NOW()');
    const query = `UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`;
    params.push(taskId);

    await pool.execute(query, params);

    res.json({ message: 'Task updated successfully', taskId });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Server error while updating task' });
  }
});

// ------------------- DELETE task -------------------
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const [tasks] = await pool.execute('SELECT * FROM tasks WHERE id = ?', [taskId]);
    if (!tasks.length) return res.status(404).json({ message: 'Task not found' });

    const task = tasks[0];
    if (req.user.role !== 'admin' && task.assigned_to !== req.user.id && task.created_by !== req.user.id) {
      return res.status(403).json({ message: 'Access denied to delete this task' });
    }

    await pool.execute('DELETE FROM tasks WHERE id = ?', [taskId]);
    res.json({ message: 'Task deleted successfully', taskId });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Server error while deleting task' });
  }
});

module.exports = router;
