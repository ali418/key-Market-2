/**
 * Mock authentication middleware for POS system
 * This middleware sets a default user for requests without authentication
 * In production, this should be replaced with proper JWT authentication
 */

const { User } = require('../models');
const bcrypt = require('bcryptjs');

const mockAuth = async (req, res, next) => {
  // If real auth already set a user, skip
  if (req.user) return next();

  // In production, do not perform any mock user setup or password resets
  if (process.env.NODE_ENV === 'production') {
    return next();
  }

  try {
    // Try to use an existing admin user to satisfy FK constraints (include soft-deleted)
    let adminUser = await User.findOne({ where: { username: 'admin' }, paranoid: false });

    // If found but soft-deleted, restore it
    if (adminUser && adminUser.deletedAt) {
      try {
        await adminUser.restore();
        // Re-fetch to ensure values reflect restored state
        adminUser = await User.findOne({ where: { username: 'admin' } });
      } catch (restoreErr) {
        // If restore fails, continue to creation flow below
      }
    }

    // Ensure admin password is 'admin123' (reset if mismatched or not hashed)
  if (adminUser && adminUser.password) {
    try {
      let needsReset = false;
      if (!adminUser.password.startsWith('$2')) {
        needsReset = true;
      } else {
        const matches = await bcrypt.compare('admin123', adminUser.password);
        needsReset = !matches;
      }
      if (needsReset) {
        const hashedPassword = await bcrypt.hash('admin123', 12);
        await adminUser.update({ password: hashedPassword });
      }
    } catch (pwdErr) {
      // ignore password update errors
    }
  }
  // Ensure admin role is set correctly
  if (adminUser && adminUser.role !== 'admin') {
    try {
      await adminUser.update({ role: 'admin' });
    } catch (roleErr) {
      // ignore role update errors
    }
  }

    if (!adminUser) {
      // If not found, try to create a default admin to satisfy FK constraints
      const DEFAULT_ID = '550e8400-e29b-41d4-a716-446655440000';
      try {
        const hashedPassword = await bcrypt.hash('admin123', 12);
        adminUser = await User.create({
          id: DEFAULT_ID,
          username: 'admin',
          email: 'admin@example.com',
          password: hashedPassword, // secure for development only
          fullName: 'Admin User',
          role: 'admin',
        });
      } catch (createErr) {
        // If creation failed due to unique constraints, try fetching by ID
        try {
          adminUser = await User.findOne({ where: { id: DEFAULT_ID }, paranoid: false });
          if (adminUser && adminUser.deletedAt) {
            await adminUser.restore();
            adminUser = await User.findOne({ where: { id: DEFAULT_ID } });
          }
        } catch (fetchErr) {
          // ignore and fall through to fallback user
        }
      }
    }

    if (adminUser) {
      req.user = {
        id: adminUser.id,
        username: adminUser.username,
        email: adminUser.email,
        fullName: adminUser.fullName,
        role: adminUser.role || 'admin',
      };
      return next();
    }
  } catch (e) {
    // ignore and fall back below
  }

  // Fallback default user for development if DB user not found
  req.user = {
    id: '550e8400-e29b-41d4-a716-446655440000', // Default UUID (should exist in users for FK)
    username: 'admin',
    email: 'admin@test.com',
    fullName: 'Admin User',
    role: 'admin',
  };

  return next();
};

module.exports = mockAuth;