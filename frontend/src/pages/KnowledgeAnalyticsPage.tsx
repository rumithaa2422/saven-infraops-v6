import React, { useState, useEffect, useCallback } from 'react';
import { api, knowledgeAnalyticsApi, KbAnalytics, TopArticle, ActivityItem } from '../services/api';
import { useAuth } from '../auth/AuthContext';

export function KnowledgeAnalyticsPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<KbAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await knowledgeAnalyticsApi.getAnalytics();
      setAnalytics(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load analytics';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getActivityIcon = (action: string, entityType: string) => {
    if (entityType === 'ATTACHMENT') {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    }
    if (action === 'CREATED') {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    }
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  };

  const getActivityColor = (action: string, entityType: string): string => {
    if (entityType === 'ATTACHMENT') return '#8b5cf6';
    if (action === 'CREATED') return '#22c55e';
    return '#3b82f6';
  };

  if (loading) {
    return (
      <div className="workspace">
        <div className="loading-container">
          <div className="spinner-large"></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="workspace">
        <div className="error-container">
          <p>{error}</p>
          <button className="btn-primary" onClick={loadAnalytics}>Retry</button>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  const { summary } = analytics;
  const maxArticleCount = Math.max(...analytics.articlesByCategory.map(c => c.articleCount), 1);
  const maxViewCount = Math.max(...analytics.topViewedArticles.map(a => a.viewCount), 1);
  const maxGrowthValue = Math.max(...analytics.articleGrowth.flatMap(g => [g.created, g.published]), 1);

  return (
    <div className="workspace">
      <div className="page-stack knowledge-analytics">
        <div className="page-header">
          <div className="page-header-left">
            <div className="page-header-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16M4 10h16M4 14h16M4 18h16" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <h1 className="page-header-title">Knowledge Base Analytics</h1>
              <p className="page-header-subtitle">Overview of your knowledge base performance</p>
            </div>
          </div>
          <div className="page-header-actions">
            <button className="btn-secondary" onClick={loadAnalytics}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 4v6h-6M1 20v-6h6" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Refresh
            </button>
          </div>
        </div>

      {/* Summary Stats */}
      <div className="stats-grid analytics-stats">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 6h16M4 10h16M4 14h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="stat-content">
            <span className="stat-value">{summary.totalCategories}</span>
            <span className="stat-label">Categories</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="stat-content">
            <span className="stat-value">{summary.totalArticles}</span>
            <span className="stat-label">Total Articles</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="stat-content">
            <span className="stat-value">{summary.totalAttachments}</span>
            <span className="stat-label">Attachments</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <div className="stat-content">
            <span className="stat-value">{summary.totalViews.toLocaleString()}</span>
            <span className="stat-label">Total Views</span>
          </div>
        </div>
      </div>

      {/* Article Status Summary */}
      <div className="status-summary">
        <div className="status-item published">
          <span className="status-count">{summary.publishedArticles}</span>
          <span className="status-label">Published</span>
        </div>
        <div className="status-item draft">
          <span className="status-count">{summary.draftArticles}</span>
          <span className="status-label">Drafts</span>
        </div>
        <div className="status-item archived">
          <span className="status-count">{summary.archivedArticles}</span>
          <span className="status-label">Archived</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Articles by Category - Bar Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Articles by Category</h3>
          </div>
          <div className="chart-body">
            {analytics.articlesByCategory.length > 0 ? (
              <div className="bar-chart">
                {analytics.articlesByCategory.slice(0, 8).map((category) => (
                  <div key={category.categoryId} className="bar-chart-item">
                    <div className="bar-label">
                      <span className="bar-name" title={category.categoryName}>{category.categoryName}</span>
                      <span className="bar-value">{category.articleCount}</span>
                    </div>
                    <div className="bar-track">
                      <div 
                        className="bar-fill" 
                        style={{ 
                          width: `${(category.articleCount / maxArticleCount) * 100}%`,
                          backgroundColor: 'var(--brand)'
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="chart-empty">No data</div>
            )}
          </div>
        </div>

        {/* Article Growth - Line Chart */}
        <div className="chart-card wide">
          <div className="chart-header">
            <h3>Article Growth (Last 12 Months)</h3>
            <div className="chart-legend">
              <span className="legend-item"><span className="legend-dot created"></span> Created</span>
              <span className="legend-item"><span className="legend-dot published"></span> Published</span>
            </div>
          </div>
          <div className="chart-body">
            <div className="line-chart">
              <div className="line-chart-grid">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="grid-line"></div>
                ))}
              </div>
              <div className="line-chart-area">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="line-chart-svg">
                  {/* Created line */}
                  <polyline
                    fill="none"
                    stroke="var(--brand)"
                    strokeWidth="2"
                    points={analytics.articleGrowth.map((g, i) => {
                      const x = (i / (analytics.articleGrowth.length - 1)) * 100;
                      const y = 100 - (g.created / maxGrowthValue) * 80;
                      return `${x},${y}`;
                    }).join(' ')}
                  />
                  {/* Published line */}
                  <polyline
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="2"
                    strokeDasharray="4,2"
                    points={analytics.articleGrowth.map((g, i) => {
                      const x = (i / (analytics.articleGrowth.length - 1)) * 100;
                      const y = 100 - (g.published / maxGrowthValue) * 80;
                      return `${x},${y}`;
                    }).join(' ')}
                  />
                </svg>
                <div className="line-chart-labels">
                  {analytics.articleGrowth.map((g) => (
                    <span key={g.month} className="chart-label">{g.month.split(' ')[0]}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Most Viewed Articles - Horizontal Bar Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Most Viewed Articles</h3>
          </div>
          <div className="chart-body">
            {analytics.topViewedArticles.length > 0 ? (
              <div className="bar-chart horizontal">
                {analytics.topViewedArticles.slice(0, 8).map((article, index) => (
                  <div key={article.id} className="bar-chart-item">
                    <div className="bar-label">
                      <span className="bar-rank">#{index + 1}</span>
                      <span className="bar-name" title={article.title}>{article.title}</span>
                      <span className="bar-value">{article.viewCount}</span>
                    </div>
                    <div className="bar-track">
                      <div 
                        className="bar-fill" 
                        style={{ 
                          width: `${(article.viewCount / maxViewCount) * 100}%`,
                          backgroundColor: 'var(--brand)'
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="chart-empty">No data</div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section - Recent Activity and Top Articles */}
      <div className="bottom-grid">
        {/* Recent Articles */}
        <div className="list-card">
          <div className="list-card-header">
            <h3>Recently Added Articles</h3>
          </div>
          <div className="list-card-body">
            {analytics.recentArticles.length > 0 ? (
              <div className="article-list">
                {analytics.recentArticles.map((article) => (
                  <div key={article.id} className="article-list-item">
                    <div className="article-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M14 2v6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="article-info">
                      <span className="article-title">{article.title}</span>
                      <span className="article-meta">
                        <span className="article-category">{article.categoryName}</span>
                        <span className="article-views">{article.viewCount} views</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="list-empty">No recent articles</div>
            )}
          </div>
        </div>

        {/* Recent Activity Timeline */}
        <div className="list-card">
          <div className="list-card-header">
            <h3>Recent Activity</h3>
          </div>
          <div className="list-card-body">
            {analytics.recentActivity.length > 0 ? (
              <div className="activity-timeline">
                {analytics.recentActivity.slice(0, 10).map((activity) => (
                  <div key={activity.id} className="activity-item">
                    <div 
                      className="activity-icon"
                      style={{ backgroundColor: `${getActivityColor(activity.action, activity.entityType)}15`, color: getActivityColor(activity.action, activity.entityType) }}
                    >
                      {getActivityIcon(activity.action, activity.entityType)}
                    </div>
                    <div className="activity-content">
                      <span className="activity-text">
                        {activity.action === 'CREATED' && `Created "${activity.entityName}"`}
                        {activity.action === 'UPDATED' && `Updated "${activity.entityName}"`}
                        {activity.action === 'UPLOADED' && `Uploaded "${activity.entityName}"`}
                      </span>
                      <span className="activity-time">{formatDate(activity.performedAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="list-empty">No recent activity</div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .analytics-stats {
          grid-template-columns: repeat(4, 1fr);
        }

        .stat-card {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .stat-content {
          display: flex;
          flex-direction: column;
        }

        .stat-value {
          font-size: 28px;
          font-weight: 700;
          color: var(--text);
          line-height: 1.2;
        }

        .stat-label {
          font-size: 13px;
          color: var(--muted);
          margin-top: 2px;
        }

        .status-summary {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
        }

        .status-item {
          flex: 1;
          padding: 16px;
          border-radius: 8px;
          text-align: center;
          border: 1px solid var(--line);
          background: white;
        }

        .status-item.published {
          border-left: 3px solid #22c55e;
        }

        .status-item.draft {
          border-left: 3px solid #f59e0b;
        }

        .status-item.archived {
          border-left: 3px solid #6b7280;
        }

        .status-count {
          display: block;
          font-size: 24px;
          font-weight: 700;
          color: var(--text);
        }

        .status-label {
          font-size: 12px;
          color: var(--muted);
        }

        .charts-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
          margin-bottom: 24px;
        }

        .chart-card {
          background: white;
          border: 1px solid var(--line);
          border-radius: 12px;
          overflow: hidden;
        }

        .chart-card.wide {
          grid-column: span 2;
        }

        .chart-header {
          padding: 16px 20px;
          border-bottom: 1px solid var(--line);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .chart-header h3 {
          font-size: 14px;
          font-weight: 600;
          color: var(--text);
          margin: 0;
        }

        .chart-legend {
          display: flex;
          gap: 16px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--muted);
        }

        .legend-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .legend-dot.created {
          background: var(--brand);
        }

        .legend-dot.published {
          background: #22c55e;
        }

        .chart-body {
          padding: 20px;
        }

        .chart-empty {
          text-align: center;
          padding: 40px;
          color: var(--muted);
          font-size: 14px;
        }

        .bar-chart {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .bar-chart-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .bar-label {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
        }

        .bar-name {
          color: var(--text);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 200px;
        }

        .bar-rank {
          color: var(--muted);
          font-size: 11px;
          min-width: 24px;
        }

        .bar-value {
          color: var(--muted);
          font-weight: 500;
        }

        .bar-track {
          height: 8px;
          background: var(--panel-soft);
          border-radius: 4px;
          overflow: hidden;
        }

        .bar-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .bar-chart.horizontal .bar-chart-item {
          gap: 6px;
        }

        .bar-chart.horizontal .bar-label {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .bar-chart.horizontal .bar-name {
          flex: 1;
          max-width: none;
        }

        .line-chart {
          position: relative;
          height: 200px;
        }

        .line-chart-grid {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          pointer-events: none;
        }

        .grid-line {
          border-bottom: 1px dashed var(--line);
        }

        .line-chart-area {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
        }

        .line-chart-svg {
          flex: 1;
          width: 100%;
        }

        .line-chart-labels {
          display: flex;
          justify-content: space-between;
          padding-top: 8px;
        }

        .chart-label {
          font-size: 10px;
          color: var(--muted);
          text-align: center;
          flex: 1;
        }

        .bottom-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }

        .list-card {
          background: white;
          border: 1px solid var(--line);
          border-radius: 12px;
          overflow: hidden;
        }

        .list-card-header {
          padding: 16px 20px;
          border-bottom: 1px solid var(--line);
        }

        .list-card-header h3 {
          font-size: 14px;
          font-weight: 600;
          color: var(--text);
          margin: 0;
        }

        .list-card-body {
          padding: 16px 20px;
        }

        .list-empty {
          text-align: center;
          padding: 40px;
          color: var(--muted);
          font-size: 14px;
        }

        .article-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .article-list-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px;
          background: var(--panel-soft);
          border-radius: 8px;
          transition: background 0.15s;
        }

        .article-list-item:hover {
          background: var(--line);
        }

        .article-icon {
          width: 36px;
          height: 36px;
          background: white;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--brand);
          flex-shrink: 0;
        }

        .article-info {
          flex: 1;
          min-width: 0;
        }

        .article-title {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: var(--text);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .article-meta {
          display: flex;
          gap: 12px;
          margin-top: 4px;
          font-size: 11px;
          color: var(--muted);
        }

        .article-category {
          background: var(--line);
          padding: 2px 6px;
          border-radius: 4px;
        }

        .activity-timeline {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .activity-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .activity-icon {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .activity-content {
          flex: 1;
          min-width: 0;
        }

        .activity-text {
          display: block;
          font-size: 13px;
          color: var(--text);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .activity-time {
          font-size: 11px;
          color: var(--muted);
        }

        .btn-secondary {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: white;
          border: 1px solid var(--line);
          border-radius: 8px;
          color: var(--text);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
        }

        .btn-secondary:hover {
          background: var(--panel-soft);
          border-color: var(--brand);
        }

        .loading-container,
        .error-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px;
          text-align: center;
        }

        .spinner-large {
          width: 40px;
          height: 40px;
          border: 3px solid var(--line);
          border-top-color: var(--brand);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .error-container p {
          color: var(--error);
          margin-bottom: 16px;
        }

        @media (max-width: 1024px) {
          .analytics-stats {
            grid-template-columns: repeat(2, 1fr);
          }

          .charts-grid {
            grid-template-columns: 1fr;
          }

          .chart-card.wide {
            grid-column: span 1;
          }

          .bottom-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .analytics-stats {
            grid-template-columns: 1fr;
          }

          .status-summary {
            flex-direction: column;
          }
        }
      `}</style>
      </div>
    </div>
  );
}
