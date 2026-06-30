import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../auth/AuthContext';

// Types
type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
};

type Conversation = {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
};

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

// Generate unique ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Format relative time
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return new Date(timestamp).toLocaleDateString();
}

// Generate title from first message
function generateTitle(content: string): string {
  const cleaned = content.replace(/[?!.,]+$/, '').trim();
  if (cleaned.length <= 40) return cleaned;
  return cleaned.substring(0, 37) + '...';
}

// Default suggestions
const DEFAULT_SUGGESTIONS = [
  'How many service requests are open?',
  'Show SLA breached tickets',
  'Summarize today incidents',
  'Show compliance due this month'
];

export function AssistantPanel({ onCollapse }: AssistantPanelProps) {
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  
  // State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedIdState] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  
  // User-specific localStorage keys
  const storageKey = user ? `infraops_ai_conversations_${user.id}` : null;
  const selectedKey = user ? `infraops_ai_selected_${user.id}` : null;
  
  // Get current conversation
  const currentConversation = conversations.find(c => c.id === selectedId);
  
  // Load on mount - using user-specific key
  useEffect(() => {
    if (!user) {
      setConversations([]);
      setSelectedIdState(null);
      return;
    }
    
    const key = `infraops_ai_conversations_${user.id}`;
    const selKey = `infraops_ai_selected_${user.id}`;
    
    try {
      const data = localStorage.getItem(key);
      const loaded: Conversation[] = data ? JSON.parse(data) : [];
      setConversations(loaded);
      
      const savedId = localStorage.getItem(selKey);
      if (savedId && loaded.find(c => c.id === savedId)) {
        setSelectedIdState(savedId);
      }
    } catch {
      setConversations([]);
    }
  }, [user?.id]);
  
  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConversation?.messages]);
  
  // Save conversations when they change (user-specific)
  useEffect(() => {
    if (!user || !storageKey) return;
    if (conversations.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(conversations));
    } else {
      localStorage.removeItem(storageKey);
    }
  }, [conversations, user?.id, storageKey]);
  
  // Save selected ID when it changes (user-specific)
  useEffect(() => {
    if (!user || !selectedKey) return;
    if (selectedId) {
      localStorage.setItem(selectedKey, selectedId);
    } else {
      localStorage.removeItem(selectedKey);
    }
  }, [selectedId, user?.id, selectedKey]);
  
  // Select conversation
  const selectConversation = useCallback((id: string) => {
    setSelectedIdState(id);
  }, []);
  
  // Start new chat
  const startNewChat = useCallback(() => {
    const newConv: Conversation = {
      id: generateId(),
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    setConversations(prev => [newConv, ...prev]);
    selectConversation(newConv.id);
  }, [selectConversation]);
  
  // Delete conversation
  const deleteConversation = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setConversations(prev => {
      const updated = prev.filter(c => c.id !== id);
      return updated;
    });
    if (selectedId === id) {
      setSelectedIdState(null);
    }
  }, [selectedId]);
  
  // Send message
  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading || !user) return;
    
    const now = Date.now();
    
    // Create or update conversation
    let convId = selectedId;
    
    if (!convId) {
      // Create new conversation
      const newConv: Conversation = {
        id: generateId(),
        title: generateTitle(text),
        messages: [],
        createdAt: now,
        updatedAt: now
      };
      setConversations(prev => [newConv, ...prev]);
      convId = newConv.id;
      setSelectedIdState(convId);
    } else {
      // Update existing conversation title if it's the first message
      setConversations(prev => prev.map(c => {
        if (c.id === convId && c.messages.length === 0) {
          return { ...c, title: generateTitle(text), updatedAt: now };
        }
        if (c.id === convId) {
          return { ...c, updatedAt: now };
        }
        return c;
      }));
    }
    
    // Add user message
const userMessage: Message = {
  id: generateId(),
  role: 'user',
  content: text,
  timestamp: now
};

setConversations(prev =>
  prev.map(c => {
    if (c.id === convId) {
      return {
        ...c,
        messages: [...c.messages, userMessage],
        updatedAt: now
      };
    }
    return c;
  })
);

setInputValue('');
setIsLoading(true);

try {
  const response = await api.post<AiResponse>('/ai/ask', { question: text });

  const data = response.data;
  console.log("Full AI Response:", data);

  const assistantMessage: Message = {
    id: generateId(),
    role: 'assistant',
    content: data.answer,
    timestamp: Date.now()
  };

  setConversations(prev =>
    prev.map(c => {
      if (c.id === convId) {
        return {
          ...c,
          messages: [...c.messages, assistantMessage],
          updatedAt: Date.now()
        };
      }
      return c;
    })
  );

  // ✅ NAVIGATION (ONLY ONCE, SAFE)
  if (data?.navigation?.route) {
    const route = data.navigation.route;
    console.log("Navigating to:", route);
    navigate(route);
    }
  
} catch (error) {
  const errorMessage: Message = {
    id: generateId(),
    role: 'assistant',
    content:
      'AI assistant is unable to reach backend. Check API is running on port 4000.',
    timestamp: Date.now()
  };

  setConversations(prev =>
    prev.map(c => {
      if (c.id === convId) {
        return {
          ...c,
          messages: [...c.messages, errorMessage]
        };
      }
      return c;
    })
  );
} finally {
  setIsLoading(false);
}
  };
  
  // Handle input key down
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };
  
  // Filter conversations
  const filteredConversations = searchQuery
    ? conversations.filter(c => 
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.messages.some(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : conversations;
  
  // Group conversations
  const groupByTime = (convs: Conversation[]) => {
    const now = Date.now();
    const today: Conversation[] = [];
    const yesterday: Conversation[] = [];
    const lastWeek: Conversation[] = [];
    const older: Conversation[] = [];
    
    convs.forEach(c => {
      const days = Math.floor((now - c.updatedAt) / 86400000);
      if (days === 0) today.push(c);
      else if (days === 1) yesterday.push(c);
      else if (days < 7) lastWeek.push(c);
      else older.push(c);
    });
    
    return { today, yesterday, lastWeek, older };
  };
  
  const grouped = groupByTime(filteredConversations);
  
  return (
    <aside className="ai-panel">
      {/* Header */}
      <div className="ai-header">
        <button 
          className="ai-sidebar-toggle"
          onClick={() => setShowSidebar(!showSidebar)}
          title={showSidebar ? 'Hide sidebar' : 'Show sidebar'}
        >
          {showSidebar ? '◀' : '▶'}
        </button>
        <div className="ai-header-title">
          <span className="ai-badge">AI</span>
          <strong>InfraOps Assistant</strong>
        </div>
        <button className="ai-collapse-btn" onClick={onCollapse} title="Collapse">×</button>
      </div>
      
      <div className="ai-body">
        {/* Sidebar */}
        {showSidebar && (
          <div className="ai-sidebar">
            <button className="ai-new-chat" onClick={startNewChat}>
              <span>+</span> New Chat
            </button>
            
            <div className="ai-search">
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="ai-conversations">
              {grouped.today.length > 0 && (
                <div className="ai-conv-group">
                  <div className="ai-conv-label">Today</div>
                  {grouped.today.map(conv => (
                    <ConversationItem
                      key={conv.id}
                      conversation={conv}
                      isActive={selectedId === conv.id}
                      isHovered={hoveredId === conv.id}
                      onSelect={() => selectConversation(conv.id)}
                      onHover={setHoveredId}
                      onDelete={(e) => deleteConversation(e, conv.id)}
                    />
                  ))}
                </div>
              )}
              
              {grouped.yesterday.length > 0 && (
                <div className="ai-conv-group">
                  <div className="ai-conv-label">Yesterday</div>
                  {grouped.yesterday.map(conv => (
                    <ConversationItem
                      key={conv.id}
                      conversation={conv}
                      isActive={selectedId === conv.id}
                      isHovered={hoveredId === conv.id}
                      onSelect={() => selectConversation(conv.id)}
                      onHover={setHoveredId}
                      onDelete={(e) => deleteConversation(e, conv.id)}
                    />
                  ))}
                </div>
              )}
              
              {grouped.lastWeek.length > 0 && (
                <div className="ai-conv-group">
                  <div className="ai-conv-label">Previous 7 Days</div>
                  {grouped.lastWeek.map(conv => (
                    <ConversationItem
                      key={conv.id}
                      conversation={conv}
                      isActive={selectedId === conv.id}
                      isHovered={hoveredId === conv.id}
                      onSelect={() => selectConversation(conv.id)}
                      onHover={setHoveredId}
                      onDelete={(e) => deleteConversation(e, conv.id)}
                    />
                  ))}
                </div>
              )}
              
              {grouped.older.length > 0 && (
                <div className="ai-conv-group">
                  <div className="ai-conv-label">Older</div>
                  {grouped.older.map(conv => (
                    <ConversationItem
                      key={conv.id}
                      conversation={conv}
                      isActive={selectedId === conv.id}
                      isHovered={hoveredId === conv.id}
                      onSelect={() => selectConversation(conv.id)}
                      onHover={setHoveredId}
                      onDelete={(e) => deleteConversation(e, conv.id)}
                    />
                  ))}
                </div>
              )}
              
              {filteredConversations.length === 0 && !searchQuery && (
                <div className="ai-empty-state">
                  No conversations yet
                </div>
              )}
              
              {filteredConversations.length === 0 && searchQuery && (
                <div className="ai-empty-state">
                  No results found
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Chat Area */}
        <div className="ai-chat">
          {(!selectedId || currentConversation?.messages.length === 0) && !isLoading && (
            <div className="ai-welcome">
              <div className="ai-welcome-icon">💬</div>
              <h3>Welcome to InfraOps AI</h3>
              <p>Ask me about tickets, incidents, assets, compliance, or anything else.</p>
              <div className="ai-suggestions">
                {DEFAULT_SUGGESTIONS.map(suggestion => (
                  <button key={suggestion} onClick={() => sendMessage(suggestion)}>
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {currentConversation && currentConversation.messages.length > 0 && (
            <div className="ai-messages">
              {currentConversation.messages.map(msg => (
                <div key={msg.id} className={`ai-message ai-message-${msg.role}`}>
                  <div className="ai-message-avatar">
                    {msg.role === 'user' ? '👤' : '🤖'}
                  </div>
                  <div className="ai-message-content">
                    <div className="ai-message-text">{msg.content}</div>
                    <div className="ai-message-time">{formatRelativeTime(msg.timestamp)}</div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="ai-message ai-message-assistant">
                  <div className="ai-message-avatar">🤖</div>
                  <div className="ai-message-content">
                    <div className="ai-message-text ai-loading">
                      <span className="ai-loading-dot"></span>
                      <span className="ai-loading-dot"></span>
                      <span className="ai-loading-dot"></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
          
          {!currentConversation && !isLoading && (
            <div className="ai-messages">
              {isLoading && (
                <div className="ai-message ai-message-assistant">
                  <div className="ai-message-avatar">🤖</div>
                  <div className="ai-message-content">
                    <div className="ai-message-text ai-loading">
                      <span className="ai-loading-dot"></span>
                      <span className="ai-loading-dot"></span>
                      <span className="ai-loading-dot"></span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Input */}
          <div className="ai-input-area">
            <textarea
              className="ai-input"
              placeholder="Ask InfraOps..."
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              rows={1}
            />
            <button 
              className="ai-send-btn" 
              onClick={() => sendMessage(inputValue)}
              disabled={!inputValue.trim() || isLoading}
            >
              {isLoading ? '...' : '➤'}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

// Conversation Item Component
function ConversationItem({
  conversation,
  isActive,
  isHovered,
  onSelect,
  onHover,
  onDelete
}: {
  conversation: Conversation;
  isActive: boolean;
  isHovered: boolean;
  onSelect: () => void;
  onHover: (id: string | null) => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  const lastMessage = conversation.messages[conversation.messages.length - 1];
  
  return (
    <div
      className={`ai-conv-item ${isActive ? 'active' : ''}`}
      onClick={onSelect}
      onMouseEnter={() => onHover(conversation.id)}
      onMouseLeave={() => onHover(null)}
    >
      <div className="ai-conv-icon">💬</div>
      <div className="ai-conv-info">
        <div className="ai-conv-title">{conversation.title}</div>
        {lastMessage && (
          <div className="ai-conv-preview">
            {lastMessage.content.substring(0, 30)}...
          </div>
        )}
      </div>
      <div className="ai-conv-meta">
        <span className="ai-conv-time">{formatRelativeTime(conversation.updatedAt)}</span>
        {(isHovered || isActive) && (
          <button className="ai-conv-delete" onClick={onDelete} title="Delete">
            ×
          </button>
        )}
      </div>
    </div>
  );
}
