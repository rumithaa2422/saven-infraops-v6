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
      <div className="bg-white rounded-xl border border-slate-200/60 p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_2px_8px_rgba(15,23,42,0.04)] hover:shadow-[0_2px_4px_rgba(15,23,42,0.06),0_8px_20px_rgba(99,102,241,0.09)] hover:-translate-y-0.5 transition-all duration-200">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-1.5 rounded-lg bg-purple-100">
            <BookOpen className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <h2 className="text-[15px] font-semibold text-slate-900">Knowledge Hub</h2>
            <p className="text-xs text-slate-500">Recent articles and resources</p>
          </div>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-10 bg-slate-50 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_2px_8px_rgba(15,23,42,0.04)] hover:shadow-[0_2px_4px_rgba(15,23,42,0.06),0_8px_20px_rgba(99,102,241,0.09)] hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-sm shadow-emerald-500/20">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-[15px] font-semibold text-slate-900">Knowledge Hub</h2>
            <p className="text-xs text-slate-500">Recent articles and resources</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/knowledge-base')}
          className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 font-medium transition-colors"
        >
          View All
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Summary Stats */}
      {analytics && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="flex flex-col items-center p-2.5 bg-slate-50 rounded-lg">
            <div className="p-1.5 rounded-md bg-white shadow-sm mb-1.5">
              <FileText className="w-3.5 h-3.5 text-purple-600" />
            </div>
            <p className="text-lg font-bold text-slate-900">{analytics.totalArticles}</p>
            <p className="text-[11px] text-slate-500 font-medium">Articles</p>
          </div>
          <div className="flex flex-col items-center p-2.5 bg-emerald-50 rounded-lg">
            <div className="p-1.5 rounded-md bg-white shadow-sm mb-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <p className="text-lg font-bold text-emerald-600">{analytics.publishedArticles}</p>
            <p className="text-[11px] text-emerald-600 font-medium">Published</p>
          </div>
          <div className="flex flex-col items-center p-2.5 bg-slate-50 rounded-lg">
            <div className="p-1.5 rounded-md bg-white shadow-sm mb-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-600" />
            </div>
            <p className="text-lg font-bold text-slate-900">{analytics.categories}</p>
            <p className="text-[11px] text-slate-500 font-medium">Categories</p>
          </div>
        </div>
      )}

      {/* Article List */}
      {articles.length > 0 ? (
        <div className="space-y-1.5">
          {articles.map((article) => (
            <button
              key={article.id}
              onClick={() => navigate(`/knowledge-base?article=${article.id}`)}
              className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 transition-colors text-left group border border-transparent hover:border-slate-200"
            >
              <div className="p-1.5 rounded-md bg-purple-50 group-hover:bg-purple-100 transition-colors">
                <BookOpen className="w-3.5 h-3.5 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-slate-900 truncate group-hover:text-purple-600 transition-colors">
                  {article.title}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                  <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[11px]">{article.category || 'General'}</span>
                  <span>•</span>
                  <span>{formatDate(article.createdAt)}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-slate-400 group-hover:text-purple-500 transition-colors">
                <Eye className="w-3 h-3" />
                <span className="text-[11px] font-medium">{article.viewCount || 0}</span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-6">
          <div className="w-10 h-10 rounded-lg bg-slate-50 mx-auto mb-2 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-slate-300" />
          </div>
          <p className="text-sm font-medium text-slate-700">No articles yet</p>
          <p className="text-xs text-slate-400 mt-1">Browse the knowledge base to get started</p>
          <button
            onClick={() => navigate('/knowledge-base')}
            className="mt-2 text-xs text-purple-600 hover:text-purple-700 font-medium"
          >
            Browse Knowledge Base
          </button>
        </div>
      )}
    </div>
  );
}
