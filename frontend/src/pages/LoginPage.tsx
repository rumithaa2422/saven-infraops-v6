import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function LoginPage() {
  const [email, setEmail] = useState('admin@saven.in');
  const [password, setPassword] = useState('Admin@12345');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch {
      setError('Login failed. Check backend, database, or seed user.');
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
        <input value={email} onChange={(e) => setEmail(e.target.value)} />
        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="error">{error}</p>}
        <button className="primary">Login</button>
        <button type="button" className="secondary">Login with Microsoft</button>
      </form>
    </div>
  );
}
