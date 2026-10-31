import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../../config/database.js';

// Register new user
export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    // Check existing user
    const existing = await query('SELECT id FROM users WHERE username = $1 OR email = $2', [username, email]);
    if (existing.rows.length) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const result = await query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, role, created_at',
      [username, email, password_hash]
    );

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ user, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (!result.rows.length) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const { password_hash, ...safeUser } = user;
    res.json({ user: safeUser, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get current user profile
export const getProfile = async (req, res) => {
  try {
    const result = await query('SELECT id, username, email, role, created_at FROM users WHERE id = $1', [req.user.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all users (Admin)
export const getAllUsers = async (req, res) => {
  try {
    const result = await query('SELECT id, username, email, role, created_at FROM users ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update user role (Admin)
export const updateRole = async (req, res) => {
  try {
    const { role } = req.body;
    const result = await query('UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING id, username, email, role', [role, req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
