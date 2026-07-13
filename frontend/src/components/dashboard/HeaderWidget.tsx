import { useEffect, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';

function getGreeting(hour: number): string {
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

export function HeaderWidget() {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const greeting = getGreeting(currentTime.getHours());
  const userName = user?.name || 'User';

  return (
    <section className="dashboard-header">
      <div className="header-content">
        <div className="header-left">
          <h2 className="greeting">{greeting}, {userName}</h2>
          <p className="header-subtitle">Welcome to your command center</p>
        </div>
        <div className="header-right">
          <div className="datetime-display">
            <span className="date">{formatDate(currentTime)}</span>
            <span className="time">{formatTime(currentTime)}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
