import React from 'react';
import {
  Home,
  Bot,
  Search,
  ListChecks,
  ReceiptText,
  History,
  Database,
  Settings,
  ArrowUpRight,
} from 'lucide-react';

export type WorkspaceView =
  | 'home'
  | 'create'
  | 'agents'
  | 'partners'
  | 'tasks'
  | 'bookings'
  | 'history'
  | 'sources'
  | 'settings'
  | 'task';

const items: Array<{ id: WorkspaceView; label: string; icon: React.ReactNode }> = [
  { id: 'home', label: 'Home', icon: <Home /> },
  { id: 'agents', label: 'Agents', icon: <Bot /> },
  { id: 'partners', label: 'Partner search', icon: <Search /> },
  { id: 'tasks', label: 'Tasks', icon: <ListChecks /> },
  { id: 'bookings', label: 'Bookings', icon: <ReceiptText /> },
  { id: 'history', label: 'History', icon: <History /> },
  { id: 'sources', label: 'Sources', icon: <Database /> },
  { id: 'settings', label: 'Settings', icon: <Settings /> },
];

export const WorkspaceSidebar: React.FC<{
  active: WorkspaceView;
  onNavigate: (view: WorkspaceView) => void;
}> = ({ active, onNavigate }) => (
  <aside className="workspace-sidebar" aria-label="Main navigation">
    <button
      className="workspace-brand"
      type="button"
      onClick={() => onNavigate('home')}
      aria-label="ActionDesk home"
    >
      <span className="brand-symbol">
        <ArrowUpRight size={19} strokeWidth={2.8} />
      </span>
      <span>ActionDesk</span>
    </button>
    <nav className="workspace-nav">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onNavigate(item.id)}
          aria-current={
            active === item.id || (active === 'task' && item.id === 'tasks') ? 'page' : undefined
          }
          className={`workspace-nav-item ${active === item.id || (active === 'task' && item.id === 'tasks') ? 'is-active' : ''}`}
        >
          <span className="workspace-nav-icon">{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
    <div className="workspace-profile">
      <span className="profile-avatar">A</span>
      <span>
        <strong>Local workspace</strong>
        <small>Private session</small>
      </span>
    </div>
  </aside>
);
