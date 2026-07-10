import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { AssistantPanel } from '../components/AssistantPanel';
import { CommandBar } from '../components/CommandBar';
import { useAuth } from '../auth/AuthContext';

export function AppShell() {
  const { user, logout } = useAuth();
  const [assistantCollapsed, setAssistantCollapsed] = useState(true); // AI panel starts closed by default

  return (
    <div className={`shell ${assistantCollapsed ? 'assistant-collapsed' : ''}`}>
      <Sidebar />
      <main className="main">
        <header className="topbar">
          <div className="topbar-left">
            <div>
              <div className="eyebrow">Saven InfraOps</div>
              <h1>Command Center</h1>
            </div>
          </div>
          <div className="profile">
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
