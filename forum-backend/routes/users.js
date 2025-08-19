const express = require('express');
const { body } = require('express-validator');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const controller = require('../controllers/userController');

const router = express.Router();

router.get('/profile', requireAuth, controller.getProfile);
router.post('/register', controller.register);
router.get('/:id', controller.getById);
router.post('/login', controller.login);

router.put('/profile', requireAuth, [
  body('username').optional().trim().isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters'),
  body('bio').optional().trim().isLength({ max: 500 }).withMessage('Bio must be less than 500 characters'),
  body('avatar').optional().isURL().withMessage('Avatar must be a valid URL')
], controller.updateProfile);

router.get('/', requireAuth, requireAdmin, controller.list);

router.put('/:id/role', requireAuth, requireAdmin, [
  body('role').isIn(['user', 'moderator', 'admin']).withMessage('Invalid role')
], controller.updateRole);

router.put('/:id/status', requireAuth, requireAdmin, [
  body('isActive').isBoolean().withMessage('Status must be boolean')
], controller.updateStatus);

module.exports = router;