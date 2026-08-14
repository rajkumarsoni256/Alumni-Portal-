const adminSettingsService = require('../services/adminSettingsService');

/**
 * Controller to fetch system and admin settings
 */
const getSettings = async (req, res, next) => {
  try {
    const adminUserId = req.user?.id || req.user?.sub;
    const settings = await adminSettingsService.getSettings(adminUserId);

    return res.status(200).json({
      success: true,
      message: 'Settings retrieved successfully',
      data: settings,
    });
  } catch (error) {
    console.error('Error fetching admin settings:', error);
    next(error);
  }
};

/**
 * Controller to update system settings and admin profile
 */
const updateSettings = async (req, res, next) => {
  try {
    const adminUserId = req.user?.id || req.user?.sub;
    const updatedSettings = await adminSettingsService.updateSettings(adminUserId, req.body);

    return res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      data: updatedSettings,
    });
  } catch (error) {
    console.error('Error updating admin settings:', error);
    next(error);
  }
};

module.exports = {
  getSettings,
  updateSettings,
};
