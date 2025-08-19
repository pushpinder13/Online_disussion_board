const { validationResult } = require('express-validator');
const Thread = require('../models/Threads');
const Tag = require('../models/Tag');

exports.list = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const sortBy = req.query.sortBy || 'recent';

    let query = {};
    if (req.query.category) {
      query.category = req.query.category;
    }
    if (req.query.tags) {
      const tagNames = req.query.tags.split(',');
      const tags = await Tag.find({ name: { $in: tagNames } });
      if (tags.length > 0) {
        query.tags = { $in: tags.map(tag => tag._id) };
      }
    }
    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { content: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    let sort = {};
    switch (sortBy) {
      case 'popular':
        sort = { 'votes.length': -1, createdAt: -1 };
        break;
      case 'views':
        sort = { views: -1, createdAt: -1 };
        break;
      default:
        sort = { isPinned: -1, createdAt: -1 };
    }

    const threads = await Thread.find(query)
      .populate('author', 'username avatar reputation')
      .populate('category', 'name color')
      .populate('tags', 'name color')
      .populate('replies.author', 'username avatar')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Thread.countDocuments(query);

    res.json({
      threads,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const thread = await Thread.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    )
    .populate('author', 'username avatar reputation')
    .populate('category', 'name color')
    .populate('tags', 'name color')
    .populate('replies.author', 'username avatar reputation')
    .populate('replies.replies.author', 'username avatar reputation');

    if (!thread) {
      return res.status(404).json({ message: 'Thread not found' });
    }
    res.json(thread);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, content, category, tags } = req.body;
    let tagIds = [];
    if (tags && tags.length > 0) {
      for (const tagName of tags) {
        let tag = await Tag.findOne({ name: tagName.toLowerCase().trim() });
        if (!tag) {
          tag = new Tag({ name: tagName.toLowerCase().trim() });
          await tag.save();
        } else {
          tag.usageCount += 1;
          await tag.save();
        }
        tagIds.push(tag._id);
      }
    }

    const thread = new Thread({
      title,
      content,
      author: req.user._id,
      category,
      tags: tagIds
    });

    await thread.save();
    await thread.populate('author', 'username avatar reputation');
    await thread.populate('category', 'name color');
    await thread.populate('tags', 'name color');

    res.status(201).json(thread);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const thread = await Thread.findById(req.params.id);
    if (!thread) {
      return res.status(404).json({ message: 'Thread not found' });
    }
    if (thread.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const { title, content } = req.body;
    if (title) thread.title = title;
    if (content) thread.content = content;
    thread.isEdited = true;
    thread.editedAt = new Date();
    await thread.save();
    await thread.populate('author', 'username avatar reputation');
    await thread.populate('category', 'name color');
    await thread.populate('tags', 'name color');
    res.json(thread);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const thread = await Thread.findById(req.params.id);
    if (!thread) {
      return res.status(404).json({ message: 'Thread not found' });
    }
    if (thread.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await Thread.findByIdAndDelete(req.params.id);
    res.json({ message: 'Thread deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


