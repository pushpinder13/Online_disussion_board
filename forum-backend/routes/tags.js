const express = require('express');
const { body, query } = require('express-validator');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const controller = require('../controllers/tagController');

const router = express.Router();

router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().trim()
], controller.list);

router.get('/popular', controller.popular);

router.get('/:id', controller.getById);

router.post('/', requireAuth, requireAdmin, [
  body('name').trim().isLength({ min: 1, max: 30 }).withMessage('Name must be 1-30 characters').customSanitizer(value => value.toLowerCase()),
  body('description').optional().trim().isLength({ max: 100 }).withMessage('Description must be less than 100 characters'),
  body('color').optional().matches(/^#[0-9A-F]{6}$/i).withMessage('Color must be a valid hex color')
], controller.create);

router.put('/:id', requireAuth, requireAdmin, [
  body('name').optional().trim().isLength({ min: 1, max: 30 }).withMessage('Name must be 1-30 characters').customSanitizer(value => value?.toLowerCase()),
  body('description').optional().trim().isLength({ max: 100 }).withMessage('Description must be less than 100 characters'),
  body('color').optional().matches(/^#[0-9A-F]{6}$/i).withMessage('Color must be a valid hex color')
], controller.update);

router.delete('/:id', requireAuth, requireAdmin, controller.remove);

module.exports = router;