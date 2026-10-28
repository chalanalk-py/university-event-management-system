
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <main className="login-page">
      <header className="login-header">
        <Link to="/login" className="login-brand">
          <span className="brand-mark" />
          STUDIO<span className="brand-period">.</span>
        </Link>
        <span className="header-label">ACCOUNT ACCESS</span>
      </header>

      <section className="login-content">
        <div className="login-intro">
          <span className="eyebrow">WELCOME BACK / 01</span>
          <h1>Sign in.</h1>
          <p>Enter your credentials to continue.</p>
        </div>

        {error && (
          <div className="login-error" role="alert">
            {error}
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label htmlFor="login-email">EMAIL ADDRESS</label>
            <input
              id="login-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="login-field">
            <label htmlFor="login-password">PASSWORD</label>
            <input
              id="login-password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <button
            className="login-submit"
            type="submit"
            disabled={loading}
          >
            <span>{loading ? 'Signing in...' : 'Sign in'}</span>
            {!loading && <span aria-hidden="true">↗</span>}
          </button>
        </form>

        <p className="login-register">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </section>

      <footer className="login-footer">
        <span>SIMPLE BY DESIGN.</span>
        <span>© 2026</span>
      </footer>
    </main>
  );
}
