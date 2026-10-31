import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const DONUT_COLORS = [
  '#3b82f6', // Blue (Stage & Sound)
  '#10b981', // Green (Refreshments & Catering)
  '#f59e0b', // Amber/Orange (Transportation & Logistics)
  '#8b5cf6', // Purple (Costumes & Props)
  '#ec4899', // Pink (Design & Marketing)
  '#6366f1', // Indigo (Contingency / Emergency)
];

export default function Budget() {
  const { eventId } = useParams();
  const { hasRole } = useAuth();
  const [budget, setBudget] = useState(null);
  const [categories, setCategories] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [expenses, setExpenses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [budgetForm, setBudgetForm] = useState({ total_budget: '', categories: [{ category: '', allocated_amount: '' }] });
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    category_id: '',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    note: ''
  });

  const load = () => {
    api.get(`/budget/event/${eventId}`).then(r => {
      setBudget(r.data.budget);
      setCategories(r.data.categories || []);
      setWarnings(r.data.warnings || []);
      setTotalSpent(r.data.total_spent || 0);
      setRemaining(r.data.remaining || 0);
    });
    api.get(`/budget/expenses/${eventId}`).then(r => setExpenses(r.data));
  };
  useEffect(() => { load(); }, [eventId]);

  const handleSetBudget = async (e) => {
    e.preventDefault();
    await api.post('/budget', {
      event_id: parseInt(eventId),
      total_budget: parseFloat(budgetForm.total_budget),
      categories: budgetForm.categories.filter(c => c.category).map(c => ({ ...c, allocated_amount: parseFloat(c.allocated_amount) }))
    });
    load();
  };

  const handleExpense = async (e) => {
    e.preventDefault();
    // Combine title and note so both are persisted in description
    const fullDescription = expenseForm.note
      ? `${expenseForm.title}\n${expenseForm.note}`
      : expenseForm.title;

    const res = await api.post('/budget/expense', {
      budget_id: budget.id,
      category_id: expenseForm.category_id ? parseInt(expenseForm.category_id) : null,
      amount: parseFloat(expenseForm.amount),
      description: fullDescription,
      expense_date: expenseForm.expense_date
    });
    if (res.data.warning) alert('⚠ ' + res.data.warning);
    setExpenseForm({
      title: '',
      category_id: '',
      amount: '',
      expense_date: new Date().toISOString().split('T')[0],
      note: ''
    });
    setShowModal(false);
    load();
  };

  const addCatRow = () => setBudgetForm({ ...budgetForm, categories: [...budgetForm.categories, { category: '', allocated_amount: '' }] });

  const totalBudget = budget ? parseFloat(budget.total_budget) : 0;
  const spentPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  // Donut chart calculations
  const totalForDonut = categories.reduce((s, c) => s + parseFloat(c.spent || 0), 0) || 1;

  const buildDonutPaths = () => {
    let cumAngle = -Math.PI / 2; // start from top (12 o'clock)
    return categories.map((c, i) => {
      const pct = parseFloat(c.spent || 0) / totalForDonut;
      if (pct === 0) return null;
      const startAngle = cumAngle;
      cumAngle += pct * 2 * Math.PI;
      const endAngle = cumAngle;
      const outerR = 90;
      const innerR = 60;
      const x1o = 100 + outerR * Math.cos(startAngle);
      const y1o = 100 + outerR * Math.sin(startAngle);
      const x2o = 100 + outerR * Math.cos(endAngle);
      const y2o = 100 + outerR * Math.sin(endAngle);
      const x1i = 100 + innerR * Math.cos(endAngle);
      const y1i = 100 + innerR * Math.sin(endAngle);
      const x2i = 100 + innerR * Math.cos(startAngle);
      const y2i = 100 + innerR * Math.sin(startAngle);
      const large = pct > 0.5 ? 1 : 0;
      const d = `M${x1o},${y1o} A${outerR},${outerR} 0 ${large},1 ${x2o},${y2o} L${x1i},${y1i} A${innerR},${innerR} 0 ${large},0 ${x2i},${y2i} Z`;
      return <path key={c.id || i} d={d} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />;
    });
  };

  return (
    <div className="budget-page">
      {budget ? (
        <>
          {/* Page Header */}
          <div className="budget-page-header">
            <div className="budget-page-header-left">
              <h2 className="budget-page-title">
                <span className="budget-header-icon-circle">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </span>
                Event Budget &amp; Expenses
              </h2>
              <p className="budget-page-subtitle">Interactive category donut chart, allocation tracking, and deficit warnings</p>
            </div>
            <button className="budget-btn-record" onClick={() => setShowModal(true)}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Record Expense
            </button>
          </div>

          {/* Summary Cards */}
          <div className="budget-summary-cards">
            {/* Total Budget Card */}
            <div className="budget-summary-card">
              <div className="budget-summary-card-top">
                <span className="budget-summary-label">TOTAL BUDGET</span>
                <span className="budget-summary-icon icon-wallet">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                </span>
              </div>
              <span className="budget-summary-value">${totalBudget.toLocaleString()}</span>
              <span className="budget-summary-sub">Approved University Funding</span>
            </div>

            {/* Total Spent Card */}
            <div className="budget-summary-card">
              <div className="budget-summary-card-top">
                <span className="budget-summary-label">TOTAL SPENT</span>
                <span className="budget-summary-icon icon-spent">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                    <polyline points="17 6 23 6 23 12" />
                  </svg>
                </span>
              </div>
              <span className="budget-summary-value">${totalSpent.toLocaleString()}</span>
              <span className="budget-summary-sub">{spentPct}% of allocated capital</span>
            </div>

            {/* Remaining Balance Card */}
            <div className="budget-summary-card">
              <div className="budget-summary-card-top">
                <span className="budget-summary-label">REMAINING BALANCE</span>
                <span className="budget-summary-icon icon-remaining">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </span>
              </div>
              <span className="budget-summary-value budget-remaining-value">
                ${remaining.toLocaleString()}
              </span>
              <span className="budget-summary-sub">Available for remaining tasks</span>
            </div>
          </div>

          {/* Warnings Box */}
          {warnings.length > 0 && (
            <div className="budget-warning-box">
              {warnings.map((w, i) => <p key={i}>⚠ {w}</p>)}
            </div>
          )}

          {/* Category Donut Chart Section */}
          <div className="budget-card">
            <h3 className="budget-section-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              Category Expenditure Donut Chart (FR-7.3)
            </h3>
            <div className="budget-donut-section">
              <div className="budget-donut-chart-wrap">
                <svg viewBox="0 0 200 200" width="200" height="200">
                  {buildDonutPaths()}
                  <circle cx="100" cy="100" r="54" fill="white" />
                  <text x="100" y="86" textAnchor="middle" fill="#888888" fontSize="11" fontWeight="500">Total Spent</text>
                  <text x="100" y="108" textAnchor="middle" fill="#1a1a2e" fontSize="20" fontWeight="700">${totalSpent.toLocaleString()}</text>
                  <text x="100" y="125" textAnchor="middle" fill="#3b82f6" fontSize="11" fontWeight="500">{categories.length} Categories</text>
                </svg>
              </div>
              <div className="budget-donut-legend">
                {categories.map((c, i) => {
                  const allocated = parseFloat(c.allocated_amount);
                  const spent = parseFloat(c.spent || 0);
                  const pctOfTotal = totalBudget > 0 ? Math.round((allocated / totalBudget) * 100) : 0;
                  return (
                    <div className="budget-legend-row" key={c.id || i}>
                      <div className="budget-legend-left">
                        <span className="budget-legend-dot" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }}></span>
                        <span className="budget-legend-name">{c.category}</span>
                      </div>
                      <div className="budget-legend-right">
                        <span className="budget-legend-spent">${spent.toLocaleString()}</span>
                        <span className="budget-legend-cap">Cap: ${allocated.toLocaleString()} ({pctOfTotal}% of total)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recorded Receipts & Expenses Section */}
          <div className="budget-card">
            <h3 className="budget-section-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              Recorded Receipts &amp; Expenses ({expenses.length})
            </h3>
            <table className="budget-expenses-table">
              <thead>
                <tr>
                  <th>Title &amp; Description</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Recorded By</th>
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: '#888888', padding: '36px' }}>
                      No expenses recorded yet.
                    </td>
                  </tr>
                ) : (
                  expenses.map(ex => {
                    const descParts = (ex.description || '').split('\n');
                    const titleText = descParts[0] || 'Expense';
                    const noteText = descParts.slice(1).join('\n');

                    return (
                      <tr key={ex.id}>
                        <td>
                          <div className="budget-expense-title">{titleText}</div>
                          {noteText && <div className="budget-expense-desc">{noteText}</div>}
                        </td>
                        <td>
                          <span className="budget-category-tag">
                            {ex.category_name || 'General'}
                          </span>
                        </td>
                        <td className="budget-expense-amount">${parseFloat(ex.amount).toLocaleString()}</td>
                        <td className="budget-expense-date">
                          {ex.expense_date ? new Date(ex.expense_date).toISOString().split('T')[0] : '-'}
                        </td>
                        <td className="budget-expense-by">{ex.recorded_by_name || '-'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Record Official Event Expense Modal */}
          {showModal && (
            <div className="budget-modal-backdrop" onClick={() => setShowModal(false)}>
              <div className="budget-modal" onClick={e => e.stopPropagation()}>
                <div className="budget-modal-header">
                  <div className="budget-modal-icon-wrap">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="1" x2="12" y2="23" />
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                  </div>
                  <h3 className="budget-modal-title">Record Official Event Expense</h3>
                </div>
                <form className="budget-modal-form" onSubmit={handleExpense}>
                  <div className="budget-form-group">
                    <label>Expense Title / Item</label>
                    <input
                      placeholder="e.g. Wireless Microphones & PA Line Array Deposit"
                      value={expenseForm.title}
                      onChange={e => setExpenseForm({ ...expenseForm, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="budget-form-row-2">
                    <div className="budget-form-group">
                      <label>Category</label>
                      <select
                        value={expenseForm.category_id}
                        onChange={e => setExpenseForm({ ...expenseForm, category_id: e.target.value })}
                        required
                      >
                        <option value="">Select Category</option>
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.category}</option>
                        ))}
                      </select>
                    </div>
                    <div className="budget-form-group">
                      <label>Amount ($ USD)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="3500.00"
                        value={expenseForm.amount}
                        onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="budget-form-group">
                    <label>Date of Expense</label>
                    <input
                      type="date"
                      value={expenseForm.expense_date}
                      onChange={e => setExpenseForm({ ...expenseForm, expense_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="budget-form-group">
                    <label>Receipt / Invoice Note</label>
                    <textarea
                      placeholder="Invoice number, payment method, vendor name..."
                      value={expenseForm.note}
                      onChange={e => setExpenseForm({ ...expenseForm, note: e.target.value })}
                    />
                  </div>
                  <div className="budget-modal-actions">
                    <button type="button" className="budget-btn-cancel" onClick={() => setShowModal(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="budget-btn-submit">
                      Add Expense
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      ) : (
        hasRole('Admin') ? (
          <div className="budget-card" style={{ maxWidth: 580, margin: '40px auto' }}>
            <form onSubmit={handleSetBudget} className="budget-modal-form">
              <h3 className="budget-section-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                Set Event Budget
              </h3>
              <div className="budget-form-group">
                <label>Total Budget ($ USD)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 45000"
                  value={budgetForm.total_budget}
                  onChange={e => setBudgetForm({ ...budgetForm, total_budget: e.target.value })}
                  required
                />
              </div>
              <h4 style={{ color: '#1a1a2e', fontSize: 14.5, fontWeight: 600, marginTop: 8 }}>Categories</h4>
              {budgetForm.categories.map((c, i) => (
                <div className="budget-form-row-2" key={i}>
                  <div className="budget-form-group">
                    <label>Category name</label>
                    <input
                      placeholder="e.g. Stage & Sound"
                      value={c.category}
                      onChange={e => {
                        const cats = [...budgetForm.categories];
                        cats[i].category = e.target.value;
                        setBudgetForm({ ...budgetForm, categories: cats });
                      }}
                      required
                    />
                  </div>
                  <div className="budget-form-group">
                    <label>Allocated Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 14000"
                      value={c.allocated_amount}
                      onChange={e => {
                        const cats = [...budgetForm.categories];
                        cats[i].allocated_amount = e.target.value;
                        setBudgetForm({ ...budgetForm, categories: cats });
                      }}
                      required
                    />
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                <button type="button" className="budget-btn-cancel" onClick={addCatRow}>
                  + Add Category
                </button>
                <button type="submit" className="budget-btn-submit">
                  Save Budget
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="budget-card" style={{ textAlign: 'center', padding: 60, maxWidth: 500, margin: '60px auto' }}>
            <p style={{ color: '#888888', fontSize: 15 }}>No budget has been set for this event yet.</p>
          </div>
        )
      )}
    </div>
  );
}
