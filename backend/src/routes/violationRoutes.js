const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const violationController = require('../controllers/violationController');
const { validateViolation, validateFileUpload, validateQueryParams } = require('../../lib/validators');

// =============== Public Routes ===============
// Upload video (returns stream URL)
router.post('/upload', uploadController.uploadVideo);

// =============== Internal Routes (AI Service) ===============
// Record violation from AI service
router.post('/internal/record', validateViolation, violationController.recordViolation);

// =============== Bulk Operations (MUST come before /:id routes) ===============
router.patch('/bulk/approve', violationController.bulkApproveViolations);
router.patch('/bulk/reject', violationController.bulkRejectViolations);

// =============== Admin Routes ===============
// Get all violations with filters
router.get('/', validateQueryParams(), violationController.getViolations);

// Get single violation
router.get('/:id', violationController.getViolationById);

// Generate challan (PDF download)
router.post('/:id/challan', violationController.generateChallan);

// Approve violation
router.patch('/:id/approve', violationController.approveViolation);

// Reject violation
router.patch('/:id/reject', violationController.rejectViolation);

// Update violation status
router.patch('/:id/status', violationController.updateViolationStatus);

// Delete violation
router.delete('/:id', violationController.deleteViolation);

module.exports = router;
