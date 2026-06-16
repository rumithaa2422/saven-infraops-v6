import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export function CommandBar() {
  const [command, setCommand] = useState('');
  const [status, setStatus] = useState('');
  const navigate = useNavigate();

  async function submit(event: FormEvent) {
    event.preventDefault();
    const text = command.trim();
    if (!text) return;

    const lower = text.toLowerCase();
    if (lower.includes('service request') || lower.includes('ticket')) navigate('/service-requests');
    if (lower.includes('inventory') || lower.includes('asset')) navigate('/inventory');
    if (lower.includes('compliance')) navigate('/compliance');
    if (lower.includes('incident')) navigate('/incidents');

    try {
      const response = await api.post('/ai/ask', { question: text });
      setStatus(response.data.answer);
    } catch {
      setStatus('Command received. Backend AI endpoint is not reachable.');
    }
    setCommand('');
  }

  return (
    <form className="command-bar" onSubmit={submit}>
      <input
        value={command}
        onChange={(e) => setCommand(e.target.value)}
        placeholder='Ask anything, for example "How many service requests are open?"'
      />
      <button>Run</button>
      {status && <span className="command-status">{status}</span>}
    </form>
  );
}
