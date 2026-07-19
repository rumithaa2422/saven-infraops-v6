/**
 * Unauthorized / Empty State Components
 * 
 * Professional UI components for permission denied scenarios and empty states.
 */

import { useNavigate } from 'react-router-dom';

/* ============================================
 * Unauthorized Component
 * Shows when user doesn't have permission
 * ============================================ */

interface UnauthorizedProps {
  /** Custom message */
  message?: string;
  /** Permission that was denied */
  permission?: string;
  /** Show contact admin button */
  showContactAdmin?: boolean;
  /** Admin contact email */
  adminEmail?: string;
  /** On go back handler */
  onGoBack?: () => void;
}

export function Unauthorized({
  message = "You don't have permission to perform this action.",
  permission,
  showContactAdmin = true,
  adminEmail = 'admin@company.com',
  onGoBack
}: UnauthorizedProps) {
  const navigate = useNavigate();

  const handleGoBack = () => {
    if (onGoBack) {
      onGoBack();
    } else {
      window.history.back();
    }
  };

  return (
    <div className="unauthorized-container">
      <div className="unauthorized-content">
        <div className="unauthorized-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        
        <h2>Access Denied</h2>
        
        <p className="unauthorized-message">{message}</p>
        
        {permission && (
          <p className="unauthorized-permission">
            Required permission: <code>{permission}</code>
          </p>
        )}
        
        <p className="unauthorized-hint">
          Contact your administrator if you believe this is an error.
        </p>
        
        <div className="unauthorized-actions">
          <button onClick={handleGoBack} className="btn-secondary">
            Go Back
          </button>
          
          {showContactAdmin && (
            <a href={`mailto:${adminEmail}?subject=Permission Access Request`} className="btn-primary">
              Contact Administrator
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================
 * Empty State Component
 * Shows when there's no data to display
 * ============================================ */

interface EmptyStateProps {
  /** Icon to display */
  icon?: 'ticket' | 'incident' | 'document' | 'search' | 'inbox' | 'warning';
  /** Title */
  title: string;
  /** Description */
  description?: string;
  /** Action button */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Secondary action */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

const iconMap = {
  ticket: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v2.25m0 18.75V19.5a2.25 2.25 0 01-2.25-2.25h-6.75A2.25 2.25 0 015 19.5M12 12.75V15a3 3 0 106 0v-2.25" />
    </svg>
  ),
  incident: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  ),
  document: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  ),
  search: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  ),
  inbox: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-17.5 0a2.25 2.25 0 00-2.25 2.25v10.5a2.25 2.25 0 002.25 2.25h13.5M6 7.5h12a.75.75 0 01.75.75v7.5a.75.75 0 01-.75.75H6a.75.75 0 01-.75-.75v-7.5A.75.75 0 016 7.5z" />
    </svg>
  ),
  warning: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
    </svg>
  )
};

export function EmptyState({ icon = 'inbox', title, description, action, secondaryAction }: EmptyStateProps) {
  return (
    <div className="empty-state-container">
      <div className="empty-state-icon">
        {iconMap[icon]}
      </div>
      
      <h3 className="empty-state-title">{title}</h3>
      
      {description && (
        <p className="empty-state-description">{description}</p>
      )}
      
      {action && (
        <div className="empty-state-actions">
          <button onClick={action.onClick} className="btn-primary">
            {action.label}
          </button>
          
          {secondaryAction && (
            <button onClick={secondaryAction.onClick} className="btn-secondary">
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ============================================
 * Permission Denied Empty State
 * Shows when user doesn't have permission to view content
 * ============================================ */

interface PermissionDeniedProps {
  /** Module name */
  moduleName?: string;
  /** Permission required */
  permission?: string;
  /** On contact admin handler */
  onContactAdmin?: () => void;
}

export function PermissionDeniedEmptyState({
  moduleName = 'this section',
  permission,
  onContactAdmin
}: PermissionDeniedProps) {
  return (
    <div className="permission-denied-container">
      <div className="permission-denied-icon">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
      </div>
      
      <h3 className="permission-denied-title">Access Restricted</h3>
      
      <p className="permission-denied-message">
        You don't have permission to view {moduleName}.
      </p>
      
      {permission && (
        <p className="permission-denied-permission">
          Required: <code>{permission}</code>
        </p>
      )}
      
      <p className="permission-denied-hint">
        Contact your administrator to request access.
      </p>
      
      <div className="permission-denied-actions">
        <button onClick={() => window.history.back()} className="btn-secondary">
          Go Back
        </button>
        
        {onContactAdmin && (
          <button onClick={onContactAdmin} className="btn-primary">
            Request Access
          </button>
        )}
      </div>
    </div>
  );
}

export default {
  Unauthorized,
  EmptyState,
  PermissionDeniedEmptyState
};
