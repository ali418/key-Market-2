if (!process.env.DATABASE_URL) {
  require('dotenv').config({ path: '../../.env' });
}

// Parse DATABASE_URL for Railway deployment
const parseDbUrl = (url) => {
  if (!url) return {};
  
  try {
    const dbUrl = new URL(url);
    return {
      username: dbUrl.username,
      password: dbUrl.password,
      database: dbUrl.pathname.slice(1), // Remove leading slash
      host: dbUrl.hostname,
      port: parseInt(dbUrl.port) || 5432,
    };
  } catch (error) {
    console.error('Error parsing DATABASE_URL:', error);
    return {};
  }
};

const databaseUrl = process.env.DATABASE_URL;
const parsedUrl = parseDbUrl(databaseUrl);

module.exports = {
  development: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'grocery_management',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: console.log,
    define: {
      timestamps: true,
      underscored: true,
    },
  },
  test: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'grocery_management_test',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
    define: {
      timestamps: true,
      underscored: true,
    },
  },
  production: {
    // Use parsed DATABASE_URL if available, otherwise fall back to individual env vars
    username: parsedUrl.username || process.env.DB_USER,
    password: parsedUrl.password || process.env.DB_PASSWORD,
    database: parsedUrl.database || process.env.DB_NAME,
    host: parsedUrl.host || process.env.DB_HOST,
    port: parsedUrl.port || process.env.DB_PORT,
    dialect: 'postgres',
    logging: false,
    define: {
      timestamps: true,
      underscored: true,
    },
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
};