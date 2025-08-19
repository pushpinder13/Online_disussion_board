const express = require('express');
const { body, query } = require('express-validator');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const controller = require('../controllers/categoryController');

const router = express.Router();

router.get('/', [
  query('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
], controller.getAll);

router.get('/:id', [
  query('includeThreadCount').optional().isBoolean().withMessage('includeThreadCount must be a boolean')
], controller.getById);

router.get('/:id/threads', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('sortBy').optional().isIn(['recent', 'popular', 'views']).withMessage('Invalid sort option')
], controller.getThreadsByCategory);

router.post('/', requireAuth, requireAdmin, [
  body('name').trim().isLength({ min: 1, max: 50 }).withMessage('Name must be 1-50 characters'),
  body('description').optional().trim().isLength({ max: 200 }).withMessage('Description must be less than 200 characters'),
  body('color').optional().matches(/^#[0-9A-F]{6}$/i).withMessage('Color must be a valid hex color')
], controller.create);

router.put('/:id', requireAuth, requireAdmin, [
  body('name').optional().trim().isLength({ min: 1, max: 50 }).withMessage('Name must be 1-50 characters'),
  body('description').optional().trim().isLength({ max: 200 }).withMessage('Description must be less than 200 characters'),
  body('color').optional().matches(/^#[0-9A-F]{6}$/i).withMessage('Color must be a valid hex color'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
], controller.update);

router.delete('/:id', requireAuth, requireAdmin, controller.remove);

module.exports = router;
