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
