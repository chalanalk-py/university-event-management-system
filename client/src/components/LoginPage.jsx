import React, { useState } from 'react';
import { Mail, Lock, User, Sparkles, ArrowRight, CheckCircle2, AlertCircle, UserPlus, LogIn } from 'lucide-react';
import { api } from '../services/api';

export default function LoginPage({ onLoginSuccess }) {
  const [tab, setTab] = useState('signin'); // 'signin' or 'signup'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form states
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('student');
  const [phone, setPhone] = useState('');

  const resetForm = () => {
    setError('');
    setSuccessMsg('');
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.login(email || username, password);
      setSuccessMsg(`Welcome back, ${res.user.full_name}!`);
      setTimeout(() => {
        onLoginSuccess(res.user, res.token);
      }, 500);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.register({
        email,
        username,
        password,
        fullName,
        role,
        phone
      });
      setSuccessMsg('Account created successfully! Logging you in...');
      setTimeout(() => {
        onLoginSuccess(res.user, res.token);
      }, 600);
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  // Demo autofill for rapid testing
  const fillDemo = (demoEmail, demoUser, demoPass) => {
    setEmail(demoEmail);
    setUsername(demoUser);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div className="login-page">
      {/* Animated background */}
      <div className="login-bg-pattern" />

      <div className="login-container">
        {/* Left branding panel */}
        <div className="login-branding">
          <div className="login-brand-content">
            <div className="brand-logo-icon" style={{ width: '52px', height: '52px', marginBottom: '1.5rem' }}>
              <Sparkles size={28} />
            </div>
            <h1 className="login-brand-title">
              Uni<span style={{ color: '#93C5FD' }}>Sphere</span>
            </h1>
            <p className="login-brand-subtitle">
              University Event Management System
            </p>
            <div className="login-brand-features">
              <div className="login-feature-item">
                <CheckCircle2 size={16} />
                <span>Plan & manage university events</span>
              </div>
              <div className="login-feature-item">
                <CheckCircle2 size={16} />
                <span>Real-time live agenda tracking</span>
              </div>
              <div className="login-feature-item">
                <CheckCircle2 size={16} />
                <span>Budget management & analytics</span>
              </div>
              <div className="login-feature-item">
                <CheckCircle2 size={16} />
                <span>Committee elections & voting</span>
              </div>
              <div className="login-feature-item">
                <CheckCircle2 size={16} />
                <span>Design review & feedback</span>
              </div>
            </div>
          </div>
          <p className="login-brand-footer">
            © 2026 UniSphere UEMS • All rights reserved
          </p>
        </div>

        {/* Right form panel */}
        <div className="login-form-panel">
          <div className="login-form-header">
            <h2 className="login-form-title">
              {tab === 'signin' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="login-form-desc">
              {tab === 'signin'
                ? 'Sign in to your UniSphere account to continue'
                : 'Register a new account to get started'}
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="login-tab-switcher">
            <button
              type="button"
              className={`login-tab-btn ${tab === 'signin' ? 'active' : ''}`}
              onClick={() => { setTab('signin'); resetForm(); }}
            >
              <LogIn size={15} />
              Sign In
            </button>
            <button
              type="button"
              className={`login-tab-btn ${tab === 'signup' ? 'active' : ''}`}
              onClick={() => { setTab('signup'); resetForm(); }}
            >
              <UserPlus size={15} />
              Sign Up
            </button>
          </div>

          {/* Alerts */}
          {error && (
            <div className="login-alert login-alert-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="login-alert login-alert-success">
              <CheckCircle2 size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* SIGN IN FORM */}
          {tab === 'signin' && (
            <form onSubmit={handleSignIn} className="login-form">
              <div className="form-group">
                <label className="form-label">Email or Username</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--secondary-gray)' }} />
                  <input
                    type="text"
                    required
                    placeholder="admin@unisphere.edu or alex_admin"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '2.4rem' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--secondary-gray)' }} />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '2.4rem' }}
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary login-submit-btn">
                {loading ? 'Authenticating...' : 'Sign In'} <ArrowRight size={16} />
              </button>

              {/* Quick Demo Accounts */}
              <div className="login-demo-section">
                <div className="login-demo-label">
                  Quick Test Accounts (Click to Fill):
                </div>
                <div className="login-demo-buttons">
                  <button type="button" onClick={() => fillDemo('admin@unisphere.edu', 'alex_admin', 'admin123')} className="btn-secondary login-demo-btn">
                    👑 Admin
                  </button>
                  <button type="button" onClick={() => fillDemo('student@unisphere.edu', 'sarah_student', 'password123')} className="btn-secondary login-demo-btn">
                    🎓 Student
                  </button>
                  <button type="button" onClick={() => fillDemo('transport@unisphere.edu', 'david_transport', 'password123')} className="btn-secondary login-demo-btn">
                    🚌 Coordinator
                  </button>
                  <button type="button" onClick={() => fillDemo('designer@unisphere.edu', 'elena_designer', 'password123')} className="btn-secondary login-demo-btn">
                    🎨 Designer
                  </button>
                  <button type="button" onClick={() => fillDemo('controller@unisphere.edu', 'marcus_agenda', 'password123')} className="btn-secondary login-demo-btn">
                    🎙️ Controller
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* SIGN UP FORM */}
          {tab === 'signup' && (
            <form onSubmit={handleSignUp} className="login-form">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Username</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. jordan_student"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    placeholder="Jordan Lee"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  required
                  placeholder="jordan@unisphere.edu"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select value={role} onChange={e => setRole(e.target.value)} className="form-select">
                    <option value="student">Student</option>
                    <option value="event_member">Event Member</option>
                    <option value="coordinator">Coordinator</option>
                    <option value="designer">Designer</option>
                    <option value="live_agenda_controller">Live Agenda Controller</option>
                    <option value="admin">Admin (OC Head)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number (Optional)</label>
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="form-input"
                />
              </div>

              <button type="submit" disabled={loading} className="btn-primary login-submit-btn">
                {loading ? 'Creating Account...' : 'Create Account'} <ArrowRight size={16} />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

