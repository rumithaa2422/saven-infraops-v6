import { useState, useEffect } from 'react';
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
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  // Handle navigation from AI responses
  useEffect(() => {
    if (pendingNavigation && pendingNavigation !== window.location.pathname) {
      navigate(pendingNavigation);
      setPendingNavigation(null);
    }
  }, [pendingNavigation, navigate]);

  async function ask(text = question) {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const response = await api.post<AiResponse>('/ai/ask', { question: text });
      setAnswer(response.data.answer);
      setCards(response.data.cards || []);
      
      // Handle navigation if backend provides it
      if (response.data.navigation?.route) {
        const targetRoute = response.data.navigation.route;
        // Only navigate if route is different from current page
        if (targetRoute !== window.location.pathname) {
          setPendingNavigation(targetRoute);
        }
      }
      
      setQuestion('');
    } catch (error) {
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
