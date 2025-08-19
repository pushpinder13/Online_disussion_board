const express = require('express');
const { body } = require('express-validator');
const { requireAuth } = require('../middleware/auth');
const controller = require('../controllers/replyController');

const router = express.Router();

router.post('/:threadId', requireAuth, [
  body('content').trim().isLength({ min: 1, max: 5000 }).withMessage('Content must be 1-5000 characters'),
  body('parentReply').optional().isMongoId().withMessage('Valid parent reply ID required')
], controller.create);

router.put('/:threadId/reply/:replyId', requireAuth, [
  body('content').trim().isLength({ min: 1, max: 5000 }).withMessage('Content must be 1-5000 characters')
], controller.update);

router.delete('/:threadId/reply/:replyId', requireAuth, controller.remove);

module.exports = router;