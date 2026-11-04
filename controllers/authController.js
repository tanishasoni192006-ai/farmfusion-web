/**
 * Authentication Controller
 * Handles user registration, login, logout, and session profile inspection.
 * Demonstrates bcrypt hashing, express sessions, and MySQL parameterization.
 */
const bcrypt = require('bcryptjs');
const db = require('../config/db');

// Regular expression for basic email validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

exports.register = async (req, res, next) => {
    try {
        const {
            full_name,
            email,
            phone,
            password,
            confirm_password,
            state = 'Punjab',
            district = 'Ludhiana',
            village = '',
            land_area = 5.0,
            land_unit = 'Acres',
            primary_soil_type = 'Alluvial',
            water_source = 'Tube-well / Borewell',
            preferred_crops = 'Wheat, Rice'
        } = req.body;

        // 1. Server-side Input Validation
        if (!full_name || !full_name.trim()) {
            return res.status(400).json({ success: false, message: 'Full name is required.' });
        }
        if (!email || !EMAIL_REGEX.test(email.trim())) {
            return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
        }
        if (!phone || phone.trim().length < 10) {
            return res.status(400).json({ success: false, message: 'Please provide a valid phone number (at least 10 digits).' });
        }
        if (!password || password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
        }
        if (password !== confirm_password) {
            return res.status(400).json({ success: false, message: 'Passwords do not match.' });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // 2. Check if user already exists
        const [existingUsers] = await db.query('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
        if (existingUsers && existingUsers.length > 0) {
            return res.status(409).json({ success: false, message: 'An account with this email address already exists. Please login.' });
        }

        // 3. Hash password using bcrypt
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // 4. Insert into `users` table
        const [userResult] = await db.query(
            'INSERT INTO users (full_name, email, phone, password_hash) VALUES (?, ?, ?, ?)',
            [full_name.trim(), normalizedEmail, phone.trim(), passwordHash]
        );

        const newUserId = userResult.insertId;

        // 5. Insert corresponding `farmer_profiles` record
        await db.query(
            `INSERT INTO farmer_profiles 
            (user_id, state, district, village, land_area, land_unit, primary_soil_type, water_source, preferred_crops)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                newUserId,
                state.trim(),
                district.trim(),
                village ? village.trim() : '',
                parseFloat(land_area) || 5.0,
                land_unit || 'Acres',
                primary_soil_type || 'Alluvial',
                water_source || 'Tube-well / Borewell',
                preferred_crops || 'Wheat, Rice'
            ]
        );

        // 6. Establish authenticated session
        const sessionUser = {
            id: newUserId,
            full_name: full_name.trim(),
            email: normalizedEmail,
            phone: phone.trim()
        };

        req.session.user = sessionUser;

        return res.status(201).json({
            success: true,
            message: 'Registration successful! Welcome to FarmFusion Web.',
            user: sessionUser
        });
    } catch (err) {
        next(err);
    }
};

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // 1. Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide both email and password.'
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // 2. Query user from database
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [normalizedEmail]);
        if (!users || users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        const user = users[0];

        // 3. Compare password with hashed password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        // 4. Save user info to express-session
        const sessionUser = {
            id: user.id,
            full_name: user.full_name,
            email: user.email,
            phone: user.phone
        };

        req.session.user = sessionUser;

        return res.status(200).json({
            success: true,
            message: `Welcome back, ${user.full_name}!`,
            user: sessionUser
        });
    } catch (err) {
        next(err);
    }
};

exports.logout = (req, res) => {
    if (req.session) {
        req.session.destroy(err => {
            if (err) {
                return res.status(500).json({ success: false, message: 'Could not log out at this moment.' });
            }
            res.clearCookie('connect.sid');
            return res.status(200).json({
                success: true,
                message: 'Logged out successfully.'
            });
        });
    } else {
        return res.status(200).json({ success: true, message: 'Already logged out.' });
    }
};

exports.getMe = async (req, res, next) => {
    try {
        if (!req.session || !req.session.user) {
            return res.status(401).json({
                success: false,
                authenticated: false,
                message: 'Not authenticated.'
            });
        }

        const userId = req.session.user.id;

        // Fetch fresh profile data
        const [users] = await db.query('SELECT id, full_name, email, phone, created_at FROM users WHERE id = ?', [userId]);
        const [profiles] = await db.query('SELECT * FROM farmer_profiles WHERE user_id = ?', [userId]);

        if (!users || users.length === 0) {
            req.session.destroy();
            return res.status(401).json({ success: false, authenticated: false, message: 'User not found.' });
        }

        return res.status(200).json({
            success: true,
            authenticated: true,
            user: users[0],
            profile: profiles && profiles.length > 0 ? profiles[0] : null
        });
    } catch (err) {
        next(err);
    }
};
