import React, { useState } from 'react';
import './App.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('http://localhost:4000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (data.success) {
        setMessage('Password reset instructions sent to your email.');
      } else {
        setMessage(data.error || 'Failed to send reset instructions.');
      }
    } catch {
      setMessage('Network error.');
    }
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit} className="auth-form">
        <h2 className="auth-title">Forgot Password</h2>
        <label className="auth-label" htmlFor="forgot-email">Email</label>
        <input
          id="forgot-email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
          className="auth-input"
        />
        <button type="submit" className="auth-btn main-btn" disabled={loading || !email.trim()}>
          {loading ? 'Sending...' : 'Send Reset Instructions'}
        </button>
        {message && <div className="auth-error" style={{ marginTop: '1rem' }}>{message}</div>}
        <button
          type="button"
          className="auth-btn"
          style={{ marginTop: '1rem', background: 'none', color: '#007bff', textDecoration: 'underline', border: 'none', cursor: 'pointer' }}
          onClick={() => window.location.href = '/login'}
        >
          Return to Login
        </button>
      </form>
    </div>
  );
};

export default ForgotPassword;
