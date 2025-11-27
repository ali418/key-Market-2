const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Sale = sequelize.define('Sale', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    saleDate: {
      type: DataTypes.DATE,
      field: 'sale_date',
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    taxAmount: {
      type: DataTypes.DECIMAL(10, 2),
      field: 'tax_amount',
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    discountAmount: {
      type: DataTypes.DECIMAL(10, 2),
      field: 'discount_amount',
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      field: 'total_amount',
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    paymentMethod: {
      type: DataTypes.ENUM('cash', 'credit_card', 'debit_card', 'mobile_payment', 'other'),
      field: 'payment_method',
      allowNull: false,
      defaultValue: 'cash',
    },
    paymentStatus: {
      type: DataTypes.ENUM('pending', 'paid', 'partially_paid', 'refunded'),
      field: 'payment_status',
      allowNull: false,
      defaultValue: 'paid',
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'completed',
      validate: {
        isIn: [['pending', 'completed', 'cancelled']]
      }
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    receiptNumber: {
      type: DataTypes.STRING,
      field: 'receipt_number',
      allowNull: true,
      unique: true,
    }

  }, {
    tableName: 'sales',
    timestamps: true,
    underscored: true,
    paranoid: true, // Soft delete
  });

  Sale.associate = (models) => {
    // A sale belongs to a customer (optional)
    Sale.belongsTo(models.Customer, {
      foreignKey: {
        name: 'customerId',
        field: 'customer_id',
        allowNull: true,
      },
      as: 'customer',
    });

    // A sale is created by a user
    Sale.belongsTo(models.User, {
      foreignKey: {
        name: 'userId',
        field: 'user_id',
        allowNull: true, // Allow null for demo purposes
      },
      as: 'createdBy',
      onDelete: 'RESTRICT',
    });

    // A sale has many sale items
    Sale.hasMany(models.SaleItem, {
      foreignKey: {
        name: 'saleId',
        field: 'sale_id',
      },
      as: 'items',
      onDelete: 'CASCADE',
    });
  };

  return Sale;
};