/**
 * Farming Expense Tracker Routes
 */
const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { requireAuth } = require('../middleware/authMiddleware');

router.use(requireAuth);

router.get('/', expenseController.getExpenses);
router.get('/analytics', expenseController.getAnalytics);
router.post('/', expenseController.createExpense);
router.put('/:id', expenseController.updateExpense);
router.delete('/:id', expenseController.deleteExpense);

module.exports = router;
