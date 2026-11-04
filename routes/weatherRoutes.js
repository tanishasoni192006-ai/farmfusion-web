/**
 * Weather Routes (Open-Meteo Integration)
 */
const express = require('express');
const router = express.Router();
const weatherController = require('../controllers/weatherController');

router.get('/locations', weatherController.getLocations);
router.get('/forecast', weatherController.getForecast);

module.exports = router;
