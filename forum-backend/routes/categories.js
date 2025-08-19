const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Category = require('../models/Category');
const Thread = require('../models/Threads');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all categories
router.get('/', [
  query('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    // Build query based on isActive parameter
    const query = {};
    if (req.query.isActive !== undefined) {
      query.isActive = req.query.isActive === 'true';
    } else {
      query.isActive = true; // Default to active categories only
    }
    
    const categories = await Category.find(query);
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Failed to fetch categories', error: error.message });
  }
});

// Get single category by ID
router.get('/:id', [
  query('includeThreadCount').optional().isBoolean().withMessage('includeThreadCount must be a boolean')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    // If includeThreadCount is true, count threads in this category
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
});

// Get threads by category
router.get('/:id/threads', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('sortBy').optional().isIn(['recent', 'popular', 'views']).withMessage('Invalid sort option')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const sortBy = req.query.sortBy || 'recent';
    
    // Verify category exists
    const categoryExists = await Category.exists({ _id: req.params.id });
    if (!categoryExists) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    // Build sort options
    let sortOptions = {};
    switch (sortBy) {
      case 'popular':
        sortOptions = { voteCount: -1, createdAt: -1 };
        break;
      case 'views':
        sortOptions = { views: -1, createdAt: -1 };
        break;
      default: // 'recent'
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
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching threads by category:', error);
    res.status(500).json({ message: 'Failed to fetch threads by category', error: error.message });
  }
});


router.post('/', requireAuth, requireAdmin, [
  body('name')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Name must be 1-50 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description must be less than 200 characters'),
  body('color')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Color must be a valid hex color')
], async (req, res) => {
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
});

// Update category
router.put('/:id', requireAuth, requireAdmin, [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Name must be 1-50 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description must be less than 200 characters'),
  body('color')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Color must be a valid hex color'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, color, isActive } = req.body;

    // Check if category exists
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Check if name is being changed and if it already exists
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: req.params.id }
      });
      
      if (existingCategory) {
        return res.status(400).json({ message: 'Category name already exists' });
      }
    }

    // Update fields if provided
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
});

// Delete category
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    // Check if category exists
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Check if category has threads
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
});

module.exports = router;
