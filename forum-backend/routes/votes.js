const express = require('express');
const { body } = require('express-validator');
const { requireAuth } = require('../middleware/auth');
const controller = require('../controllers/voteController');

const router = express.Router();

router.post('/thread/:threadId', requireAuth, [
  body('type').isIn(['upvote', 'downvote']).withMessage('Vote type must be upvote or downvote')
], controller.voteThread);

router.post('/thread/:threadId/reply/:replyId', requireAuth, [
  body('type').isIn(['upvote', 'downvote']).withMessage('Vote type must be upvote or downvote')
], controller.voteReply);

module.exports = router;