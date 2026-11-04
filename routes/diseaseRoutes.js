/**
 * Crop Disease Knowledge Base Routes
 */
const express = require('express');
const router = express.Router();
const diseaseController = require('../controllers/diseaseController');

router.get('/', diseaseController.getDiseases);
router.get('/:id', diseaseController.getDiseaseById);

module.exports = router;
