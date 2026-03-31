const express = require('express');
const { body, validationResult } = require('express-validator');
const Expense = require('../models/Expense');

const router = express.Router();

// ─── GET /api/expenses ────────────────────────────────────────
// Query params: page, limit, category, startDate, endDate, search
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, category, startDate, endDate, search } = req.query;

    const filter = { user: req.user._id };
    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    if (search) filter.title = { $regex: search, $options: 'i' };

    const total = await Expense.countDocuments(filter);
    const expenses = await Expense.find(filter)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      expenses,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ─── POST /api/expenses ───────────────────────────────────────
router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be positive'),
    body('category').notEmpty().withMessage('Category is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const expense = await Expense.create({ ...req.body, user: req.user._id });
      res.status(201).json(expense);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

// ─── PUT /api/expenses/:id ────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, user: req.user._id });
    if (!expense) return res.status(404).json({ message: 'Expense not found' });

    Object.assign(expense, req.body);
    const updated = await expense.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ─── DELETE /api/expenses/:id ─────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ─── GET /api/expenses/analytics/summary ─────────────────────
router.get('/analytics/summary', async (req, res) => {
  try {
    const { month, year } = req.query;
    const now = new Date();
    const targetMonth = month ? Number(month) - 1 : now.getMonth();
    const targetYear = year ? Number(year) : now.getFullYear();

    const startOfMonth = new Date(targetYear, targetMonth, 1);
    const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

    // Total this month
    const monthlyTotal = await Expense.aggregate([
      { $match: { user: req.user._id, date: { $gte: startOfMonth, $lte: endOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]);

    // By category
    const byCategory = await Expense.aggregate([
      { $match: { user: req.user._id, date: { $gte: startOfMonth, $lte: endOfMonth } } },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]);

    // Last 6 months trend
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const trend = await Expense.aggregate([
      { $match: { user: req.user._id, date: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { month: { $month: '$date' }, year: { $year: '$date' } },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Top expenses this month
    const topExpenses = await Expense.find({
      user: req.user._id,
      date: { $gte: startOfMonth, $lte: endOfMonth },
    })
      .sort({ amount: -1 })
      .limit(5);

    res.json({
      monthlyTotal: monthlyTotal[0] || { total: 0, count: 0 },
      byCategory,
      trend,
      topExpenses,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
