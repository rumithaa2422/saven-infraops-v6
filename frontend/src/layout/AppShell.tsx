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
    <div className="shell">
      {/* Fixed Left Sidebar */}
      <aside className="sidebar">
        <Sidebar />
      </aside>
      
      {/* Main Content Area - Scrollable */}
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
      
      {/* Fixed Right Sidebar (AI Panel) */}
      {assistantCollapsed ? (
        <button className="assistant-rail" onClick={() => setAssistantCollapsed(false)} title="Open AI Assistant">
          AI
        </button>
      ) : (
        <aside className="assistant">
          <AssistantPanel onCollapse={() => setAssistantCollapsed(true)} />
        </aside>
      )}
    </div>
  );
}
