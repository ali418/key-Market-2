const bcrypt = require('bcryptjs');
const { User, LoginHistory } = require('../models');
const { Op } = require('sequelize');

/**
 * Get all users
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, role, isActive } = req.query;
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = {};
    
    if (search) {
      whereClause[Op.or] = [
        { username: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { fullName: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (role) {
      whereClause.role = role;
    }

    if (isActive !== undefined) {
      whereClause.isActive = isActive === 'true';
    }

    // Get users with pagination
    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalUsers: count,
        hasNext: page * limit < count,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Error getting users:', error);
    next(error);
  }
};

/**
 * Get user by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: LoginHistory,
          as: 'loginHistory',
          limit: 10,
          order: [['loginTime', 'DESC']],
        },
      ],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error getting user by ID:', error);
    next(error);
  }
};

/**
 * Create new user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.createUser = async (req, res, next) => {
  try {
    const { username, email, password, fullName, phone, role = 'staff' } = req.body;

    // Validate required fields
    if (!username || !email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: username, email, password, fullName',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email or username already exists',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      fullName,
      phone,
      role,
      isActive: true,
    });

    // Remove password from response
    const userResponse = user.toJSON();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: userResponse,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    next(error);
  }
};

/**
 * Update user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { username, email, fullName, phone, role, isActive, password } = req.body;

    // Find user
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if current user can update this user
    const currentUser = req.user;
    if (currentUser.role !== 'admin' && currentUser.id !== user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own profile',
      });
    }

    // Check if email/username is already taken by another user
    if (email || username) {
      const existingUser = await User.findOne({
        where: {
          [Op.and]: [
            { id: { [Op.ne]: id } },
            {
              [Op.or]: [
                ...(email ? [{ email }] : []),
                ...(username ? [{ username }] : []),
              ],
            },
          ],
        },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Email or username already exists',
        });
      }
    }

    // Update fields
    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (fullName) updateData.fullName = fullName;
    if (phone !== undefined) updateData.phone = phone;
    if (isActive !== undefined && currentUser.role === 'admin') {
      updateData.isActive = isActive;
    }
    if (role && currentUser.role === 'admin') updateData.role = role;

    // Hash new password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    // Update user
    await user.update(updateData);

    // Get updated user without password
    const updatedUser = await User.findByPk(id, {
      attributes: { exclude: ['password'] },
    });

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    next(error);
  }
};

/**
 * Delete user (soft delete)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    // Only admin can delete users
    if (currentUser.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can delete users',
      });
    }

    // Find user
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent deleting the last admin
    if (user.role === 'admin') {
      const adminCount = await User.count({
        where: { role: 'admin', isActive: true },
      });

      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete the last admin user',
        });
      }
    }

    // Prevent admin from deleting themselves
    if (user.id === currentUser.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account',
      });
    }

    // Soft delete by setting isActive to false
    await user.update({ isActive: false });

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    next(error);
  }
};

/**
 * Get current user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: LoginHistory,
          as: 'loginHistory',
          limit: 10,
          order: [['loginTime', 'DESC']],
        },
      ],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error getting current user:', error);
    next(error);
  }
};

/**
 * Get user login history
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getUserLoginHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const currentUser = req.user;

    // Check permissions - admin can view any user's history, users can only view their own
    if (currentUser.role !== 'admin' && currentUser.id !== parseInt(id)) {
      return res.status(403).json({
        success: false,
        message: 'You can only view your own login history',
      });
    }

    // Get login history with pagination
    const { count, rows: loginHistory } = await LoginHistory.findAndCountAll({
      where: { userId: id },
      order: [['loginTime', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.status(200).json({
      success: true,
      data: loginHistory,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalRecords: count,
        hasNext: page * limit < count,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Error getting user login history:', error);
    next(error);
  }
};

/**
 * Get users statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getUsersStats = async (req, res, next) => {
  try {
    // Only admin can view statistics
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can view user statistics',
      });
    }

    const stats = await Promise.all([
      User.count({ where: { isActive: true } }),
      User.count({ where: { isActive: false } }),
      User.count({ where: { role: 'admin' } }),
      User.count({ where: { role: 'manager' } }),
      User.count({ where: { role: 'cashier' } }),
      User.count({ where: { role: 'storekeeper' } }),
      User.count({ where: { role: 'accountant' } }),
      User.count({ where: { role: 'staff' } }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers: stats[0] + stats[1],
        activeUsers: stats[0],
        inactiveUsers: stats[1],
        roleDistribution: {
          admin: stats[2],
          manager: stats[3],
          cashier: stats[4],
          storekeeper: stats[5],
          accountant: stats[6],
          staff: stats[7],
        },
      },
    });
  } catch (error) {
    console.error('Error getting user statistics:', error);
    next(error);
  }
};

/**
 * Get current user's login history
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getCurrentUserLoginHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Get current user's login history
    const { count, rows: loginHistory } = await LoginHistory.findAndCountAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.status(200).json({
      success: true,
      data: loginHistory,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalRecords: count,
        hasNextPage: page < Math.ceil(count / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error('Error getting current user login history:', error);
    next(error);
  }
};