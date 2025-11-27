const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');
const settingController = require('../controllers/setting.controller');

// GET /api/v1/settings - fetch settings
router.get('/', settingController.getSettings);

// PUT /api/v1/settings - update settings
router.put(
  '/',
  [
    body('store_name').optional().isString(),
    // Make currency validation more flexible
    body('currency_code').optional().isString(),
    body('currency_symbol').optional().isString(),
    body('email').optional({ nullable: true }).custom((value) => {
      if (value && value !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          throw new Error('Invalid email');
        }
      }
      return true;
    }),
    body('phone').optional({ nullable: true }).isString(),
    body('address').optional({ nullable: true }).isString(),
    body('city').optional({ nullable: true }).isString(),
    body('state').optional({ nullable: true }).isString(),
    body('postal_code').optional({ nullable: true }).isString(),
    body('country').optional({ nullable: true }).isString(),
    body('website').optional({ nullable: true }).isString(),
    body('tax_rate').optional({ nullable: true }).custom((value) => {
      if (value !== null && value !== undefined && value !== '') {
        const num = parseFloat(value);
        if (isNaN(num) || num < 0) {
          throw new Error('Tax rate must be a positive number');
        }
      }
      return true;
    }),
    body('logo_url').optional({ nullable: true }).isString(),
    body('language').optional().isString(),
    // Invoice fields - make more flexible
    body('invoice_prefix').optional({ nullable: true }).isString(),
    body('invoice_suffix').optional({ nullable: true }).isString(),
    body('invoice_next_number').optional({ nullable: true }).custom((value) => {
      if (value !== null && value !== undefined && value !== '') {
        const num = parseInt(value);
        if (isNaN(num) || num < 1) {
          throw new Error('Invoice next number must be a positive integer');
        }
      }
      return true;
    }),
    body('invoice_show_logo').optional({ nullable: true }).isBoolean(),
    body('invoice_show_tax_number').optional({ nullable: true }).isBoolean(),
    body('invoice_show_signature').optional({ nullable: true }).isBoolean(),
    body('invoice_footer_text').optional({ nullable: true }).isString(),
    body('invoice_terms_and_conditions').optional({ nullable: true }).isString(),
    // Receipt fields
    body('receipt_show_logo').optional({ nullable: true }).isBoolean(),
    body('receipt_show_tax_details').optional({ nullable: true }).isBoolean(),
    body('receipt_print_automatically').optional({ nullable: true }).isBoolean().toBoolean(),
    body('receipt_footer_text').optional({ nullable: true }).isString(),
    validateRequest,
  ],
  settingController.updateSettings
);

module.exports = router;