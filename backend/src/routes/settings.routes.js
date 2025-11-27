const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');
const { protect, restrictTo } = require('../middleware/auth');

/**
 * @route   GET /api/v1/settings
 * @desc    Get all settings
 * @access  Private
 */
router.get('/', protect, settingsController.getSettings);

/**
 * @route   PUT /api/v1/settings
 * @desc    Update settings
 * @access  Private/Admin
 */
router.put('/', protect, restrictTo(['admin']), settingsController.updateSettings);

module.exports = router;