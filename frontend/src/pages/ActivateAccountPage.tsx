import { FormEvent, useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export function ActivateAccountPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenError, setTokenError] = useState('');

  useEffect(() => {
    if (!token) {
      setValidating(false);
      setTokenError('No activation token provided');
      return;
    }

    api.get(`/auth/activate/validate/${token}`)
      .then(() => setValidating(false))
      .catch((err) => {
        setValidating(false);
        setTokenError(err.response?.data?.error || 'Invalid activation token');
      });
  }, [token]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password strength
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setError('Password must contain at least one uppercase letter');
      return;
    }
    if (!/[a-z]/.test(password)) {
      setError('Password must contain at least one lowercase letter');
      return;
    }
    if (!/[0-9]/.test(password)) {
      setError('Password must contain at least one number');
      return;
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      setError('Password must contain at least one special character');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/activate', { token, password, confirmPassword });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to activate account');
    } finally {
      setLoading(false);
    }
  }

  if (validating) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="brand large">
            <div className="brand-mark">S</div>
            <div>
              <strong>Saven InfraOps</strong>
              <span>Command Center</span>
            </div>
          </div>
          <p>Validating activation token...</p>
        </div>
      </div>
    );
  }

  if (tokenError) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="brand large">
            <div className="brand-mark">S</div>
            <div>
              <strong>Saven InfraOps</strong>
              <span>Command Center</span>
            </div>
          </div>
          <h1>Activation Failed</h1>
          <p className="error">{tokenError}</p>
          <button className="secondary" onClick={() => navigate('/login')}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="brand large">
            <div className="brand-mark">S</div>
            <div>
              <strong>Saven InfraOps</strong>
              <span>Command Center</span>
            </div>
          </div>
          <h1>Account Activated!</h1>
          <p style={{ color: 'var(--success)', marginBottom: '1rem' }}>
            Your account has been activated successfully.
          </p>
          <p>Redirecting to login page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={submit}>
        <div className="brand large">
          <div className="brand-mark">S</div>
          <div>
            <strong>Saven InfraOps</strong>
            <span>Command Center</span>
          </div>
        </div>
        <h1>Set Your Password</h1>
        <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
          Create a secure password for your account.
        </p>

        <label>New Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
        />

        <label>Confirm Password</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm password"
        />

        {error && <p className="error">{error}</p>}

        <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '1rem' }}>
          <p>Password requirements:</p>
          <ul style={{ marginLeft: '1rem', textAlign: 'left' }}>
            <li>At least 8 characters</li>
            <li>One uppercase letter</li>
            <li>One lowercase letter</li>
            <li>One number</li>
            <li>One special character</li>
          </ul>
        </div>

        <button className="primary" type="submit" disabled={loading}>
          {loading ? 'Activating...' : 'Activate Account'}
        </button>
      </form>
    </div>
  );
}
