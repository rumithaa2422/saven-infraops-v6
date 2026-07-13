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

  return (
    <div className={`dashboard-header ${className}`}>
      <div className="header-content">
        <div className="header-greeting">
          <h1 className="greeting-text">{getGreeting()}, {user?.name || 'User'}</h1>
          <p className="header-date">{formatDate(currentTime)}</p>
        </div>
        <div className="header-time">
          <span className="time-label">Current Time</span>
          <span className="time-value">{formatTime(currentTime)}</span>
        </div>
      </div>
    </div>
  );
}
