const express = require('express');
const { body, query } = require('express-validator');
const { requireAuth } = require('../middleware/auth');
const controller = require('../controllers/threadController');

const router = express.Router();

router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('sortBy').optional().isIn(['recent', 'popular', 'views']),
  query('category').optional().isMongoId(),
  query('tags').optional(),
  query('search').optional()
], controller.list);

router.get('/:id', controller.getById);

router.post('/', requireAuth, [
  body('title').trim().isLength({ min: 5, max: 200 }).withMessage('Title must be 5-200 characters'),
  body('content').trim().isLength({ min: 10, max: 10000 }).withMessage('Content must be 10-10000 characters'),
  body('category').isMongoId().withMessage('Valid category required'),
  body('tags').optional().isArray({ max: 5 }).withMessage('Maximum 5 tags allowed')
], controller.create);

router.put('/:id', requireAuth, [
  body('title').optional().trim().isLength({ min: 5, max: 200 }),
  body('content').optional().trim().isLength({ min: 10, max: 10000 }),
], controller.update);

router.delete('/:id', requireAuth, controller.remove);

module.exports = router;