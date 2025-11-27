const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';

// Load environment variables only if DATABASE_URL is not provided by platform
if (!process.env.DATABASE_URL) {
  require('dotenv').config({ path: path.join(__dirname, '../../../.env') });
}

// Import database configuration
const dbConfig = require('../config/database')[env];

let sequelize;

// Check for DATABASE_URL (Railway provides this)
if (process.env.DATABASE_URL) {
  // Initialize Sequelize with connection string
  console.log('Using DATABASE_URL for database connection');
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false
  });
} else {
  // Use configuration from database.js
  sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
      host: dbConfig.host,
      port: dbConfig.port,
      dialect: dbConfig.dialect,
      logging: dbConfig.logging,
      define: dbConfig.define,
      dialectOptions: dbConfig.dialectOptions
    }
  );
}

const db = {};

// Load models
fs.readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js'
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

// Ensure all models are loaded
const modelFiles = [
  'user.js',
  'product.js',
  'category.js',
  'inventory.js',
  'inventoryTransaction.js',
  'sale.js',
  'saleItem.js',
  'customer.js',
  'notification.js'
];

// Check if all required models are loaded
modelFiles.forEach(file => {
  const modelName = path.basename(file, '.js');
  // Convert to PascalCase for model name
  const pascalCaseModelName = modelName.charAt(0).toUpperCase() + modelName.slice(1);
  
  if (!db[pascalCaseModelName]) {
    console.warn(`Warning: Model ${pascalCaseModelName} not loaded. Check if the file exists and is properly defined.`);
  }
});

// Associate models
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;