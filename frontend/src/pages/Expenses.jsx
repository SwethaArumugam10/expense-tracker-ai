import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { getExpenses, createExpense, updateExpense, deleteExpense, categorizeExpense } from '../utils/api';

const CATEGORIES = [
  'Food & Dining','Transportation','Shopping','Entertainment',
  'Health & Medical','Housing & Utilities','Education','Travel','Personal Care','Other',
];
const PAYMENT_METHODS = ['Cash','Credit Card','Debit Card','UPI','Net Banking','Other'];

const CATEGORY_COLORS = {
  'Food & Dining':'badge-purple','Transportation':'badge-blue','Shopping':'badge-amber',
  'Entertainment':'badge-green','Health & Medical':'badge-green','Housing & Utilities':'badge-red',
  'Education':'badge-blue','Travel':'badge-purple','Personal Care':'badge-amber','Other':'badge-blue',
};

const EMPTY_FORM = { title: '', amount: '', category: '', date: new Date().toISOString().split('T')[0], note: '', paymentMethod: 'Cash', isRecurring: false };

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [aiCategorizing, setAiCategorizing] = useState(false);
  const [filters, setFilters] = useState({ search: '', category: '', page: 1 });
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getExpenses({ ...filters, limit: 20 });
      setExpenses(res.data.expenses);
      setTotal(res.data.total);
    } catch {
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const openAdd = () => { setEditItem(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (exp) => {
    setEditItem(exp);
    setForm({ ...exp, date: new Date(exp.date).toISOString().split('T')[0] });
    setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setEditItem(null); setForm(EMPTY_FORM); };

  const handleAiCategorize = async () => {
    if (!form.title.trim()) return toast.error('Enter a title first');
    setAiCategorizing(true);
    try {
      const res = await categorizeExpense(form.title);
      setForm(f => ({ ...f, category: res.data.category }));
      toast.success(`AI detected: ${res.data.category}`);
    } catch {
      toast.error('AI categorization failed');
    } finally {
      setAiCategorizing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.amount || !form.category) return toast.error('Fill required fields');
    setSubmitting(true);
    try {
      if (editItem) {
        await updateExpense(editItem._id, form);
        toast.success('Expense updated');
      } else {
        await createExpense(form);
        toast.success('Expense added');
      }
      closeModal();
      fetchExpenses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteExpense(id);
      toast.success('Expense deleted');
      setDeleteConfirm(null);
      fetchExpenses();
    } catch {
      toast.error('Delete failed');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Expenses</h1>
          <p className="page-sub">{total} total transactions</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Expense</button>
      </div>

      {/* Filters */}
      <div className="card card-sm" style={{ marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <input
          className="form-input" style={{ flex: 1, minWidth: 200 }}
          placeholder="Search expenses..."
          value={filters.search}
          onChange={e => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))}
        />
        <select
          className="form-select" style={{ width: 200 }}
          value={filters.category}
          onChange={e => setFilters(f => ({ ...f, category: e.target.value, page: 1 }))}
        >
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {filters.search || filters.category ? (
          <button className="btn btn-ghost btn-sm" onClick={() => setFilters({ search: '', category: '', page: 1 })}>Clear</button>
        ) : null}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          {loading ? (
            <div style={{ textAlign: 'center', padding: 48 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
          ) : expenses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48, color: 'var(--text3)' }}>
              <p style={{ fontSize: 32, marginBottom: 8 }}>📭</p>
              <p>No expenses found. Add your first one!</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Payment</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp) => (
                  <tr key={exp._id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{exp.title}</div>
                      {exp.note && <div style={{ fontSize: 12, color: 'var(--text3)' }}>{exp.note}</div>}
                    </td>
                    <td><span className={`badge ${CATEGORY_COLORS[exp.category] || 'badge-blue'}`}>{exp.category}</span></td>
                    <td style={{ color: 'var(--text2)', fontSize: 13 }}>{exp.paymentMethod}</td>
                    <td style={{ color: 'var(--text3)', fontSize: 13 }}>{new Date(exp.date).toLocaleDateString()}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, fontFamily: 'DM Mono, monospace', color: 'var(--red)' }}>
                      ${Number(exp.amount).toFixed(2)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(exp)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(exp._id)}>Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">{editItem ? 'Edit Expense' : 'Add Expense'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Starbucks coffee" required />
                  <button type="button" className="btn btn-ghost btn-sm" onClick={handleAiCategorize} disabled={aiCategorizing} title="AI auto-detect category" style={{ whiteSpace: 'nowrap' }}>
                    {aiCategorizing ? '...' : '🤖 AI'}
                  </button>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Amount ($) *</label>
                  <input className="form-input" type="number" step="0.01" min="0" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input className="form-input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select className="form-select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} required>
                  <option value="">Select category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Payment Method</label>
                <select className="form-select" value={form.paymentMethod} onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))}>
                  {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Note (optional)</label>
                <input className="form-input" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="Add a note..." />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 360, textAlign: 'center' }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>⚠️</p>
            <h3 style={{ marginBottom: 8 }}>Delete expense?</h3>
            <p style={{ color: 'var(--text2)', marginBottom: 24, fontSize: 14 }}>This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
