/**
 * Reminders Controller
 * Complete CRUD functionality for Irrigation and Farm Activity Reminders.
 * Strictly scoped to req.session.user.id for security.
 */
const db = require('../config/db');

exports.getReminders = async (req, res, next) => {
    try {
        const userId = req.session.user.id;
        const { status, category } = req.query;

        let sql = 'SELECT * FROM reminders WHERE user_id = ?';
        const params = [userId];

        if (status) {
            sql += ' AND status = ?';
            params.push(status);
        }
        if (category) {
            sql += ' AND category = ?';
            params.push(category);
        }

        sql += ' ORDER BY reminder_date ASC, reminder_time ASC';

        const [reminders] = await db.query(sql, params);

        res.status(200).json({
            success: true,
            count: reminders.length,
            reminders
        });
    } catch (err) {
        next(err);
    }
};

exports.createReminder = async (req, res, next) => {
    try {
        const userId = req.session.user.id;
        const {
            title,
            crop_name = 'General',
            category = 'Irrigation',
            reminder_date,
            reminder_time = '07:00:00',
            priority = 'Medium',
            description = ''
        } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({ success: false, message: 'Reminder title is required.' });
        }
        if (!reminder_date) {
            return res.status(400).json({ success: false, message: 'Reminder date is required.' });
        }

        const [result] = await db.query(
            `INSERT INTO reminders 
            (user_id, title, crop_name, category, reminder_date, reminder_time, priority, status, description)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', ?)`,
            [
                userId,
                title.trim(),
                crop_name.trim(),
                category.trim(),
                reminder_date,
                reminder_time || '07:00:00',
                priority,
                description.trim()
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Reminder added successfully.',
            reminderId: result.insertId
        });
    } catch (err) {
        next(err);
    }
};

exports.updateReminder = async (req, res, next) => {
    try {
        const userId = req.session.user.id;
        const reminderId = req.params.id;
        const {
            title,
            crop_name,
            category,
            reminder_date,
            reminder_time,
            priority,
            status,
            description
        } = req.body;

        if (!title || !reminder_date) {
            return res.status(400).json({ success: false, message: 'Title and reminder date are required.' });
        }

        const [result] = await db.query(
            `UPDATE reminders SET 
            title = ?, crop_name = ?, category = ?, reminder_date = ?, 
            reminder_time = ?, priority = ?, status = ?, description = ?
            WHERE id = ? AND user_id = ?`,
            [
                title.trim(),
                crop_name || 'General',
                category || 'Irrigation',
                reminder_date,
                reminder_time || '07:00:00',
                priority || 'Medium',
                status || 'Pending',
                description || '',
                reminderId,
                userId
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Reminder not found or unauthorized.' });
        }

        res.status(200).json({
            success: true,
            message: 'Reminder updated successfully.'
        });
    } catch (err) {
        next(err);
    }
};

exports.toggleReminderStatus = async (req, res, next) => {
    try {
        const userId = req.session.user.id;
        const reminderId = req.params.id;
        const { status } = req.body;

        if (!['Pending', 'Completed'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status. Must be Pending or Completed.' });
        }

        const [result] = await db.query(
            'UPDATE reminders SET status = ? WHERE id = ? AND user_id = ?',
            [status, reminderId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Reminder not found.' });
        }

        res.status(200).json({
            success: true,
            message: `Reminder marked as ${status}.`
        });
    } catch (err) {
        next(err);
    }
};

exports.deleteReminder = async (req, res, next) => {
    try {
        const userId = req.session.user.id;
        const reminderId = req.params.id;

        const [result] = await db.query(
            'DELETE FROM reminders WHERE id = ? AND user_id = ?',
            [reminderId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Reminder not found or already deleted.' });
        }

        res.status(200).json({
            success: true,
            message: 'Reminder deleted successfully.'
        });
    } catch (err) {
        next(err);
    }
};
