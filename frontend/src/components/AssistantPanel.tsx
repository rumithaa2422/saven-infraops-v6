import { useState, useEffect, useCallback } from 'react';
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
  conversationId?: string;
};

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

type Conversation = {
  id: string;
  title: string;
  updatedAt: string;
};

type AssistantPanelProps = {
  onCollapse: () => void;
};

export function AssistantPanel({ onCollapse }: AssistantPanelProps) {
  const navigate = useNavigate();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [cards, setCards] = useState<AiCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredConversation, setHoveredConversation] = useState<string | null>(null);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Load conversations from API
  const loadConversations = async () => {
    try {
      const response = await api.get<Conversation[]>('/ai/conversations');
      setConversations(response.data);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  // Create new conversation
  const startNewChat = async () => {
    try {
      const response = await api.post<{ id: string; title: string }>('/ai/conversations');
      setCurrentConversationId(response.data.id);
      setMessages([]);
      setAnswer('');
      setCards([]);
      setConversations(prev => [{ ...response.data, updatedAt: new Date().toISOString() }, ...prev]);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  // Load conversation messages
  const loadConversation = async (conversationId: string) => {
    try {
      const response = await api.get<{ id: string; title: string; messages: Message[] }>(
        `/ai/conversations/${conversationId}`
      );
      setCurrentConversationId(conversationId);
      setMessages(response.data.messages);
      
      // Show last assistant message as current answer
      const lastAssistant = [...response.data.messages].reverse().find(m => m.role === 'assistant');
      if (lastAssistant) {
        setAnswer(lastAssistant.content);
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  // Delete conversation
  const deleteConversationHandler = async (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    try {
      await api.delete(`/ai/conversations/${conversationId}`);
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      if (currentConversationId === conversationId) {
        setCurrentConversationId(null);
        setMessages([]);
        setAnswer('');
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  // Format relative time
  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Group conversations by time
  const groupConversations = (convs: Conversation[]) => {
    const now = new Date();
    const today: Conversation[] = [];
    const yesterday: Conversation[] = [];
    const lastWeek: Conversation[] = [];
    const older: Conversation[] = [];
    
    convs.forEach(c => {
      const date = new Date(c.updatedAt);
      const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
      
      if (diffDays === 0) today.push(c);
      else if (diffDays === 1) yesterday.push(c);
      else if (diffDays < 7) lastWeek.push(c);
      else older.push(c);
    });
    
    return { today, yesterday, lastWeek, older };
  };

  // Filter conversations by search
  const filteredConversations = searchQuery
    ? conversations.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : conversations;

  const grouped = groupConversations(filteredConversations);

  // Send message
  const ask = async (text = question) => {
    if (!text.trim()) return;
    setLoading(true);
    
    try {
      const response = await api.post<AiResponse>('/ai/ask', { 
        question: text,
        conversationId: currentConversationId || undefined
      });
      
      // Add user message to local state
      const userMsg: Message = { role: 'user', content: text };
      setMessages(prev => [...prev, userMsg]);
      
      // Add assistant response to local state
      const assistantMsg: Message = { role: 'assistant', content: response.data.answer };
      setMessages(prev => [...prev, assistantMsg]);
      
      setAnswer(response.data.answer);
      setCards(response.data.cards || []);
      
      // If new conversation created, update state
      if (response.data.conversationId && !currentConversationId) {
        setCurrentConversationId(response.data.conversationId);
        await loadConversations(); // Refresh list
      }
      
      // Navigation
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
  };

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
        <button 
          className="icon-button" 
          onClick={() => setShowSidebar(!showSidebar)} 
          title={showSidebar ? 'Hide sidebar' : 'Show sidebar'}
        >
          {showSidebar ? '←' : '→'}
        </button>
        <button className="icon-button" onClick={onCollapse} title="Collapse AI panel">→</button>
      </div>

      <div className="assistant-content">
        {/* Conversations Sidebar */}
        {showSidebar && (
          <div className="conversations-sidebar">
            <button className="new-chat-btn" onClick={startNewChat}>
              + New Chat
            </button>
            
            <div className="search-box">
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="conversations-list">
              {grouped.today.length > 0 && (
                <div className="conversation-group">
                  <div className="group-label">Today</div>
                  {grouped.today.map(conv => (
                    <div
                      key={conv.id}
                      className={`conversation-item ${currentConversationId === conv.id ? 'active' : ''}`}
                      onClick={() => loadConversation(conv.id)}
                      onMouseEnter={() => setHoveredConversation(conv.id)}
                      onMouseLeave={() => setHoveredConversation(null)}
                    >
                      <span className="conv-title">{conv.title}</span>
                      <span className="conv-time">{formatRelativeTime(conv.updatedAt)}</span>
                      {hoveredConversation === conv.id && (
                        <button 
                          className="delete-conv-btn"
                          onClick={(e) => deleteConversationHandler(e, conv.id)}
                          title="Delete conversation"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {grouped.yesterday.length > 0 && (
                <div className="conversation-group">
                  <div className="group-label">Yesterday</div>
                  {grouped.yesterday.map(conv => (
                    <div
                      key={conv.id}
                      className={`conversation-item ${currentConversationId === conv.id ? 'active' : ''}`}
                      onClick={() => loadConversation(conv.id)}
                      onMouseEnter={() => setHoveredConversation(conv.id)}
                      onMouseLeave={() => setHoveredConversation(null)}
                    >
                      <span className="conv-title">{conv.title}</span>
                      <span className="conv-time">{formatRelativeTime(conv.updatedAt)}</span>
                      {hoveredConversation === conv.id && (
                        <button 
                          className="delete-conv-btn"
                          onClick={(e) => deleteConversationHandler(e, conv.id)}
                          title="Delete conversation"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {grouped.lastWeek.length > 0 && (
                <div className="conversation-group">
                  <div className="group-label">Last Week</div>
                  {grouped.lastWeek.map(conv => (
                    <div
                      key={conv.id}
                      className={`conversation-item ${currentConversationId === conv.id ? 'active' : ''}`}
                      onClick={() => loadConversation(conv.id)}
                      onMouseEnter={() => setHoveredConversation(conv.id)}
                      onMouseLeave={() => setHoveredConversation(null)}
                    >
                      <span className="conv-title">{conv.title}</span>
                      <span className="conv-time">{formatRelativeTime(conv.updatedAt)}</span>
                      {hoveredConversation === conv.id && (
                        <button 
                          className="delete-conv-btn"
                          onClick={(e) => deleteConversationHandler(e, conv.id)}
                          title="Delete conversation"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {grouped.older.length > 0 && (
                <div className="conversation-group">
                  <div className="group-label">Older</div>
                  {grouped.older.map(conv => (
                    <div
                      key={conv.id}
                      className={`conversation-item ${currentConversationId === conv.id ? 'active' : ''}`}
                      onClick={() => loadConversation(conv.id)}
                      onMouseEnter={() => setHoveredConversation(conv.id)}
                      onMouseLeave={() => setHoveredConversation(null)}
                    >
                      <span className="conv-title">{conv.title}</span>
                      <span className="conv-time">{formatRelativeTime(conv.updatedAt)}</span>
                      {hoveredConversation === conv.id && (
                        <button 
                          className="delete-conv-btn"
                          onClick={(e) => deleteConversationHandler(e, conv.id)}
                          title="Delete conversation"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {filteredConversations.length === 0 && (
                <div className="no-conversations">
                  {searchQuery ? 'No conversations found' : 'No conversations yet'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Chat Area */}
        <div className="chat-area">
          {!currentConversationId && messages.length === 0 && (
            <div className="suggestions">
              {suggestions.map((item) => (
                <button key={item} onClick={() => ask(item)}>{item}</button>
              ))}
            </div>
          )}
          
          {messages.length > 0 && (
            <div className="messages-list">
              {messages.map((msg, i) => (
                <div key={i} className={`message ${msg.role}`}>
                  <div className="message-content">{msg.content}</div>
                </div>
              ))}
            </div>
          )}
          
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
        </div>
      </div>
    </aside>
  );
}
