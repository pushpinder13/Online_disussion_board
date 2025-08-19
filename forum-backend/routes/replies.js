const express = require('express');
const { body, validationResult } = require('express-validator');
const Thread = require('../models/Threads');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/:threadId', requireAuth, [
  body('content')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Content must be 1-5000 characters'),
  body('parentReply')
    .optional()
    .isMongoId()
    .withMessage('Valid parent reply ID required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content, parentReply } = req.body;
    const thread = await Thread.findById(req.params.threadId);

    if (!thread) {
      return res.status(404).json({ message: 'Thread not found' });
    }

    if (thread.isLocked) {
      return res.status(403).json({ message: 'Thread is locked' });
    }

    const reply = {
      content,
      author: req.user._id,
      parentReply: parentReply || null,
      votes: [],
      replies: []
    };

    if (parentReply) {
      const findAndAddReply = (replies, parentId, newReply) => {
        for (let i = 0; i < replies.length; i++) {
          if (replies[i]._id.toString() === parentId) {
            replies[i].replies.push(newReply);
            return true;
          }
          if (replies[i].replies.length > 0) {
            if (findAndAddReply(replies[i].replies, parentId, newReply)) {
              return true;
            }
          }
        }
        return false;
      };

      if (!findAndAddReply(thread.replies, parentReply, reply)) {
        return res.status(404).json({ message: 'Parent reply not found' });
      }
    } else {
      thread.replies.push(reply);
    }

    await thread.save();
    await thread.populate('replies.author', 'username avatar reputation');
    await thread.populate('replies.replies.author', 'username avatar reputation');

    res.status(201).json({ message: 'Reply added successfully', thread });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/:threadId/reply/:replyId', requireAuth, [
  body('content')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Content must be 1-5000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content } = req.body;
    const thread = await Thread.findById(req.params.threadId);

    if (!thread) {
      return res.status(404).json({ message: 'Thread not found' });
    }

    const findAndUpdateReply = (replies, replyId, newContent, userId) => {
      for (let i = 0; i < replies.length; i++) {
        if (replies[i]._id.toString() === replyId) {
          if (replies[i].author.toString() !== userId) {
            throw new Error('Not authorized');
          }
          replies[i].content = newContent;
          replies[i].isEdited = true;
          replies[i].editedAt = new Date();
          return true;
        }
        if (replies[i].replies.length > 0) {
          if (findAndUpdateReply(replies[i].replies, replyId, newContent, userId)) {
            return true;
          }
        }
      }
      return false;
    };

    try {
      if (!findAndUpdateReply(thread.replies, req.params.replyId, content, req.user._id.toString())) {
        return res.status(404).json({ message: 'Reply not found' });
      }
    } catch (error) {
      return res.status(403).json({ message: error.message });
    }

    await thread.save();
    res.json({ message: 'Reply updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.delete('/:threadId/reply/:replyId', requireAuth, async (req, res) => {
  try {
    const thread = await Thread.findById(req.params.threadId);

    if (!thread) {
      return res.status(404).json({ message: 'Thread not found' });
    }

        const findAndRemoveReply = (replies, replyId, userId, isAdmin) => {
      for (let i = 0; i < replies.length; i++) {
        if (replies[i]._id.toString() === replyId) {
          if (replies[i].author.toString() !== userId && !isAdmin) {
            throw new Error('Not authorized');
          }
          replies.splice(i, 1);
          return true;
        }
        if (replies[i].replies.length > 0) {
          if (findAndRemoveReply(replies[i].replies, replyId, userId, isAdmin)) {
            return true;
          }
        }
      }
      return false;
    };

    try {
      const isAdmin = req.user.role === 'admin';
      if (!findAndRemoveReply(thread.replies, req.params.replyId, req.user._id.toString(), isAdmin)) {
        return res.status(404).json({ message: 'Reply not found' });
      }
    } catch (error) {
      return res.status(403).json({ message: error.message });
    }

    await thread.save();
    res.json({ message: 'Reply deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;