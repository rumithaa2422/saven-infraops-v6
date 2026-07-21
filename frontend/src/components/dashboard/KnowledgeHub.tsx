import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../auth/AuthContext';
import { BookOpen, Eye, TrendingUp, ArrowRight, FileText, Layers } from 'lucide-react';

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

      if (articlesRes.data?.articles) {
        setArticles(articlesRes.data.articles.slice(0, 5));
      }
    } catch (err) {
      console.error('Failed to fetch knowledge data:', err);
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
      <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-xl bg-purple-100">
            <BookOpen className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Knowledge Hub</h2>
            <p className="text-sm text-slate-500">Recent articles and resources</p>
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-14 bg-slate-50 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-sm shadow-emerald-500/20">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Knowledge Hub</h2>
            <p className="text-sm text-slate-500">Recent articles and resources</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/knowledge-base')}
          className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors"
        >
          View All
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Summary Stats */}
      {analytics && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="flex flex-col items-center p-3 bg-slate-50 rounded-xl">
            <div className="p-2 rounded-lg bg-white shadow-sm mb-2">
              <FileText className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-xl font-bold text-slate-900">{analytics.totalArticles}</p>
            <p className="text-xs text-slate-500 font-medium">Articles</p>
          </div>
          <div className="flex flex-col items-center p-3 bg-emerald-50 rounded-xl">
            <div className="p-2 rounded-lg bg-white shadow-sm mb-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-xl font-bold text-emerald-600">{analytics.publishedArticles}</p>
            <p className="text-xs text-emerald-600 font-medium">Published</p>
          </div>
          <div className="flex flex-col items-center p-3 bg-slate-50 rounded-xl">
            <div className="p-2 rounded-lg bg-white shadow-sm mb-2">
              <Layers className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-xl font-bold text-slate-900">{analytics.categories}</p>
            <p className="text-xs text-slate-500 font-medium">Categories</p>
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
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-left group border border-transparent hover:border-slate-200"
            >
              <div className="p-2 rounded-lg bg-purple-50 group-hover:bg-purple-100 transition-colors">
                <BookOpen className="w-4 h-4 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-purple-600 transition-colors">
                  {article.title}
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                  <span className="px-1.5 py-0.5 bg-slate-100 rounded text-xs">{article.category || 'General'}</span>
                  <span>•</span>
                  <span>{formatDate(article.createdAt)}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-slate-400 group-hover:text-purple-500 transition-colors">
                <Eye className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">{article.viewCount || 0}</span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 mx-auto mb-3 flex items-center justify-center">
            <BookOpen className="w-7 h-7 text-slate-300" />
          </div>
          <p className="text-sm font-medium text-slate-700">No articles yet</p>
          <p className="text-xs text-slate-400 mt-1">Browse the knowledge base to get started</p>
          <button
            onClick={() => navigate('/knowledge-base')}
            className="mt-3 text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            Browse Knowledge Base
          </button>
        </div>
      )}
    </div>
  );
}
