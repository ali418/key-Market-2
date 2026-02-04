const express = require('express');
const router = express.Router();
const { query } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');
const reportController = require('../controllers/report.controller');

/**
 * @route GET /api/v1/reports/sales
 * @desc Get sales reports with optional date range filtering
 * @access Private
 */
router.get(
  '/sales',
  [
    query('startDate').optional().isDate().withMessage('Start date must be a valid date'),
    query('endDate').optional().isDate().withMessage('End date must be a valid date'),
    validateRequest,
  ],
  reportController.salesReport
);

/**
 * @route GET /api/v1/reports/inventory
 * @desc Get inventory status report
 * @access Private
 */
router.get('/inventory', reportController.inventoryStatusReport);

/**
 * @route GET /api/v1/reports/low-stock
 * @desc Get low stock items report
 * @access Private
 */
router.get('/low-stock', reportController.lowStockReport);

/**
 * @route GET /api/v1/reports/top-products
 * @desc Get top selling products report
 * @access Private
 */
router.get(
  '/top-products',
  [
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('startDate').optional().isDate().withMessage('Start date must be a valid date'),
    query('endDate').optional().isDate().withMessage('End date must be a valid date'),
    validateRequest,
  ],
  reportController.topSellingProductsReport
);

/**
 * @route GET /api/v1/reports/revenue
 * @desc Get revenue report with optional date range filtering
 * @access Private
 */
router.get(
  '/revenue',
  [
    query('startDate').optional().isDate().withMessage('Start date must be a valid date'),
    query('endDate').optional().isDate().withMessage('End date must be a valid date'),
    query('groupBy').optional().isIn(['day', 'week', 'month']).withMessage('Group by must be day, week, or month'),
    validateRequest,
  ],
  reportController.revenueReport
);

/**
 * @route GET /api/v1/reports/sales-by-category
 * @desc Get sales by category report
 * @access Private
 */
router.get(
  '/sales-by-category',
  [
    query('startDate').optional().isDate().withMessage('Start date must be a valid date'),
    query('endDate').optional().isDate().withMessage('End date must be a valid date'),
    validateRequest,
  ],
  reportController.salesByCategoryReport
);

/**
 * @route GET /api/v1/reports/customers
 * @desc Get customer visits and top customers report
 * @access Private
 */
router.get(
  '/customers',
  [
    query('startDate').optional().isDate().withMessage('Start date must be a valid date'),
    query('endDate').optional().isDate().withMessage('End date must be a valid date'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    validateRequest,
  ],
  reportController.customersReport
);

module.exports = router;