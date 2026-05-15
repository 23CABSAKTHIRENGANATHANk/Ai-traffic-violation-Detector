const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const violationController = require('../controllers/violationController');

router.post('/upload', uploadController.uploadVideo);

// AI Service calls this to save data
router.post('/internal/record', violationController.recordViolation);

// Admin calls these
router.get('/', violationController.getViolations);
router.post('/:id/challan', violationController.generateChallan);

module.exports = router;
