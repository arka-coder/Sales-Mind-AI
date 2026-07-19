import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
type LeadPayload = Record<string, unknown>;

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

// ============================================
// CHAT API
// ============================================
export const chatAPI = {
  sendMessage: (data: {
    message: string;
    conversation_id?: string;
    lead_id?: string;
    stream?: boolean;
  }) => api.post('/api/chat/message', data),

  getConversations: (limit = 20) =>
    api.get(`/api/chat/conversations?limit=${limit}`),

  getMessages: (conversationId: string) =>
    api.get(`/api/chat/conversations/${conversationId}/messages`),

  deleteConversation: (id: string) =>
    api.delete(`/api/chat/conversations/${id}`),

  completeConversation: (id: string) =>
    api.post(`/api/chat/conversations/${id}/complete`),
};

// ============================================
// LEADS API
// ============================================
export const leadsAPI = {
  getLeads: (params?: { category?: string; status?: string; search?: string; limit?: number }) =>
    api.get('/api/leads', { params }),

  getLead: (id: string) => api.get(`/api/leads/${id}`),

  createLead: (data: LeadPayload) => api.post('/api/leads', data),

  updateLead: (id: string, data: LeadPayload) => api.put(`/api/leads/${id}`, data),

  deleteLead: (id: string) => api.delete(`/api/leads/${id}`),

  rescoreLead: (id: string) => api.post(`/api/leads/${id}/rescore`),

  uploadCSV: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/leads/upload/csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getLeadConversations: (id: string) =>
    api.get(`/api/leads/${id}/conversations`),
};

// ============================================
// ANALYTICS API
// ============================================
export const analyticsAPI = {
  getDashboard: () => api.get('/api/analytics/dashboard'),
  getFunnel: () => api.get('/api/analytics/funnel'),
  getSentimentTrends: () => api.get('/api/analytics/sentiment-trends'),
  getConversationInsights: (conversationId: string) =>
    api.get(`/api/analytics/insights/${conversationId}`),
};

// ============================================
// KNOWLEDGE API
// ============================================
export const knowledgeAPI = {
  getDocuments: () => api.get('/api/knowledge/documents'),
  getStats: () => api.get('/api/knowledge/stats'),

  uploadDocument: (file: File, name?: string, description?: string, tags?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (name) formData.append('name', name);
    if (description) formData.append('description', description);
    if (tags) formData.append('tags', tags);
    return api.post('/api/knowledge/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  deleteDocument: (id: string) => api.delete(`/api/knowledge/documents/${id}`),

  query: (query: string, n_results = 5) =>
    api.post('/api/knowledge/query', { query, n_results }),
};

// ============================================
// FOLLOW-UP API
// ============================================
export const followupAPI = {
  generate: (data: {
    lead_id?: string;
    conversation_id?: string;
    followup_type: string;
    tone?: string;
    additional_context?: string;
    recipient_email?: string;
  }) => api.post('/api/followup/generate', data),

  send: (followupId: string, recipientEmail?: string) =>
    api.post(`/api/followup/send/${followupId}`, null, {
      params: { recipient_email: recipientEmail },
    }),

  getFollowups: (params?: { lead_id?: string; status?: string }) =>
    api.get('/api/followup', { params }),

  delete: (id: string) => api.delete(`/api/followup/${id}`),
};

// ============================================
// VOICE API
// ============================================
export const voiceAPI = {
  transcribe: (audioBlob: Blob, language = 'en') => {
    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.webm');
    formData.append('language', language);
    return api.post('/api/voice/transcribe', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  synthesize: (text: string, voiceId?: string) =>
    api.post('/api/voice/synthesize', { text, voice_id: voiceId }, {
      responseType: 'arraybuffer',
    }),

  getVoices: () => api.get('/api/voice/voices'),

  voiceChat: (audioBlob: Blob, conversationId?: string, leadId?: string) => {
    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.webm');
    return api.post('/api/voice/chat', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      params: { conversation_id: conversationId, lead_id: leadId },
      responseType: 'arraybuffer',
    });
  },
};

// ============================================
// HEALTH CHECK
// ============================================
export const healthAPI = {
  check: () => api.get('/api/health'),
};
