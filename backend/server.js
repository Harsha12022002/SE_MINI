const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { testConnection } = require('./config/db');

const authRoutes = require('./routes/auth');
const dealRoutes = require('./routes/deals');
const contactRoutes = require('./routes/contacts');
const taskRoutes = require('./routes/tasks');
const reportRoutes = require('./routes/reports');
const pipelineRoutes = require('./routes/pipeline');
const teamRoutes = require('./routes/team');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.options('*', cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000
});
app.use(limiter);

// Test database connection
testConnection();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/deals', dealRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/pipeline', pipelineRoutes);
app.use('/api/team', teamRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'CRM API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 CRM API: http://localhost:${PORT}/api`);
  console.log(`❤️  Health: http://localhost:${PORT}/api/health`);
});