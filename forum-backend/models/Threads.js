const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['upvote', 'downvote'],
    required: true
  }
}, {
  timestamps: true
});

const replySchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    maxlength: 5000
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  votes: [voteSchema],
  parentReply: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  replies: [this], 
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  }
}, {
  timestamps: true
});

const threadSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    maxlength: 10000
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  tags: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tag'
  }],
  replies: [replySchema],
  votes: [voteSchema],
  views: {
    type: Number,
    default: 0
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Virtual for vote count
threadSchema.virtual('voteCount').get(function() {
  const upvotes = this.votes.filter(vote => vote.type === 'upvote').length;
  const downvotes = this.votes.filter(vote => vote.type === 'downvote').length;
  return upvotes - downvotes;
});

// Virtual for reply count
threadSchema.virtual('replyCount').get(function() {
  const countReplies = (replies) => {
    let count = replies.length;
    for (const reply of replies) {
      count += countReplies(reply.replies || []);
    }
    return count;
  };
  return countReplies(this.replies);
});

// Ensure virtual fields are serialized
threadSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Thread', threadSchema);