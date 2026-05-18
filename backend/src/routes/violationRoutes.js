const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const violationController = require('../controllers/violationController');
const { validateViolation, validateFileUpload, validateQueryParams } = require('../../lib/validators');
const { requireAdmin } = require('../../lib/auth');

// =============== Public Routes ===============
// Upload video (returns stream URL) - Auth required
router.post('/upload', uploadController.uploadVideo);

// =============== Internal Routes (AI Service) ===============
// Record violation from AI service - Auth optional (internal system)
// In production, use API key or internal network isolation
router.post('/internal/record', validateViolation, violationController.recordViolation);

// =============== Admin Routes (All require authentication via parent middleware) ===============
// Get all violations with filters
router.get('/', validateQueryParams(), violationController.getViolations);

// Get single violation
router.get('/:id', violationController.getViolationById);

// Generate challan (PDF download) - Admin only
router.post('/:id/challan', requireAdmin, violationController.generateChallan);

// Approve violation - Admin only
router.patch('/:id/approve', requireAdmin, violationController.approveViolation);

// Reject violation - Admin only
router.patch('/:id/reject', requireAdmin, violationController.rejectViolation);

// Update violation status - Admin only
router.patch('/:id/status', requireAdmin, violationController.updateViolationStatus);

// Delete violation - Admin only
router.delete('/:id', requireAdmin, violationController.deleteViolation);

// Bulk operations - Admin only
router.patch('/bulk/approve', requireAdmin, violationController.bulkApproveViolations);
router.patch('/bulk/reject', requireAdmin, violationController.bulkRejectViolations);

module.exports = router;
