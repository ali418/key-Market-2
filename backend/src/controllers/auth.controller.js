const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// Add safe fallbacks for JWT secrets when env vars are missing or placeholders
const getJwtSecret = () => {
  const s = process.env.JWT_SECRET;
  if (!s || /your.*jwt.*secret/i.test(String(s))) {
    return 'insecure_default_jwt_secret';
  }
  return s;
};
const getJwtRefreshSecret = () => {
  const s = process.env.JWT_REFRESH_SECRET;
  if (!s || /your.*jwt.*refresh.*secret/i.test(String(s))) {
    return 'insecure_default_jwt_refresh_secret';
  }
  return s;
};
const { User, LoginHistory } = require('../models');

/**
 * Register a new user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.register = async (req, res, next) => {
  try {
    const { username, email, password, fullName, role = 'user' } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      const error = new Error('User with this email already exists');
      error.statusCode = 409;
      throw error;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      fullName,
      role,
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      getJwtSecret(),
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Generate refresh token
    const refreshToken = jwt.sign(
      { userId: user.id },
      getJwtRefreshSecret(),
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    // Return user data and tokens
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      token,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    
    console.log(`Login attempt for username: ${username}`);

    // Find user by username
    const user = await User.findOne({ where: { username } });
    if (!user) {
      console.log(`User not found: ${username}`);
      const error = new Error('Invalid credentials');
      error.statusCode = 401;
      throw error;
    }

    // Check password
    console.log(`Checking password for user: ${username}`);
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log(`Invalid password for user: ${username}`);
      // Record failed login attempt
      try {
        await LoginHistory.create({
          userId: user.id,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          device: (req.headers['user-agent'] || '').split(') ').pop() || null,
          status: 'failed',
        });
      } catch (e) {
        console.error('Error recording login history:', e);
      }
      const error = new Error('Invalid credentials');
      error.statusCode = 401;
      throw error;
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      getJwtSecret(),
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Generate refresh token
    const refreshToken = jwt.sign(
      { userId: user.id },
      getJwtRefreshSecret(),
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    // Update lastLogin and record successful login in history (do not block on failure)
    try {
      await user.update({ lastLogin: new Date() });
      await LoginHistory.create({
        userId: user.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        device: (req.headers['user-agent'] || '').split(') ').pop() || null,
        status: 'success',
      });
    } catch (e) {
      // ignore history/update errors
    }

    // Return user data and tokens
    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        lastLogin: user.lastLogin,
      },
      token,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh JWT token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      const error = new Error('Refresh token is required');
      error.statusCode = 400;
      throw error;
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, getJwtRefreshSecret());
    } catch (err) {
      const error = new Error('Invalid refresh token');
      error.statusCode = 401;
      throw error;
    }

    // Find user
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    // Generate new JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      getJwtSecret(),
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Generate new refresh token
    const newRefreshToken = jwt.sign(
      { userId: user.id },
      getJwtRefreshSecret(),
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    res.status(200).json({
      message: 'Token refreshed successfully',
      token,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.logout = async (req, res, next) => {
  try {
    // In a real application, you would invalidate the refresh token
    // This could be done by adding it to a blacklist or removing it from the database
    
    res.status(200).json({
      message: 'Logout successful',
    });
  } catch (error) {
    next(error);
  }
};