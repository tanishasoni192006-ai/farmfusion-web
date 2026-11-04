/**
 * Expense Tracker Controller
 * Complete CRUD operations and analytical aggregation for Farm Expenses.
 */
const db = require('../config/db');

exports.getExpenses = async (req, res, next) => {
    try {
        const userId = req.session.user.id;
        const { category, startDate, endDate } = req.query;

        let sql = 'SELECT * FROM expenses WHERE user_id = ?';
        const params = [userId];

        if (category && category !== 'All') {
            sql += ' AND category = ?';
            params.push(category);
        }
        if (startDate) {
            sql += ' AND expense_date >= ?';
            params.push(startDate);
        }
        if (endDate) {
            sql += ' AND expense_date <= ?';
            params.push(endDate);
        }

        sql += ' ORDER BY expense_date DESC, id DESC';

        const [expenses] = await db.query(sql, params);

        // Calculate summary metrics
        let totalExpense = 0;
        const categoryMap = {};

        expenses.forEach(item => {
            const amt = parseFloat(item.amount) || 0;
            totalExpense += amt;
            categoryMap[item.category] = (categoryMap[item.category] || 0) + amt;
        });

        res.status(200).json({
            success: true,
            count: expenses.length,
            totalExpense,
            categorySummary: categoryMap,
            expenses
        });
    } catch (err) {
        next(err);
    }
};

exports.createExpense = async (req, res, next) => {
    try {
        const userId = req.session.user.id;
        const {
            category,
            amount,
            expense_date,
            payment_method = 'Cash',
            description = ''
        } = req.body;

        if (!category || !category.trim()) {
            return res.status(400).json({ success: false, message: 'Expense category is required.' });
        }
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            return res.status(400).json({ success: false, message: 'Please enter a valid positive expense amount.' });
        }
        if (!expense_date) {
            return res.status(400).json({ success: false, message: 'Expense date is required.' });
        }

        const [result] = await db.query(
            `INSERT INTO expenses 
            (user_id, category, amount, expense_date, payment_method, description)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                userId,
                category.trim(),
                parsedAmount,
                expense_date,
                payment_method.trim() || 'Cash',
                description ? description.trim() : ''
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Expense recorded successfully.',
            expenseId: result.insertId
        });
    } catch (err) {
        next(err);
    }
};

exports.updateExpense = async (req, res, next) => {
    try {
        const userId = req.session.user.id;
        const expenseId = req.params.id;
        const {
            category,
            amount,
            expense_date,
            payment_method,
            description
        } = req.body;

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            return res.status(400).json({ success: false, message: 'Please enter a valid positive amount.' });
        }
        if (!category || !expense_date) {
            return res.status(400).json({ success: false, message: 'Category and expense date are required.' });
        }

        const [result] = await db.query(
            `UPDATE expenses SET 
            category = ?, amount = ?, expense_date = ?, payment_method = ?, description = ?
            WHERE id = ? AND user_id = ?`,
            [
                category.trim(),
                parsedAmount,
                expense_date,
                payment_method || 'Cash',
                description || '',
                expenseId,
                userId
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Expense record not found or unauthorized.' });
        }

        res.status(200).json({
            success: true,
            message: 'Expense updated successfully.'
        });
    } catch (err) {
        next(err);
    }
};

exports.deleteExpense = async (req, res, next) => {
    try {
        const userId = req.session.user.id;
        const expenseId = req.params.id;

        const [result] = await db.query(
            'DELETE FROM expenses WHERE id = ? AND user_id = ?',
            [expenseId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Expense not found or already removed.' });
        }

        res.status(200).json({
            success: true,
            message: 'Expense deleted successfully.'
        });
    } catch (err) {
        next(err);
    }
};

exports.getAnalytics = async (req, res, next) => {
    try {
        const userId = req.session.user.id;
        const [expenses] = await db.query('SELECT * FROM expenses WHERE user_id = ? ORDER BY expense_date ASC', [userId]);

        let total = 0;
        const categoryBreakdown = {};
        const monthlyBreakdown = {};

        expenses.forEach(e => {
            const amt = parseFloat(e.amount);
            total += amt;
            categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + amt;

            // Group by Month Year: e.g. "Oct 2026"
            const dateObj = new Date(e.expense_date);
            const monthYear = dateObj.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
            monthlyBreakdown[monthYear] = (monthlyBreakdown[monthYear] || 0) + amt;
        });

        res.status(200).json({
            success: true,
            total,
            categoryBreakdown,
            monthlyBreakdown,
            recentCount: expenses.length
        });
    } catch (err) {
        next(err);
    }
};
