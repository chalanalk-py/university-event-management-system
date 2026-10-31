import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export default function AuthModal({ isOpen, onClose, onAuthSuccess, initialTab = 'signin' }) {
  const [tab, setTab] = useState(initialTab === 'planevent' ? 'signin' : initialTab); // 'signin', 'signup'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form states
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role] = useState('student');
  const [phone, setPhone] = useState('');


  if (!isOpen) return null;

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
        onAuthSuccess(res.user, res.token);
        onClose();
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
      setSuccessMsg('Account registered successfully! Logging you in...');
      setTimeout(() => {
        onAuthSuccess(res.user, res.token);
        onClose();
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
            <div className="brand-logo-icon" style={{ width: '32px', height: '32px' }}>
              <Sparkles size={18} />
            </div>
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.4rem' }}>
              Uni<span style={{ color: 'var(--accent-blue)' }}>Sphere</span>
            </span>
          </div>
          <p style={{ color: 'var(--secondary-gray)', fontSize: '0.85rem' }}>
            University Event Management System (UEMS)
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          background: 'var(--surface-hover)',
          padding: '4px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.25rem',
          border: '1px solid var(--border-color)'
        }}>
          <button
            type="button"
            className={`nav-tab-btn ${tab === 'signin' ? 'active' : ''}`}
            onClick={() => { setTab('signin'); resetForm(); }}
            style={{ padding: '0.5rem' }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`nav-tab-btn ${tab === 'signup' ? 'active' : ''}`}
            onClick={() => { setTab('signup'); resetForm(); }}
            style={{ padding: '0.5rem' }}
          >
            Sign Up
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div style={{
            background: 'var(--danger-subtle)',
            color: 'var(--danger)',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.8125rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            border: '1px solid rgba(239, 68, 68, 0.2)'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div style={{
            background: 'var(--success-subtle)',
            color: 'var(--success)',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.8125rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            border: '1px solid rgba(16, 185, 129, 0.2)'
          }}>
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* 1. SIGN IN FORM */}
        {tab === 'signin' && (
          <form onSubmit={handleSignIn}>
            <div className="form-group">
              <label className="form-label">User Email or Username</label>
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

            <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem' }}>
              {loading ? 'Authenticating...' : 'Sign In to UniSphere'} <ArrowRight size={16} />
            </button>

            {/* Quick Demo Accounts */}
            <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--secondary-gray)', marginBottom: '0.5rem' }}>
                Quick Test Accounts (Click to Fill):
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                <button type="button" onClick={() => fillDemo('admin@unisphere.edu', 'alex_admin', 'admin123')} className="btn-secondary" style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem' }}>
                  👑 Admin (OC Head)
                </button>
                <button type="button" onClick={() => fillDemo('student@unisphere.edu', 'sarah_student', 'password123')} className="btn-secondary" style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem' }}>
                  🎓 Student
                </button>
                <button type="button" onClick={() => fillDemo('transport@unisphere.edu', 'david_transport', 'password123')} className="btn-secondary" style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem' }}>
                  🚌 Coordinator
                </button>
                <button type="button" onClick={() => fillDemo('designer@unisphere.edu', 'elena_designer', 'password123')} className="btn-secondary" style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem' }}>
                  🎨 Designer
                </button>
                <button type="button" onClick={() => fillDemo('controller@unisphere.edu', 'marcus_agenda', 'password123')} className="btn-secondary" style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem' }}>
                  🎙️ Agenda Controller
                </button>
              </div>
            </div>
          </form>
        )}

        {/* 2. SIGN UP FORM */}
        {tab === 'signup' && (
          <form onSubmit={handleSignUp}>
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
              <label className="form-label">User Email</label>
              <input
                type="email"
                required
                placeholder="jordan@unisphere.edu"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="form-input"
              />
            </div>

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
              <label className="form-label">Phone Number (Optional)</label>
              <input
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="form-input"
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem' }}>
              {loading ? 'Creating Account...' : 'Create UniSphere Account'} <ArrowRight size={16} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
