const express = require('express');
const Groq = require('groq-sdk');
const Expense = require('../models/Expense');

const router = express.Router();

if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your_groq_api_key_here') {
  console.warn('⚠️  WARNING: GROQ_API_KEY is not set in .env! AI features will not work.');
  console.warn('   Get a free key at: https://console.groq.com');
}

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MODEL_CHAIN = [
  'llama-3.1-8b-instant',
  'llama3-8b-8192',
  'mixtral-8x7b-32768',
];

const withModelFallback = async (fn) => {
  let lastError;
  for (const modelName of MODEL_CHAIN) {
    try {
      return await fn(modelName);
    } catch (err) {
      const status = err?.status ?? err?.statusCode;
      if (status === 404 || status === 429) {
        console.warn(`⚠️  Model "${modelName}" unavailable (${status}), trying next...`);
        lastError = err;
        continue;
      }
      throw err;
    }
  }
  throw lastError;
};

// ─── POST /api/ai/analyze ─────────────────────────────────────
router.post('/analyze', async (req, res) => {
  try {
    if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your_groq_api_key_here') {
      return res.status(400).json({
        message: 'Groq API key not configured. Add GROQ_API_KEY to your .env file. Get a free key at https://console.groq.com'
      });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const expenses = await Expense.find({ user: req.user._id, date: { $gte: startOfMonth } }).sort({ date: -1 });
    const allExpenses = expenses.length > 0 ? expenses :
      await Expense.find({ user: req.user._id }).sort({ date: -1 }).limit(30);

    if (allExpenses.length === 0) {
      return res.json({
        analysis: 'No expenses found yet. Add some expenses first to get AI-powered insights!',
        tips: [
          'Start by adding your daily expenses to track your spending patterns.',
          'Set a monthly budget in your profile to get budget health scores.',
          'Try the AI auto-categorize feature when adding expenses!',
        ],
        budgetScore: null,
        budgetScoreReason: 'Add expenses to get a budget health score.',
        smartInsight: 'Tip: Use the AI button when adding expenses for automatic categorization!',
      });
    }

    const totalSpent = allExpenses.reduce((sum, e) => sum + e.amount, 0);
    const byCategory = allExpenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {});
    const userBudget = req.user.monthlyBudget || 0;
    const expenseSummary = allExpenses.slice(0, 20).map(e =>
      `${e.title}: $${e.amount} (${e.category}) on ${new Date(e.date).toLocaleDateString()}`
    ).join('\n');

    const prompt = `You are a personal finance AI assistant. Analyze this user's expense data.

USER DATA:
- Monthly Budget: $${userBudget}
- Total Spent: $${totalSpent.toFixed(2)}
- Budget Remaining: $${(userBudget - totalSpent).toFixed(2)}

SPENDING BY CATEGORY:
${Object.entries(byCategory).map(([k, v]) => `- ${k}: $${v.toFixed(2)}`).join('\n')}

RECENT EXPENSES:
${expenseSummary}

Respond ONLY with a valid JSON object (no markdown, no code blocks, no extra text):
{
  "analysis": "2-3 sentence spending analysis",
  "tips": ["tip 1", "tip 2", "tip 3"],
  "budgetScore": 7,
  "budgetScoreReason": "reason for the score",
  "smartInsight": "one surprising insight from the data"
}`;

    const text = await withModelFallback(async (modelName) => {
      const response = await groq.chat.completions.create({
        model: modelName,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000,
        temperature: 0.7,
      });
      return response.choices[0]?.message?.content?.trim() || '';
    });

    let aiData;
    try {
      const cleaned = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
      aiData = JSON.parse(cleaned);
    } catch {
      aiData = {
        analysis: text.length > 500 ? text.substring(0, 500) : text,
        tips: ['Review your top spending categories', 'Compare this month to last month', 'Look for recurring charges you can cut'],
        budgetScore: null,
        budgetScoreReason: 'Could not parse score from AI response.',
        smartInsight: 'Try running the analysis again for structured insights.',
      };
    }

    res.json(aiData);
  } catch (error) {
    console.error('AI analyze error:', error.message);
    let userMessage = 'AI analysis failed';
    if (error.status === 401) userMessage = 'Invalid Groq API key. Please check your GROQ_API_KEY in .env';
    else if (error.status === 429) userMessage = 'Groq rate limit hit. Please wait a moment and try again.';
    res.status(500).json({ message: userMessage, error: error.message });
  }
});

// ─── POST /api/ai/categorize ──────────────────────────────────
router.post('/categorize', async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required' });

    const categories = [
      'Food & Dining', 'Transportation', 'Shopping', 'Entertainment',
      'Health & Medical', 'Housing & Utilities', 'Education', 'Travel',
      'Personal Care', 'Other',
    ];

    const prompt = `Categorize this expense into exactly one of these categories: ${categories.join(', ')}.
Expense: "${title}"
Respond with ONLY the category name, nothing else.`;

    const category = await withModelFallback(async (modelName) => {
      const response = await groq.chat.completions.create({
        model: modelName,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 20,
        temperature: 0.1,
      });
      return response.choices[0]?.message?.content?.trim().replace(/[."']/g, '') || 'Other';
    });

    const matched = categories.find(c => c.toLowerCase() === category.toLowerCase()) || 'Other';
    res.json({ category: matched });
  } catch (error) {
    console.error('Categorize error:', error.message);
    res.status(500).json({ message: 'Categorization failed', error: error.message });
  }
});

// ─── POST /api/ai/chat ────────────────────────────────────────
router.post('/chat', async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    const expenses = await Expense.find({ user: req.user._id }).sort({ date: -1 }).limit(50);
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
    const byCategory = expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {});

    const systemMessage = `You are a helpful personal finance assistant for ${req.user.name}.
Their financial data: total recent spending $${totalSpent.toFixed(2)}, 
categories: ${Object.entries(byCategory).map(([k, v]) => `${k}: $${v.toFixed(2)}`).join(', ')}, 
monthly budget: $${req.user.monthlyBudget || 'not set'}.
Be concise, specific, and helpful. Reference their actual data when relevant.`;

    const messages = [
      { role: 'system', content: systemMessage },
      ...history.slice(-10).map(h => ({
        role: h.role === 'model' ? 'assistant' : 'user',
        content: h.content,
      })),
      { role: 'user', content: message },
    ];

    const reply = await withModelFallback(async (modelName) => {
      const response = await groq.chat.completions.create({
        model: modelName,
        messages,
        max_tokens: 500,
        temperature: 0.7,
      });
      return response.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
    });

    res.json({ reply });
  } catch (error) {
    console.error('Chat error:', error.message);
    res.status(500).json({ message: 'Chat failed', error: error.message });
  }
});

module.exports = router;