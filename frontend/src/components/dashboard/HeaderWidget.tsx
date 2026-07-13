import { useEffect, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';

interface HeaderWidgetProps {
  className?: string;
}

export function HeaderWidget({ className = '' }: HeaderWidgetProps) {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Get user role display
  const getUserRoleDisplay = () => {
    if (!user?.roles || user.roles.length === 0) {
      return 'User';
    }
    // Format roles for display (capitalize first letter)
    return user.roles.map(role => 
      role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()
    ).join(', ');
  };

  return (
    <div className={`dashboard-header ${className}`}>
      <div className="header-content">
        <div className="header-greeting">
          <h1 className="greeting-text">{getGreeting()}, {user?.name || 'User'}</h1>
          <div className="header-meta">
            <span className="header-role">
              <span className="role-icon">👤</span>
              {getUserRoleDisplay()}
            </span>
            <span className="header-date">{formatDate(currentTime)}</span>
          </div>
        </div>
        <div className="header-time">
          <span className="time-label">Current Time</span>
          <span className="time-value">{formatTime(currentTime)}</span>
        </div>
      </div>
    </div>
  );
}
