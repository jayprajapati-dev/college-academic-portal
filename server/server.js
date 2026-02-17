const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();
const { startTaskReminderScheduler } = require('./utils/taskReminders');
const { startCoordinatorScheduler } = require('./utils/coordinatorScheduler');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static views (dashboard)
app.use(express.static(path.join(__dirname, 'views')));

// MongoDB Connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smartacademics', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

// Health Check Route
app.get('/', (req, res) => {
  res.json({ 
    message: 'SmartAcademics Backend is running',
    version: '1.0.0',
    status: 'healthy'
  });
});

// Dashboard Route
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/academic', require('./routes/academic'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/tasks', require('./routes/task'));
app.use('/api/notices', require('./routes/notice'));
app.use('/api/timetable', require('./routes/timetable'));
app.use('/api/library', require('./routes/library'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/exams', require('./routes/exam'));
app.use('/api/permissions', require('./routes/permissions'));

// Error Handler Middleware
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    // Professional startup message with ASCII art
    console.clear();
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║           🎓 SMARTACADEMICS BACKEND SERVER 🎓                ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────┐
│ ✅ SERVER STATUS                                            │
├─────────────────────────────────────────────────────────────┤
│ Status      : 🔴 LIVE & RUNNING                             │
│ Port        : ${PORT}                                   │
│ URL         : http://localhost:${PORT}                      │
│ Environment : ${(process.env.NODE_ENV || 'development').toUpperCase()}                            │
│ Version     : 1.0.0                                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 📊 DATABASE STATUS                                          │
├─────────────────────────────────────────────────────────────┤
│ Database    : ✅ MongoDB Connected                          │
│ Host        : localhost:27017                               │
│ Database    : smartacademics                                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 🔗 QUICK LINKS                                              │
├─────────────────────────────────────────────────────────────┤
│ 📈 Dashboard    : http://localhost:${PORT}/dashboard        │
│ 🏠 API Home     : http://localhost:${PORT}/                 │
│ 🔐 Auth API     : http://localhost:${PORT}/api/auth         │
│ 📚 Academic API : http://localhost:${PORT}/api/academic     │
│ 👤 Admin API    : http://localhost:${PORT}/api/admin        │
│ 📋 Tasks API    : http://localhost:${PORT}/api/tasks        │
│ 📌 Attendance   : http://localhost:${PORT}/api/attendance   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 🚀 FEATURES ENABLED                                         │
├─────────────────────────────────────────────────────────────┤
│ ✅ Task Reminder Scheduler                                  │
│ ✅ Coordinator Scheduler                                    │
│ ✅ MongoDB Connection Pool                                  │
│ ✅ CORS Enabled                                             │
│ ✅ Error Handling Middleware                                │
│ ✅ Dashboard Monitoring                                     │
└─────────────────────────────────────────────────────────────┘

⏱️  Ready to accept requests...
    `);
    console.log(`\n💡 OPEN DASHBOARD: http://localhost:${PORT}/dashboard\n`);
    
    startTaskReminderScheduler();
    startCoordinatorScheduler();
  });
};

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

module.exports = app;
