import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';

type AiCard = {
  title: string;
  value?: string;
  description?: string;
  href?: string;
};

type AiResponse = {
  answer: string;
  cards: AiCard[];
  navigation?: {
    route: string;
  };
};

type AssistantPanelProps = {
  onCollapse: () => void;
};

export function AssistantPanel({ onCollapse }: AssistantPanelProps) {
  const navigate = useNavigate();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('Ask me about tickets, incidents, assets, compliance, access, or reports.');
  const [cards, setCards] = useState<AiCard[]>([]);
  const [loading, setLoading] = useState(false);

  async function ask(text = question) {
    if (!text.trim()) return;
    setLoading(true);
    
    try {
      const response = await api.post<AiResponse>('/ai/ask', { question: text });
      
      // Debug: log full response
      console.log('AI RESPONSE:', response.data);
      
      setAnswer(response.data.answer);
      setCards(response.data.cards || []);
      
      // Navigation: call navigate() immediately with no conditions
      const navRoute = response.data.navigation?.route;
      if (navRoute) {
        console.log('NAVIGATING TO:', navRoute);
        navigate(navRoute);
      }
      
      setQuestion('');
    } catch (error) {
      console.error('AI ERROR:', error);
      setAnswer('AI assistant is unable to reach backend. Check API is running on port 4000.');
      setCards([]);
    } finally {
      setLoading(false);
    }
  }

  const suggestions = [
    'How many service requests are open?',
    'Show SLA breached tickets',
    'Summarize today incidents',
    'Show compliance due this month'
  ];

  return (
    <aside className="assistant">
      <div className="assistant-header">
        <div>
          <strong>AI Assistant</strong>
          <span>Always on</span>
        </div>
        <button className="icon-button" onClick={onCollapse} title="Collapse AI panel">→</button>
      </div>
      <div className="prompt-list">
        {suggestions.map((item) => (
          <button key={item} onClick={() => ask(item)}>{item}</button>
        ))}
      </div>
      <div className="answer-card">
        <p>{loading ? 'Checking records...' : answer}</p>
        {cards.map((card) => (
          card.href ? (
            <Link className="mini-card" key={card.title} to={card.href}>
              <span>{card.title}</span>
              {card.value && <strong>{card.value}</strong>}
              {card.description && <small>{card.description}</small>}
            </Link>
          ) : (
            <div className="mini-card" key={card.title}>
              <span>{card.title}</span>
              {card.value && <strong>{card.value}</strong>}
              {card.description && <small>{card.description}</small>}
            </div>
          )
        ))}
      </div>
      <div className="assistant-input">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') ask();
          }}
          placeholder="Ask InfraOps..."
        />
        <button onClick={() => ask()} disabled={loading}>Ask</button>
      </div>
    </aside>
  );
}
