const { validationResult } = require('express-validator');
const Thread = require('../models/Threads');
const User = require('../models/User');

exports.voteThread = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { type } = req.body;
    const thread = await Thread.findById(req.params.threadId);
    if (!thread) {
      return res.status(404).json({ message: 'Thread not found' });
    }

    const existingVoteIndex = thread.votes.findIndex(
      vote => vote.user.toString() === req.user._id.toString()
    );

    if (existingVoteIndex !== -1) {
      const existingVote = thread.votes[existingVoteIndex];
      if (existingVote.type === type) {
        thread.votes.splice(existingVoteIndex, 1);
      } else {
        existingVote.type = type;
      }
    } else {
      thread.votes.push({ user: req.user._id, type });
    }

    await thread.save();

    const voteCount = thread.votes.filter(v => v.type === 'upvote').length - 
                     thread.votes.filter(v => v.type === 'downvote').length;
    await User.findByIdAndUpdate(thread.author, {
      $set: { reputation: Math.max(0, voteCount * 10) }
    });

    res.json({
      message: 'Vote recorded successfully',
      voteCount,
      userVote: existingVoteIndex !== -1 ? thread.votes.find(v => v.user.toString() === req.user._id.toString())?.type : null
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.voteReply = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { type } = req.body;
    const thread = await Thread.findById(req.params.threadId);
    if (!thread) {
      return res.status(404).json({ message: 'Thread not found' });
    }

    const findAndVoteReply = (replies, replyId, userId, voteType) => {
      for (let reply of replies) {
        if (reply._id.toString() === replyId) {
          const existingVoteIndex = reply.votes.findIndex(
            vote => vote.user.toString() === userId
          );
          if (existingVoteIndex !== -1) {
            const existingVote = reply.votes[existingVoteIndex];
            if (existingVote.type === voteType) {
              reply.votes.splice(existingVoteIndex, 1);
            } else {
              existingVote.type = voteType;
            }
          } else {
            reply.votes.push({ user: userId, type: voteType });
          }
          return true;
        }
        if (reply.replies.length > 0) {
          if (findAndVoteReply(reply.replies, replyId, userId, voteType)) {
            return true;
          }
        }
      }
      return false;
    };

    if (!findAndVoteReply(thread.replies, req.params.replyId, req.user._id.toString(), type)) {
      return res.status(404).json({ message: 'Reply not found' });
    }

    await thread.save();
    res.json({ message: 'Vote recorded successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


