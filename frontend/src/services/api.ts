import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000
});

export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

// ============================================================
// Knowledge Base Analytics API
// ============================================================

export interface KbSummary {
  totalCategories: number;
  totalArticles: number;
  totalAttachments: number;
  totalViews: number;
  publishedArticles: number;
  draftArticles: number;
  archivedArticles: number;
}

export interface CategoryArticleCount {
  categoryId: string;
  categoryName: string;
  articleCount: number;
}

export interface MonthlyArticleGrowth {
  month: string;
  created: number;
  published: number;
}

export interface TopArticle {
  id: string;
  title: string;
  viewCount: number;
  categoryName: string;
}

export interface ActivityItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  entityName: string;
  performedBy: string | null;
  performedAt: string;
  metadata?: Record<string, unknown>;
}

export interface KbAnalytics {
  summary: KbSummary;
  articlesByCategory: CategoryArticleCount[];
  articleGrowth: MonthlyArticleGrowth[];
  topViewedArticles: TopArticle[];
  recentArticles: TopArticle[];
  recentActivity: ActivityItem[];
}

export const knowledgeAnalyticsApi = {
  /**
   * Get all KB analytics
   */
  getAnalytics: async (): Promise<KbAnalytics> => {
    const response = await api.get<KbAnalytics>('/knowledge/analytics');
    return response.data;
  },

  /**
   * Get attachment statistics
   */
  getAttachmentStats: async (): Promise<{ total: number; byType: Record<string, number> }> => {
    const response = await api.get('/knowledge/analytics/attachments');
    return response.data;
  }
};

// ============================================================
// Knowledge Base Attachment API
// ============================================================

export interface Attachment {
  id: string;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  uploadedBy: string | null;
  uploadedAt: string;
}

export interface AttachmentsResponse {
  articleId: string;
  articleTitle: string;
  attachments: Attachment[];
  count: number;
}

export const knowledgeAttachmentApi = {
  /**
   * List all attachments for an article
   */
  list: async (articleId: string): Promise<AttachmentsResponse> => {
    const response = await api.get<AttachmentsResponse>(`/knowledge/articles/${articleId}/attachments`);
    return response.data;
  },

  /**
   * Upload attachment(s) to an article
   */
  upload: async (articleId: string, files: File[]): Promise<{ message: string; attachments: Attachment[] }> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    const response = await api.post(`/knowledge/articles/${articleId}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  /**
   * Get download URL for an attachment
   */
  getDownloadUrl: (attachmentId: string): string => {
    return `${API_BASE_URL}/knowledge/attachments/${attachmentId}/download`;
  },

  /**
   * Delete an attachment
   */
  delete: async (attachmentId: string): Promise<void> => {
    await api.delete(`/knowledge/attachments/${attachmentId}`);
  }
};
