/**
 * Irrigation & Farming Reminders Routes
 */
const express = require('express');
const router = express.Router();
const reminderController = require('../controllers/reminderController');
const { requireAuth } = require('../middleware/authMiddleware');

router.use(requireAuth);

router.get('/', reminderController.getReminders);
router.post('/', reminderController.createReminder);
router.put('/:id', reminderController.updateReminder);
router.patch('/:id/toggle', reminderController.toggleReminderStatus);
router.delete('/:id', reminderController.deleteReminder);

module.exports = router;
