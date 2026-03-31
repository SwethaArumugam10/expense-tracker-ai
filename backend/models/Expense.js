const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    category: {
      type: String,
      required: true,
      enum: [
        'Food & Dining',
        'Transportation',
        'Shopping',
        'Entertainment',
        'Health & Medical',
        'Housing & Utilities',
        'Education',
        'Travel',
        'Personal Care',
        'Other',
      ],
    },
    date: { type: Date, default: Date.now },
    note: { type: String, trim: true, default: '' },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'Other'],
      default: 'Cash',
    },
    isRecurring: { type: Boolean, default: false },
    // AI-generated tag for smart insights
    aiTag: { type: String, default: '' },
  },
  { timestamps: true }
);

// Index for fast queries
expenseSchema.index({ user: 1, date: -1 });
expenseSchema.index({ user: 1, category: 1 });

module.exports = mongoose.model('Expense', expenseSchema);
