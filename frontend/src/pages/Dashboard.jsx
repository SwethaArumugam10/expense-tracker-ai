import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, ResponsiveContainer, CartesianGrid } from 'recharts';
import { getAnalytics } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const CATEGORY_COLORS = {
  'Food & Dining': '#6c63ff',
  'Transportation': '#4a9eff',
  'Shopping': '#ff6b9d',
  'Entertainment': '#ffb142',
  'Health & Medical': '#00d68f',
  'Housing & Utilities': '#ff4757',
  'Education': '#a29bfe',
  'Travel': '#fd79a8',
  'Personal Care': '#55efc4',
  'Other': '#636e72',
};

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 14px' }}>
      <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>${payload[0].value?.toFixed(2)}</p>
    </div>
  );
};

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnalytics()
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen" style={{ background: 'none' }}><div className="spinner" /></div>;

  const total = data?.monthlyTotal?.total || 0;
  const budget = user?.monthlyBudget || 0;
  const budgetPct = budget > 0 ? Math.min((total / budget) * 100, 100) : 0;
  const remaining = budget - total;
  const currency = user?.currency || 'USD';

  const trendData = (data?.trend || []).map((t) => ({
    name: `${MONTH_NAMES[t._id.month - 1]} ${t._id.year}`,
    amount: t.total,
  }));

  const pieData = (data?.byCategory || []).map((c) => ({
    name: c._id,
    value: c.total,
    color: CATEGORY_COLORS[c._id] || '#636e72',
  }));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">Welcome back, {user?.name} 👋</p>
        </div>
        <span style={{ fontSize: 13, color: 'var(--text3)' }}>
          {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </span>
      </div>

      {/* Stats */}
      <div className="stat-grid">
        <div className="stat-card">
          <p className="stat-label">Spent This Month</p>
          <p className="stat-value stat-red">${total.toFixed(2)}</p>
          <p className="stat-sub">{data?.monthlyTotal?.count || 0} transactions</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Monthly Budget</p>
          <p className="stat-value stat-blue">${budget.toFixed(2)}</p>
          <p className="stat-sub">{currency}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Remaining</p>
          <p className={`stat-value ${remaining >= 0 ? 'stat-green' : 'stat-red'}`}>
            {remaining >= 0 ? '+' : ''}${remaining.toFixed(2)}
          </p>
          <p className="stat-sub">{remaining >= 0 ? 'Under budget' : 'Over budget!'}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Budget Used</p>
          <p className={`stat-value ${budgetPct > 80 ? 'stat-red' : budgetPct > 60 ? 'stat-amber' : 'stat-green'}`}>
            {budgetPct.toFixed(0)}%
          </p>
          <div style={{ marginTop: 8, height: 4, background: 'var(--bg4)', borderRadius: 2 }}>
            <div style={{
              height: '100%',
              borderRadius: 2,
              width: `${budgetPct}%`,
              background: budgetPct > 80 ? 'var(--red)' : budgetPct > 60 ? 'var(--amber)' : 'var(--green)',
              transition: 'width 0.5s ease',
            }} />
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>6-Month Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={trendData} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: 'var(--text3)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text3)', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(108,99,255,0.08)' }} />
              <Bar dataKey="amount" fill="var(--accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>By Category</h3>
          {pieData.length > 0 ? (
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {pieData.slice(0, 5).map((cat) => (
                  <div key={cat.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="cat-dot" style={{ background: cat.color }} />
                    <span style={{ fontSize: 12, color: 'var(--text2)', flex: 1 }}>{cat.name}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, fontFamily: 'DM Mono, monospace' }}>${cat.value.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--text3)', textAlign: 'center', paddingTop: 60 }}>No data yet</p>
          )}
        </div>
      </div>

      {/* Top Expenses */}
      {data?.topExpenses?.length > 0 && (
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Top Expenses This Month</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Expense</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.topExpenses.map((exp) => (
                  <tr key={exp._id}>
                    <td style={{ fontWeight: 500 }}>{exp.title}</td>
                    <td>
                      <span className="badge badge-purple">{exp.category}</span>
                    </td>
                    <td style={{ color: 'var(--text3)' }}>
                      {new Date(exp.date).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, fontFamily: 'DM Mono, monospace', color: 'var(--red)' }}>
                      ${exp.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
