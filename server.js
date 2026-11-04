/**
 * FarmFusion Web – Smart Farming Advisory Platform
 * Main Express.js Application Server
 * 3rd Semester B.Tech CSE (AI & ML) Web Development Mini Project
 */
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const cors = require('cors');

// Route imports
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const reminderRoutes = require('./routes/reminderRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const advisoryRoutes = require('./routes/advisoryRoutes');
const diseaseRoutes = require('./routes/diseaseRoutes');
const marketRoutes = require('./routes/marketRoutes');
const weatherRoutes = require('./routes/weatherRoutes');

// Middleware imports
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable Cross-Origin Resource Sharing (CORS) for API flexibility
app.use(cors());

// Parse incoming JSON and URL-encoded form request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure Express Session
app.use(
    session({
        name: 'farmfusion.sid',
        secret: process.env.SESSION_SECRET || 'farmfusion_dev_session_secret_2026',
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: false, // Set to true if deploying over HTTPS
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        }
    })
);

// Route-level protection for sensitive HTML views
const protectedHtmlPages = ['/dashboard.html', '/reminders.html', '/expenses.html', '/profile.html'];
app.use((req, res, next) => {
    if (protectedHtmlPages.includes(req.path)) {
        if (!req.session || !req.session.user) {
            return res.redirect(`/login.html?redirect=${encodeURIComponent(req.path)}`);
        }
    }
    next();
});

// Serve static frontend assets (HTML, CSS, JS, Images) from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Mount API endpoints
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/advisory', advisoryRoutes);
app.use('/api/diseases', diseaseRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/weather', weatherRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'online',
        service: 'FarmFusion Web Advisory Server',
        timestamp: new Date().toISOString(),
        nodeVersion: process.version
    });
});

// Handle 404 Not Found
app.use(notFoundHandler);

// Central Global Error Handling Middleware
app.use(errorHandler);

// Start the Express server
app.listen(PORT, () => {
    console.log('===========================================================');
    console.log('🌾 FarmFusion Web – Smart Farming Advisory Platform');
    console.log(`🚀 Server successfully launched on: http://localhost:${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('===========================================================');
});

module.exports = app;
