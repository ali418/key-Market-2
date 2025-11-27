if (process.env.NODE_ENV !== 'production' && !process.env.DATABASE_URL) {
  require('dotenv').config();
}
// Ensure JWT secrets exist to prevent login failures
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes('your_production')) {
  console.warn('JWT_SECRET missing; using temporary insecure default. Set it in Railway env.');
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'insecure-default-jwt-secret';
}
if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET.includes('your_production')) {
  console.warn('JWT_REFRESH_SECRET missing; using temporary insecure default. Set it in Railway env.');
  process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'insecure-default-jwt-refresh';
}
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const fileUpload = require('express-fileupload');
const path = require('path');
const { rateLimit } = require('express-rate-limit');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

// Initialize database
const db = require('./models');
const bcrypt = require('bcryptjs');

// Initialize express app
const app = express();

// Trust proxy for Railway deployment
app.set('trust proxy', 1);

// Configure rate limiting - More lenient for development and normal usage
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 500, // Increased to 500 requests per minute (much more reasonable)
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests, please try again later.',
  skip: (req) => {
    // Skip rate limiting for health checks, static files, and common endpoints
    const path = req.path || '';
    return (
      path === '/health' || 
      path.startsWith('/static/') ||
      path.startsWith('/api/v1/health') ||
      path.startsWith('/uploads/') ||
      req.method === 'OPTIONS' // Skip preflight requests
    );
  }
});

// Apply rate limiting to API routes only in production
if (process.env.NODE_ENV === 'production') {
  app.use('/api', apiLimiter);
} else {
  console.log('API rate limiter disabled in development');
}

// Set up middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "default-src": ["'self'"],
        "connect-src": [
          "'self'",
          "https://key-market-production.up.railway.app",
          "https://*.railway.app",
          "https://*.up.railway.app"
        ],
        "script-src": ["'self'", "'unsafe-inline'"],
        "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        "font-src": ["'self'", "data:", "https://fonts.gstatic.com"],
        "img-src": ["'self'", "data:", "https:"],
      },
    },
  })
); // Security headers
app.use(compression()); // Compress responses
// Improve CORS to accept multiple origins from env (comma-separated)
const defaultAllowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://key-market.up.railway.app',
  'https://key-market-production.up.railway.app',
];
const allowedOrigins = [
  ...((process.env.CORS_ORIGIN || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)),
  ...defaultAllowedOrigins,
];
const isAllowedOrigin = (origin) => {
  if (!origin) return true; // allow same-origin / curl / postman
  if (allowedOrigins.includes(origin)) return true;
  const railwayPattern = /^https?:\/\/[a-z0-9-]+\.up\.railway\.app$/i;
  const railwayPattern2 = /^https?:\/\/[a-z0-9-]+\.railway\.app$/i;
  return railwayPattern.test(origin) || railwayPattern2.test(origin);
};
app.use(
  cors({
    origin: (origin, callback) => {
      // Temporarily allow all origins to unblock production
      return callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(morgan('dev')); // Logging

// File upload middleware
app.use(fileUpload({
  limits: { fileSize: process.env.MAX_FILE_SIZE || 5 * 1024 * 1024 }, // 5MB default
  abortOnLimit: true,
  createParentPath: true,
  useTempFiles: true,
  tempFileDir: '/tmp/'
}));

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads')));

// Rate limiting - More reasonable limits
const isProduction = process.env.NODE_ENV === 'production';
const API_PREFIX = process.env.API_PREFIX || '/api/v1';
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1500, // 15 minutes
  max: Number(process.env.RATE_LIMIT_MAX) || 1500, // Increased to 1000 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  // Skip health, static assets, locales, favicon, and preflight requests
  skip: (req) => {
    const p = req.path || '';
    return (
      p === `${API_PREFIX}/health` ||
      p === '/api/v1/health' ||
      p === '/health' ||
      p.startsWith('/static/') ||
      p.startsWith('/locales/') ||
      p.startsWith('/uploads/') ||
      p === '/favicon.ico' ||
      req.method === 'OPTIONS'
    );
  },
});

if (isProduction) {
  // Apply rate limiter ONLY to API routes, not page navigations
  app.use(API_PREFIX, limiter);
} else {
  console.log('Main rate limiter disabled in development');
}

// Set up routes
app.use(API_PREFIX, routes);

// Serve static files from the frontend build directory with proper MIME types
app.use(express.static(path.join(__dirname, '../../frontend/build'), {
  setHeaders: (res, path) => {
    // Ensure JavaScript files are served with correct MIME type
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
    // Ensure CSS files are served with correct MIME type
    else if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

// Explicitly serve static JS chunks with correct MIME type
app.use('/static/js', express.static(path.join(__dirname, '../../frontend/build/static/js'), {
  setHeaders: (res) => {
    res.setHeader('Content-Type', 'application/javascript');
  }
}));

// Explicitly serve static CSS files with correct MIME type
app.use('/static/css', express.static(path.join(__dirname, '../../frontend/build/static/css'), {
  setHeaders: (res) => {
    res.setHeader('Content-Type', 'text/css');
  }
}));

// Handle nested routes for static files (fix for /products/static/js paths)
app.use('*/static/js', (req, res, next) => {
  // Redirect to the correct static/js path
  const correctPath = `/static/js${req.url}`;
  res.redirect(correctPath);
});

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  // Exclude API routes from this handler
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, '../../frontend/build', 'index.html'));
});

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || process.env.BACKEND_PORT || 3002;

(async () => {
  try {
    await db.sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Run migrations to ensure all tables exist
    console.log('Running database migrations...');
    
    // First, handle login_history table manually to avoid NOT NULL constraint errors
    try {
      // Check if created_at column exists
      const [createdAtExists] = await db.sequelize.query(
        "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'login_history' AND column_name = 'created_at';"
      );
      
      if (!createdAtExists || createdAtExists.length === 0) {
        console.log('Adding created_at column to login_history...');
        // Add column with default value first
        await db.sequelize.query('ALTER TABLE "login_history" ADD COLUMN "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;');
        // Update existing rows
        await db.sequelize.query('UPDATE "login_history" SET "created_at" = CURRENT_TIMESTAMP WHERE "created_at" IS NULL;');
        // Then make it NOT NULL
        await db.sequelize.query('ALTER TABLE "login_history" ALTER COLUMN "created_at" SET NOT NULL;');
        console.log('created_at column added successfully');
      }

      // Check if updated_at column exists
      const [updatedAtExists] = await db.sequelize.query(
        "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'login_history' AND column_name = 'updated_at';"
      );
      
      if (!updatedAtExists || updatedAtExists.length === 0) {
        console.log('Adding updated_at column to login_history...');
        // Add column with default value first
        await db.sequelize.query('ALTER TABLE "login_history" ADD COLUMN "updated_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;');
        // Update existing rows
        await db.sequelize.query('UPDATE "login_history" SET "updated_at" = CURRENT_TIMESTAMP WHERE "updated_at" IS NULL;');
        // Then make it NOT NULL
        await db.sequelize.query('ALTER TABLE "login_history" ALTER COLUMN "updated_at" SET NOT NULL;');
        console.log('updated_at column added successfully');
      }
      
      // Check if user_id column exists
      const [userIdExists] = await db.sequelize.query(
        "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'login_history' AND column_name = 'user_id';"
      );
      
      if (userIdExists && userIdExists.length > 0) {
        console.log('user_id column exists, checking for NULL values...');
        // Check if there are any NULL values in user_id
        const [nullUserIds] = await db.sequelize.query(
          "SELECT COUNT(*) FROM login_history WHERE user_id IS NULL;"
        );
        
        if (nullUserIds && nullUserIds[0] && parseInt(nullUserIds[0].count) > 0) {
          console.log(`Found ${nullUserIds[0].count} rows with NULL user_id, removing them...`);
          // Delete rows with NULL user_id as they cannot be fixed
          await db.sequelize.query('DELETE FROM "login_history" WHERE "user_id" IS NULL;');
          console.log('Removed rows with NULL user_id');
        }
      }
    } catch (loginHistoryError) {
      console.warn('Warning: Could not handle login_history columns:', loginHistoryError.message);
    }

    // Now run sync for other tables
    await db.sequelize.sync({ alter: true });
    console.log('Database migrations completed successfully.');

    // Ensure default admin user exists
    try {
      const { User } = db;
      let adminUser = await User.findOne({ where: { username: 'admin' }, paranoid: false });
      if (adminUser && adminUser.deletedAt) {
        try {
          await adminUser.restore();
          adminUser = await User.findOne({ where: { username: 'admin' } });
        } catch {}
      }
      if (!adminUser) {
        const hashed = await bcrypt.hash('admin123', 12);
        await User.create({
          username: 'admin',
          email: 'admin@example.com',
          password: hashed,
          fullName: 'Admin User',
          role: 'admin',
        });
        console.log('Default admin user created.');
      } else if (adminUser.password && !String(adminUser.password).startsWith('$2')) {
        const hashed = await bcrypt.hash('admin123', 12);
        await adminUser.update({ password: hashed });
        console.log('Default admin user password hashed.');
      }
    } catch (seedErr) {
      console.warn('Warning: could not ensure default admin user:', seedErr.message || seedErr);
    }

    // Now that tables are created, we can safely check for columns
    try {
      // Ensure products.image_url column exists
      const [results] = await db.sequelize.query(
        "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'image_url';"
      );
      if (!results || results.length === 0) {
        await db.sequelize.query('ALTER TABLE "products" ADD COLUMN "image_url" VARCHAR(255);');
        console.log('Added image_url column to products table');
      }
    } catch (columnError) {
      console.error('Error checking or adding columns:', columnError);
      // Continue execution even if column check fails
    }

    // Ensure products.barcode column exists
    const [barcodeRes] = await db.sequelize.query(
      "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'barcode';"
    );
    if (!barcodeRes || barcodeRes.length === 0) {
      await db.sequelize.query('ALTER TABLE "products" ADD COLUMN "barcode" VARCHAR(50);');
      console.log('Added barcode column to products table');
    }

    // Ensure products.cost column exists
    try {
      const [costRes] = await db.sequelize.query(
        "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'cost';"
      );
      if (!costRes || costRes.length === 0) {
        await db.sequelize.query('ALTER TABLE "products" ADD COLUMN "cost" NUMERIC(10,2) DEFAULT 0;');
        console.log('Added cost column to products table');
      }
    } catch (e) {
      console.warn('Warning: Could not ensure products.cost column:', e.message || e);
    }

    // Ensure inventory_transactions.inventory_id is INTEGER (not UUID)
    try {
      const [invTxCol] = await db.sequelize.query(
        "SELECT data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inventory_transactions' AND column_name = 'inventory_id';"
      );
      const colType = invTxCol && invTxCol[0] && (invTxCol[0].data_type || '').toLowerCase();
      if (colType && colType.includes('uuid')) {
        console.log('Fixing inventory_transactions.inventory_id type from UUID to INTEGER...');
        // Drop FK if exists
        try {
          await db.sequelize.query('ALTER TABLE "inventory_transactions" DROP CONSTRAINT IF EXISTS "inventory_transactions_inventory_id_fkey";');
        } catch (e) {}
        // Change column type using safe cast (table is typically empty or contains numeric-like uuids)
        await db.sequelize.query('ALTER TABLE "inventory_transactions" ALTER COLUMN "inventory_id" TYPE INTEGER USING (CAST("inventory_id"::text AS INTEGER));');
        // Re-add FK
        await db.sequelize.query('ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_inventory_id_fkey" FOREIGN KEY ("inventory_id") REFERENCES "inventory" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;');
        console.log('inventory_transactions.inventory_id type fixed to INTEGER.');
      }
    } catch (e) {
      console.warn('Warning: Could not verify/fix inventory_transactions.inventory_id type:', e.message || e);
    }

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to initialize server:', err);
    process.exit(1);
  }
})();

module.exports = app; // For testing purposes