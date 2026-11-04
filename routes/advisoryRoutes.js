/**
 * Crop Advisory Routes
 */
const express = require('express');
const router = express.Router();
const advisoryController = require('../controllers/advisoryController');

router.post('/recommend', advisoryController.getCropAdvice);
router.get('/crops', advisoryController.getAllCrops);

module.exports = router;
