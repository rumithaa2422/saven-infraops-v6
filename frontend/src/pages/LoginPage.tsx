import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    try {
      await login(email, password);
      navigate('/');
    } catch {
      setError('Invalid email or password. Please try again.');
    }
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
        <h1>Sign in</h1>
        <label>Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" />
        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" />
        {error && <p className="error">{error}</p>}
        <button className="primary">Login</button>
        <button type="button" className="secondary">Login with Microsoft</button>
      </form>
    </div>
  );
}
