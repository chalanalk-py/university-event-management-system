import { query } from '../../config/database.js';

// Set total budget (Admin)
export const setBudget = async (req, res) => {
  try {
    const { event_id, total_budget, categories } = req.body;
    if (!event_id || !total_budget) return res.status(400).json({ error: 'event_id and total_budget required' });

    // Upsert budget
    let budget = await query('SELECT id FROM budgets WHERE event_id = $1', [event_id]);
    if (budget.rows.length) {
      budget = await query('UPDATE budgets SET total_budget = $1, updated_at = NOW() WHERE event_id = $2 RETURNING *', [total_budget, event_id]);
    } else {
      budget = await query(
        'INSERT INTO budgets (event_id, total_budget, created_by) VALUES ($1, $2, $3) RETURNING *',
        [event_id, total_budget, req.user.id]
      );
    }

    // Set category allocations
    if (categories && categories.length) {
      await query('DELETE FROM budget_categories WHERE budget_id = $1', [budget.rows[0].id]);
      for (const cat of categories) {
        await query(
          'INSERT INTO budget_categories (budget_id, category, allocated_amount) VALUES ($1, $2, $3)',
          [budget.rows[0].id, cat.category, cat.allocated_amount]
        );
      }
    }

    res.json(budget.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Record expense
export const addExpense = async (req, res) => {
  try {
    const { budget_id, category_id, amount, description, expense_date } = req.body;
    if (!budget_id || !amount || !expense_date) return res.status(400).json({ error: 'budget_id, amount, expense_date required' });

    const result = await query(
      'INSERT INTO expenses (budget_id, category_id, amount, description, expense_date, recorded_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [budget_id, category_id, amount, description, expense_date, req.user.id]
    );

    // Check category over-allocation warning
    if (category_id) {
      const catAlloc = await query('SELECT allocated_amount, category FROM budget_categories WHERE id = $1', [category_id]);
      const catSpent = await query('SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE category_id = $1', [category_id]);
      if (catAlloc.rows.length && parseFloat(catSpent.rows[0].total) > parseFloat(catAlloc.rows[0].allocated_amount)) {
        return res.status(201).json({
          expense: result.rows[0],
          warning: `Category "${catAlloc.rows[0].category}" is over its allocated budget`
        });
      }
    }

    res.status(201).json({ expense: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get budget overview with donut chart data
export const getBudget = async (req, res) => {
  try {
    const budget = await query('SELECT * FROM budgets WHERE event_id = $1', [req.params.eventId]);
    if (!budget.rows.length) return res.json({ budget: null });

    const budgetId = budget.rows[0].id;

    // Get category allocations with spending
    const categories = await query(
      `SELECT bc.id, bc.category, bc.allocated_amount, 
       COALESCE(SUM(e.amount), 0) as spent 
       FROM budget_categories bc 
       LEFT JOIN expenses e ON e.category_id = bc.id 
       WHERE bc.budget_id = $1 GROUP BY bc.id`,
      [budgetId]
    );

    // Total spent
    const totalSpent = await query('SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE budget_id = $1', [budgetId]);

    // Over-budget warnings
    const warnings = categories.rows
      .filter(c => parseFloat(c.spent) > parseFloat(c.allocated_amount))
      .map(c => `${c.category} is over by ${(parseFloat(c.spent) - parseFloat(c.allocated_amount)).toFixed(2)}`);

    res.json({
      budget: budget.rows[0],
      categories: categories.rows,
      total_spent: parseFloat(totalSpent.rows[0].total),
      remaining: parseFloat(budget.rows[0].total_budget) - parseFloat(totalSpent.rows[0].total),
      warnings
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all expenses for event
export const getExpenses = async (req, res) => {
  try {
    const budget = await query('SELECT id FROM budgets WHERE event_id = $1', [req.params.eventId]);
    if (!budget.rows.length) return res.json([]);

    const result = await query(
      `SELECT e.*, bc.category as category_name, u.username as recorded_by_name 
       FROM expenses e 
       LEFT JOIN budget_categories bc ON e.category_id = bc.id 
       LEFT JOIN users u ON e.recorded_by = u.id 
       WHERE e.budget_id = $1 ORDER BY e.expense_date DESC`,
      [budget.rows[0].id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
