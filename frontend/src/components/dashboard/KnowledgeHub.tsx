import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../auth/AuthContext';
import { BookOpen, Eye, TrendingUp, ArrowRight } from 'lucide-react';

interface KbArticle {
  id: string;
  title: string;
  category: string;
  viewCount: number;
  status: string;
  createdAt: string;
  authorName?: string;
}

interface KbAnalytics {
  totalArticles: number;
  publishedArticles: number;
  categories: number;
}

export function KnowledgeHub() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [articles, setArticles] = useState<KbArticle[]>([]);
  const [analytics, setAnalytics] = useState<KbAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canViewKB = hasPermission('kb:view');

  const fetchKnowledgeData = useCallback(async () => {
    if (!canViewKB) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [analyticsRes, articlesRes] = await Promise.all([
        api.get('/knowledge/analytics').catch(() => ({ data: null })),
        api.get('/knowledge/articles', { params: { limit: 5, sort: 'createdAt:desc' } }).catch(() => ({ data: { articles: [] } }))
      ]);

      if (analyticsRes.data) {
        setAnalytics({
          totalArticles: analyticsRes.data.summary?.totalArticles || 0,
          publishedArticles: analyticsRes.data.summary?.publishedArticles || 0,
          categories: analyticsRes.data.summary?.totalCategories || 0
        });
      }

      // Try to get recent articles from articles endpoint or use default
      if (articlesRes.data?.articles) {
        setArticles(articlesRes.data.articles.slice(0, 5));
      }
    } catch (err) {
      console.error('Failed to fetch knowledge data:', err);
      // Don't show error if KB is not available
      setError(null);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, [canViewKB]);

  useEffect(() => {
    fetchKnowledgeData();
  }, [fetchKnowledgeData]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (!canViewKB) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Knowledge Hub</h2>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-brand-500" />
          <h2 className="text-sm font-semibold text-slate-900">Knowledge Hub</h2>
        </div>
        <button
          onClick={() => navigate('/knowledge-base')}
          className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium"
        >
          View All
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Summary Stats */}
      {analytics && (
        <div className="flex gap-4 mb-4 p-3 bg-slate-50 rounded-lg">
          <div className="text-center">
            <p className="text-lg font-semibold text-slate-900">{analytics.totalArticles}</p>
            <p className="text-xs text-slate-500">Articles</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-emerald-600">{analytics.publishedArticles}</p>
            <p className="text-xs text-slate-500">Published</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-brand-600">{analytics.categories}</p>
            <p className="text-xs text-slate-500">Categories</p>
          </div>
        </div>
      )}

      {/* Article List */}
      {articles.length > 0 ? (
        <div className="space-y-2">
          {articles.map((article) => (
            <button
              key={article.id}
              onClick={() => navigate(`/knowledge-base?article=${article.id}`)}
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors text-left"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{article.title}</p>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                  <span>{article.category || 'General'}</span>
                  <span>•</span>
                  <span>{formatDate(article.createdAt)}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-slate-400">
                <Eye className="w-3.5 h-3.5" />
                <span className="text-xs">{article.viewCount || 0}</span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-4">
          <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">No articles yet</p>
          <button
            onClick={() => navigate('/knowledge-base')}
            className="mt-2 text-xs text-brand-600 hover:text-brand-700"
          >
            Browse Knowledge Base
          </button>
        </div>
      )}
    </div>
  );
}
