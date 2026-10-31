import React, { useState } from 'react';
import { PieChart, DollarSign, AlertTriangle, Plus, TrendingUp, Wallet, CheckCircle, Receipt, Trash2 } from 'lucide-react';
import { api } from '../services/api';

export default function BudgetView({ budgetData = {}, onRefresh, currentUser }) {
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [activeCategoryHover, setActiveCategoryHover] = useState(null);

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Stage & Sound');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [receiptNote, setReceiptNote] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    totalBudget = 45000,
    totalSpent = 0,
    remainingBudget = 45000,
    isOverBudget = false,
    categories = [],
    expenses = []
  } = budgetData;

  const colorPalette = [
    '#3B82F6', // Royal Blue (Accent)
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#6366F1', // Indigo
    '#14B8A6'  // Teal
  ];

  const handleAddExpense = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.addExpense({
        title,
        category,
        amount: Number(amount),
        expenseDate,
        recordedByName: currentUser?.full_name || 'Committee Member',
        receiptNote
      });
      setShowExpenseModal(false);
      setTitle('');
      setAmount('');
      setReceiptNote('');
      onRefresh();
    } catch (err) {
      alert('Failed to record expense');
    } finally {
      setLoading(false);
    }
  };

  // SVG Donut Chart Calculations (FR-7.3)
  const radius = 90;
  const strokeWidth = 32;
  const center = 120;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercent = 0;
  const slices = categories.map((cat, idx) => {
    const percent = totalSpent > 0 ? cat.spent / totalSpent : 0;
    const strokeDasharray = `${percent * circumference} ${circumference}`;
    const strokeDashoffset = -cumulativePercent * circumference;
    cumulativePercent += percent;
    const color = colorPalette[idx % colorPalette.length];

    return {
      ...cat,
      color,
      strokeDasharray,
      strokeDashoffset,
      percent: Math.round(percent * 100)
    };
  });

  const overBudgetCategories = categories.filter(c => c.isOverBudget);
  const isOrganizer = currentUser?.role === 'admin' || currentUser?.role === 'coordinator';

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-black)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <PieChart size={24} color="var(--accent-blue)" /> Event Budget & Expenses
          </h1>
          <p style={{ color: 'var(--secondary-gray)', fontSize: '0.875rem' }}>
            Interactive category donut chart, allocation tracking, and deficit warnings (FR-7.1 – FR-7.4)
          </p>
        </div>

        {isOrganizer && (
          <button onClick={() => setShowExpenseModal(true)} className="btn-primary">
            <Plus size={16} /> Record Expense
          </button>
        )}
      </div>

      {/* Over-budget Deficit Warning Callout (FR-7.4) */}
      {overBudgetCategories.length > 0 && (
        <div className="alert-warning" style={{ marginBottom: '1.5rem' }}>
          <AlertTriangle size={20} style={{ flexShrink: 0 }} />
          <div>
            <strong>Budget Allocation Warning (FR-7.4):</strong>
            <div style={{ fontSize: '0.825rem', marginTop: '0.2rem' }}>
              The following categories have exceeded their allocated limit:
              {' '}{overBudgetCategories.map(c => `"${c.category}" (Spent: $${c.spent.toLocaleString()} / Cap: $${c.allocated.toLocaleString()})`).join(', ')}.
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--secondary-gray)', textTransform: 'uppercase' }}>Total Budget</span>
            <Wallet size={16} color="var(--accent-blue)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary-black)' }}>
            ${totalBudget.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--secondary-gray)', marginTop: '0.2rem' }}>
            Approved University Funding
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--secondary-gray)', textTransform: 'uppercase' }}>Total Spent</span>
            <TrendingUp size={16} color="#F59E0B" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#111827' }}>
            ${totalSpent.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--secondary-gray)', marginTop: '0.2rem' }}>
            {totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0}% of allocated capital
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--secondary-gray)', textTransform: 'uppercase' }}>Remaining Balance</span>
            <DollarSign size={16} color={remainingBudget < 0 ? '#EF4444' : '#10B981'} />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: remainingBudget < 0 ? '#EF4444' : '#10B981' }}>
            ${remainingBudget.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: remainingBudget < 0 ? '#EF4444' : 'var(--secondary-gray)', marginTop: '0.2rem' }}>
            {remainingBudget < 0 ? 'Deficit - Over budget!' : 'Available for remaining tasks'}
          </div>
        </div>
      </div>

      {/* Donut Chart & Category Breakdown Card (FR-7.3) */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.75rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <PieChart size={18} color="var(--accent-blue)" /> Category Expenditure Donut Chart (FR-7.3)
        </h3>

        <div className="donut-chart-container">
          {/* SVG Donut */}
          <div style={{ position: 'relative', width: '240px', height: '240px', flexShrink: 0 }}>
            <svg width="240" height="240" viewBox="0 0 240 240" style={{ transform: 'rotate(-90deg)' }}>
              {/* Background circle */}
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke="var(--surface-hover)"
                strokeWidth={strokeWidth}
              />
              {/* Category Slices */}
              {slices.map((slice, i) => (
                <circle
                  key={i}
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="transparent"
                  stroke={slice.color}
                  strokeWidth={activeCategoryHover === slice.category ? strokeWidth + 6 : strokeWidth}
                  strokeDasharray={slice.strokeDasharray}
                  strokeDashoffset={slice.strokeDashoffset}
                  style={{
                    transition: 'stroke-width 0.2s ease, opacity 0.2s ease',
                    opacity: activeCategoryHover && activeCategoryHover !== slice.category ? 0.4 : 1,
                    cursor: 'pointer'
                  }}
                  onMouseEnter={() => setActiveCategoryHover(slice.category)}
                  onMouseLeave={() => setActiveCategoryHover(null)}
                />
              ))}
            </svg>

            {/* Center Label */}
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--secondary-gray)', fontWeight: 600 }}>Total Spent</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-black)' }}>
                ${totalSpent.toLocaleString()}
              </span>
              <span style={{ fontSize: '0.68rem', color: 'var(--accent-blue)', fontWeight: 700 }}>
                {categories.length} Categories
              </span>
            </div>
          </div>

          {/* Legend & Breakdown Table */}
          <div style={{ flex: 1, minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {slices.length === 0 ? (
              <div style={{ color: 'var(--secondary-gray)', fontSize: '0.85rem', padding: '2rem 1rem', textAlign: 'center' }}>
                No budget categories or expenses recorded yet.
              </div>
            ) : (
              slices.map((cat, i) => (
              <div
                key={i}
                onMouseEnter={() => setActiveCategoryHover(cat.category)}
                onMouseLeave={() => setActiveCategoryHover(null)}
                style={{
                  padding: '0.6rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  background: activeCategoryHover === cat.category ? 'var(--surface-hover)' : 'transparent',
                  border: '1px solid',
                  borderColor: cat.isOverBudget ? '#FCA5A5' : activeCategoryHover === cat.category ? 'var(--border-color)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'background 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: cat.color }} />
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--primary-black)' }}>
                      {cat.category}
                    </span>
                    {cat.isOverBudget && (
                      <span className="badge badge-orange" style={{ marginLeft: '0.4rem', fontSize: '0.65rem' }}>
                        Over Allocated
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--primary-black)' }}>
                    ${cat.spent.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--secondary-gray)' }}>
                    Cap: ${cat.allocated.toLocaleString()} ({cat.percent}% of total)
                  </div>
                </div>
              </div>
            )))}
          </div>
        </div>
      </div>

      {/* Recent Expense Transactions List (FR-7.2) */}
      <div className="card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Receipt size={18} color="var(--accent-blue)" /> Recorded Receipts & Expenses ({expenses.length})
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--secondary-gray)' }}>
                <th style={{ padding: '0.6rem 0.75rem' }}>Title & Description</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>Category</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>Amount</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>Date</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>Recorded By</th>
              </tr>
            </thead>
            <tbody>
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--secondary-gray)' }}>
                    No expenses recorded yet.
                  </td>
                </tr>
              ) : (
                expenses.map(ex => (
                  <tr key={ex.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ fontWeight: 700, color: 'var(--primary-black)' }}>{ex.title}</div>
                      {ex.receipt_note && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--secondary-gray)' }}>{ex.receipt_note}</div>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span className="badge badge-blue">{ex.category}</span>
                    </td>
                    <td style={{ padding: '0.75rem', fontWeight: 700, color: '#111827' }}>
                      ${Number(ex.amount).toLocaleString()}
                    </td>
                    <td style={{ padding: '0.75rem', color: 'var(--secondary-gray)' }}>
                      {ex.expense_date}
                    </td>
                    <td style={{ padding: '0.75rem', color: 'var(--secondary-gray)' }}>
                      {ex.recorded_by_name || 'Member'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Expense Modal (FR-7.2) */}
      {showExpenseModal && (
        <div className="modal-overlay" onClick={() => setShowExpenseModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="card-header">
              <h2 className="card-title">
                <DollarSign size={20} color="var(--accent-blue)" /> Record Official Event Expense
              </h2>
            </div>

            <form onSubmit={handleAddExpense}>
              <div className="form-group">
                <label className="form-label">Expense Title / Item</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wireless Microphones & PA Line Array Deposit"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} className="form-select">
                    <option value="Stage & Sound">Stage & Sound</option>
                    <option value="Refreshments & Catering">Refreshments & Catering</option>
                    <option value="Transportation & Logistics">Transportation & Logistics</option>
                    <option value="Costumes & Props">Costumes & Props</option>
                    <option value="Design & Marketing">Design & Marketing</option>
                    <option value="Contingency / Emergency">Contingency / Emergency</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Amount ($ USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="3500.00"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Date of Expense</label>
                <input
                  type="date"
                  required
                  value={expenseDate}
                  onChange={e => setExpenseDate(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Receipt / Invoice Note</label>
                <textarea
                  rows={2}
                  placeholder="Invoice number, payment method, vendor name..."
                  value={receiptNote}
                  onChange={e => setReceiptNote(e.target.value)}
                  className="form-textarea"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowExpenseModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? 'Recording...' : 'Add Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
