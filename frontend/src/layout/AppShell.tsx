import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { AssistantPanel } from '../components/AssistantPanel';
import { CommandBar } from '../components/CommandBar';
import { useAuth } from '../auth/AuthContext';

export function AppShell() {
  const { user, logout } = useAuth();
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [assistantCollapsed, setAssistantCollapsed] = useState(false);

  return (
    <div className={`shell ${leftCollapsed ? 'left-collapsed' : ''} ${assistantCollapsed ? 'assistant-collapsed' : ''}`}>
      <Sidebar collapsed={leftCollapsed} onToggle={() => setLeftCollapsed((value) => !value)} />
      <main className="main">
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-button" onClick={() => setLeftCollapsed((value) => !value)} title="Collapse left menu">
              {leftCollapsed ? '☰' : '←'}
            </button>
            <div>
              <div className="eyebrow">Saven InfraOps</div>
              <h1>Command Center</h1>
            </div>
          </div>
          <div className="profile">
            <button className="secondary" onClick={() => setAssistantCollapsed((value) => !value)}>
              {assistantCollapsed ? 'Open AI Panel' : 'Collapse AI Panel'}
            </button>
            <span>{user?.name}</span>
            <button onClick={logout}>Logout</button>
          </div>
        </header>
        <section className="workspace">
          <Outlet />
        </section>
        <CommandBar />
      </main>
      {assistantCollapsed ? (
        <button className="assistant-rail" onClick={() => setAssistantCollapsed(false)} title="Open AI Assistant">
          AI
        </button>
      ) : (
        <AssistantPanel onCollapse={() => setAssistantCollapsed(true)} />
      )}
    </div>
  );
}
