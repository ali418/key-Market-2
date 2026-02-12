const { Notification, User, Product, Inventory } = require('../models');
const { Op } = require('sequelize');

/**
 * Get all notifications for the current user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getNotifications = async (req, res, next) => {
  try {
    // Ensure req.user exists before accessing id
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const userId = req.user.id;
    
    const notifications = await Notification.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit: 50,
    });
    
    return res.status(200).json(notifications);
  } catch (error) {
    next(error);
  }
};

/**
 * Get unread notification count for the current user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getUnreadCount = async (req, res, next) => {
  try {
    // Ensure req.user exists before accessing id
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const userId = req.user.id;
    
    const count = await Notification.count({
      where: { 
        userId,
        isRead: false
      },
    });
    
    return res.status(200).json(count);
  } catch (error) {
    next(error);
  }
};

/**
 * Mark a notification as read
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Ensure req.user exists before accessing id
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const userId = req.user.id;
    
    const notification = await Notification.findOne({
      where: { 
        id,
        userId 
      },
    });
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }
    
    await notification.update({ isRead: true });
    
    return res.status(200).json(notification);
  } catch (error) {
    next(error);
  }
};

/**
 * Mark all notifications as read for the current user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.markAllAsRead = async (req, res, next) => {
  try {
    // Ensure req.user exists before accessing id
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const userId = req.user.id;
    
    await Notification.update(
      { isRead: true },
      { where: { userId, isRead: false } }
    );
    
    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a notification
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const notification = await Notification.findOne({
      where: { 
        id,
        userId 
      },
    });
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }
    
    await notification.destroy();
    
    return res.status(200).json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new notification
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.createNotification = async (req, res, next) => {
  try {
    const { userId, type, title, message, relatedId, relatedType } = req.body;
    
    // Validate notification type
    const validTypes = ['low_stock', 'new_order', 'payment_received', 'system_update', 'customer_return', 'expiry_alert', 'near_expiry'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification type',
      });
    }
    
    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      relatedId,
      relatedType,
      isRead: false,
    });
    
    return res.status(201).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a low stock notification for a product
 * This is an internal function to be used by other controllers
 * @param {Number} productId - Product ID
 * @param {Number} quantity - Current quantity
 * @param {Number} minStockLevel - Minimum stock level
 */
exports.createLowStockNotification = async (productId, quantity, minStockLevel) => {
  try {
    // Get product details
    const product = await Product.findByPk(productId);
    if (!product) {
      console.error(`Product with ID ${productId} not found for low stock notification`);
      return;
    }
    
    // Get all admin users to notify
    const admins = await User.findAll({
      where: {
        role: {
          [Op.in]: ['admin', 'manager']
        }
      }
    });
    
    if (!admins || admins.length === 0) {
      console.error('No admin users found to notify about low stock');
      return;
    }
    
    // Create a notification for each admin
    const notifications = [];
    for (const admin of admins) {
      const notification = await Notification.create({
        userId: admin.id,
        type: 'low_stock',
        title: 'Low Stock Alert',
        message: `Product ${product.name} is running low on stock. Current quantity: ${quantity}, Minimum required: ${minStockLevel}`,
        relatedId: productId,
        relatedType: 'product',
        isRead: false,
      });
      
      notifications.push(notification);
    }
    
    console.log(`Created ${notifications.length} low stock notifications for product ${product.name}`);
    return notifications;
  } catch (error) {
    console.error('Error creating low stock notification:', error);
    return null;
  }
};

/**
 * Create an expiry notification for a product
 * @param {Number} productId - Product ID
 * @param {Date|String} expiryDate - Expiry date
 * @param {('expired'|'near')} status - Whether item is expired or near expiry
 */
exports.createExpiryNotification = async (productId, expiryDate, status = 'near') => {
  try {
    // Get product details
    const product = await Product.findByPk(productId);
    if (!product) {
      console.error(`Product with ID ${productId} not found for expiry notification`);
      return;
    }

    // Get all admin users to notify
    const admins = await User.findAll({
      where: {
        role: {
          [Op.in]: ['admin', 'manager']
        }
      }
    });

    if (!admins || admins.length === 0) {
      console.error('No admin users found to notify about expiry');
      return;
    }

    const dateStr = new Date(expiryDate).toISOString().split('T')[0];
    const isExpired = status === 'expired';
    const type = isExpired ? 'expiry_alert' : 'near_expiry';
    const title = isExpired ? 'Expired Item Alert' : 'Near Expiry Alert';
    const msg = isExpired
      ? `Product ${product.name} has expired on ${dateStr}.`
      : `Product ${product.name} will expire on ${dateStr}.`;

    const notifications = [];
    for (const admin of admins) {
      const notification = await Notification.create({
        userId: admin.id,
        type,
        title,
        message: msg,
        relatedId: productId,
        relatedType: 'product',
        isRead: false,
      });
      notifications.push(notification);
    }

    console.log(`Created ${notifications.length} ${type} notifications for product ${product.name}`);
    return notifications;
  } catch (error) {
    console.error('Error creating expiry notification:', error);
    return null;
  }
};