const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');
const userController = require('../controllers/user.controller');
const { protect } = require('../middleware/auth');

/**
 * @route GET /api/v1/users
 * @desc Get all users (admin only)
 * @access Private/Admin
 */
router.get('/', protect, userController.getAllUsers);

/**
 * @route GET /api/v1/users/profile
 * @desc Get current user profile
 * @access Private
 */
router.get('/profile', protect, userController.getCurrentUser);

/**
 * @route GET /api/v1/users/login-history
 * @desc Get current user's login history
 * @access Private
 */
router.get('/login-history', protect, userController.getCurrentUserLoginHistory);

/**
 * @route GET /api/v1/users/:id
 * @desc Get user by ID
 * @access Private
 */
router.get('/:id', protect, userController.getUserById);

/**
 * @route POST /api/v1/users
 * @desc Create a new user (admin only)
 * @access Private/Admin
 */
router.post(
  '/',
  protect,
  [
    body('username').notEmpty().withMessage('Username is required'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    body('fullName').notEmpty().withMessage('Full name is required'),
    body('role').optional().isIn(['admin', 'manager', 'cashier', 'storekeeper', 'accountant', 'staff']).withMessage('Invalid role'),
    validateRequest,
  ],
  userController.createUser,
);

/**
 * @route PUT /api/v1/users/:id
 * @desc Update a user
 * @access Private
 */
router.put(
  '/:id',
  protect,
  [
    body('username').optional().notEmpty().withMessage('Username cannot be empty'),
    body('email').optional().isEmail().withMessage('Please provide a valid email'),
    body('role').optional().isIn(['admin', 'manager', 'cashier', 'storekeeper', 'accountant', 'staff']).withMessage('Invalid role'),
    validateRequest,
  ],
  userController.updateUser,
);

/**
 * @route PATCH /api/v1/users/:id/change-password
 * @desc Change user password
 * @access Private
 */
router.patch(
  '/:id/change-password',
  protect,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters long'),
    validateRequest,
  ],
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { currentPassword, newPassword } = req.body;

      if (!req.user || !req.user.id) {
        return res.status(401).json({ success: false, message: 'User not authenticated' });
      }

      const isSelf = String(req.user.id) === String(id);
      const isAdmin = req.user.role === 'admin';
      if (!isSelf && !isAdmin) {
        return res.status(403).json({ success: false, message: 'Forbidden: You cannot change this user\'s password' });
      }

      const { User } = require('../models');
      const bcrypt = require('bcryptjs');

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      // Admins can bypass current password check; others must provide correct current password
      if (!isAdmin) {
        const valid = await bcrypt.compare(currentPassword, user.password);
        if (!valid) {
          return res.status(400).json({ success: false, message: 'Current password is incorrect' });
        }
      }

      try {
        // تحسين تشفير كلمة المرور باستخدام معامل تكلفة أعلى
        const saltRounds = 12;
        const hashed = await bcrypt.hash(newPassword, saltRounds);

        // تأكد من تحديث كلمة المرور بشكل صحيح
        await user.update({ password: hashed });

        // تسجيل تغيير كلمة المرور في السجل
        console.log(`Password updated for user ${user.id} at ${new Date().toISOString()}`);
      } catch (error) {
        console.error('Error updating password:', error);
        return res.status(500).json({ success: false, message: 'Failed to update password', error: error.message });
      }

      return res.status(200).json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @route DELETE /api/v1/users/:id
 * @desc Delete a user (admin only)
 * @access Private/Admin
 */
router.delete('/:id', protect, userController.deleteUser);

/**
 * @route GET /api/v1/users/:id/login-history
 * @desc Get login history for a specific user (admin only or self)
 * @access Private
 */
router.get('/:id/login-history', protect, userController.getUserLoginHistory);

module.exports = router;