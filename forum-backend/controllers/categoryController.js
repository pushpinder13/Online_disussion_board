const { validationResult } = require('express-validator');
const Category = require('../models/Category');
const Thread = require('../models/Threads');

exports.getAll = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const query = {};
    if (req.query.isActive !== undefined) {
      query.isActive = req.query.isActive === 'true';
    } else {
      query.isActive = true;
    }
    const categories = await Category.find(query);
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Failed to fetch categories', error: error.message });
  }
};

exports.getById = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    if (req.query.includeThreadCount === 'true') {
      const threadCount = await Thread.countDocuments({ category: req.params.id });
      const categoryObj = category.toObject();
      categoryObj.threadCount = threadCount;
      return res.json(categoryObj);
    }
    res.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ message: 'Failed to fetch category', error: error.message });
  }
};

exports.getThreadsByCategory = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const sortBy = req.query.sortBy || 'recent';

    const categoryExists = await Category.exists({ _id: req.params.id });
    if (!categoryExists) {
      return res.status(404).json({ message: 'Category not found' });
    }

    let sortOptions = {};
    switch (sortBy) {
      case 'popular':
        sortOptions = { voteCount: -1, createdAt: -1 };
        break;
      case 'views':
        sortOptions = { views: -1, createdAt: -1 };
        break;
      default:
        sortOptions = { isPinned: -1, createdAt: -1 };
    }

    const threads = await Thread.find({ category: req.params.id })
      .populate('author', 'username avatar')
      .populate('category', 'name color')
      .populate('tags', 'name color')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    const total = await Thread.countDocuments({ category: req.params.id });

    res.json({
      threads,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Error fetching threads by category:', error);
    res.status(500).json({ message: 'Failed to fetch threads by category', error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, color } = req.body;
    const existingCategory = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existingCategory) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    const category = new Category({ name, description, color });
    await category.save();

    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ message: 'Failed to create category', error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, color, isActive } = req.body;
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: req.params.id }
      });
      if (existingCategory) {
        return res.status(400).json({ message: 'Category name already exists' });
      }
    }

    if (name) category.name = name;
    if (description !== undefined) category.description = description;
    if (color) category.color = color;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();
    res.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ message: 'Failed to update category', error: error.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const threadCount = await Thread.countDocuments({ category: req.params.id });
    if (threadCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete category with existing threads. Consider deactivating it instead.'
      });
    }

    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ message: 'Failed to delete category', error: error.message });
  }
};


