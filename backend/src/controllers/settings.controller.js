const { Setting } = require('../models');

/**
 * @desc    Get all settings
 * @route   GET /api/v1/settings
 * @access  Private
 */
exports.getSettings = async (req, res, next) => {
  try {
    // Get settings from database
    const settings = await Setting.findAll();
    
    // Convert to key-value object
    const settingsObject = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});

    return res.status(200).json({
      success: true,
      data: settingsObject
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    next(error);
  }
};

/**
 * @desc    Update settings
 * @route   PUT /api/v1/settings
 * @access  Private/Admin
 */
exports.updateSettings = async (req, res, next) => {
  try {
    const settingsData = req.body;
    
    // Update each setting in the database
    for (const [key, value] of Object.entries(settingsData)) {
      await Setting.upsert({
        key,
        value: value !== null && value !== undefined ? String(value) : null
      });
    }

    // Get updated settings
    const updatedSettings = await Setting.findAll();
    
    // Convert to key-value object
    const settingsObject = updatedSettings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});

    return res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      data: settingsObject
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    next(error);
  }
};