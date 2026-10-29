import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function Budget() {
  const { eventId } = useParams();
  const { hasRole } = useAuth();
  const [budget, setBudget] = useState(null);
  const [categories, setCategories] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [expenses, setExpenses] = useState([]);
  const [budgetForm, setBudgetForm] = useState({ total_budget: '', categories: [{ category: '', allocated_amount: '' }] });
  const [expenseForm, setExpenseForm] = useState({ category_id: '', amount: '', description: '', expense_date: '' });

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
    const res = await api.post('/budget/expense', {
      budget_id: budget.id,
      category_id: expenseForm.category_id ? parseInt(expenseForm.category_id) : null,
      amount: parseFloat(expenseForm.amount),
      description: expenseForm.description,
      expense_date: expenseForm.expense_date
    });
    if (res.data.warning) alert('⚠ ' + res.data.warning);
    setExpenseForm({ category_id: '', amount: '', description: '', expense_date: '' });
    load();
  };

  const addCatRow = () => setBudgetForm({ ...budgetForm, categories: [...budgetForm.categories, { category: '', allocated_amount: '' }] });

  // Donut chart data as inline SVG
  const total = categories.reduce((s, c) => s + parseFloat(c.spent || 0), 0) || 1;
  const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF'];

  return (
    <div className="page">
      <h2>Budget</h2>

      {budget ? (
        <>
          <div className="budget-summary">
            <p><strong>Total Budget:</strong> ${parseFloat(budget.total_budget).toFixed(2)}</p>
            <p><strong>Spent:</strong> ${totalSpent.toFixed(2)}</p>
            <p><strong>Remaining:</strong> ${remaining.toFixed(2)}</p>
          </div>

          {warnings.length > 0 && (
            <div className="warning">{warnings.map((w, i) => <p key={i}>⚠ {w}</p>)}</div>
          )}

          <h3>Spending by Category</h3>
          <svg viewBox="0 0 200 200" width="200" height="200">
            {(() => {
              let cumAngle = 0;
              return categories.map((c, i) => {
                const pct = parseFloat(c.spent || 0) / total;
                const startAngle = cumAngle * 2 * Math.PI;
                cumAngle += pct;
                const endAngle = cumAngle * 2 * Math.PI;
                const x1 = 100 + 80 * Math.cos(startAngle);
                const y1 = 100 + 80 * Math.sin(startAngle);
                const x2 = 100 + 80 * Math.cos(endAngle);
                const y2 = 100 + 80 * Math.sin(endAngle);
                const large = pct > 0.5 ? 1 : 0;
                return <path key={i} d={`M100,100 L${x1},${y1} A80,80 0 ${large},1 ${x2},${y2} Z`} fill={colors[i % colors.length]} />;
              });
            })()}
            <circle cx="100" cy="100" r="40" fill="white" />
          </svg>

          <table>
            <thead><tr><th>Category</th><th>Allocated</th><th>Spent</th></tr></thead>
            <tbody>
              {categories.map(c => (
                <tr key={c.id} style={parseFloat(c.spent) > parseFloat(c.allocated_amount) ? { color: 'red' } : {}}>
                  <td>{c.category}</td><td>${parseFloat(c.allocated_amount).toFixed(2)}</td><td>${parseFloat(c.spent).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3>Record Expense</h3>
          <form onSubmit={handleExpense}>
            <select value={expenseForm.category_id} onChange={e => setExpenseForm({ ...expenseForm, category_id: e.target.value })}>
              <option value="">Select Category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.category}</option>)}
            </select>
            <input type="number" step="0.01" placeholder="Amount" value={expenseForm.amount} onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })} required />
            <input placeholder="Description" value={expenseForm.description} onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })} />
            <input type="date" value={expenseForm.expense_date} onChange={e => setExpenseForm({ ...expenseForm, expense_date: e.target.value })} required />
            <button type="submit">Add Expense</button>
          </form>

          <h3>Expenses</h3>
          <table>
            <thead><tr><th>Date</th><th>Category</th><th>Amount</th><th>Description</th><th>By</th></tr></thead>
            <tbody>
              {expenses.map(ex => (
                <tr key={ex.id}>
                  <td>{new Date(ex.expense_date).toLocaleDateString()}</td><td>{ex.category_name || '-'}</td>
                  <td>${parseFloat(ex.amount).toFixed(2)}</td><td>{ex.description}</td><td>{ex.recorded_by_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        hasRole('Admin') ? (
          <form onSubmit={handleSetBudget}>
            <h3>Set Budget</h3>
            <input type="number" step="0.01" placeholder="Total Budget" value={budgetForm.total_budget} onChange={e => setBudgetForm({ ...budgetForm, total_budget: e.target.value })} required />
            <h4>Categories</h4>
            {budgetForm.categories.map((c, i) => (
              <div key={i}>
                <input placeholder="Category name" value={c.category} onChange={e => {
                  const cats = [...budgetForm.categories]; cats[i].category = e.target.value; setBudgetForm({ ...budgetForm, categories: cats });
                }} />
                <input type="number" step="0.01" placeholder="Amount" value={c.allocated_amount} onChange={e => {
                  const cats = [...budgetForm.categories]; cats[i].allocated_amount = e.target.value; setBudgetForm({ ...budgetForm, categories: cats });
                }} />
              </div>
            ))}
            <button type="button" onClick={addCatRow}>+ Category</button>
            <button type="submit">Set Budget</button>
          </form>
        ) : <p>No budget set for this event</p>
      )}
    </div>
  );
}
