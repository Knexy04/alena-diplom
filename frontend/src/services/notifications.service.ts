import api from './api';

export const notificationsService = {
  getAll: (limit = 20) => api.get('/notifications', { params: { limit } }),

  getUnreadCount: () => api.get('/notifications/unread-count'),

  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),

  markAllAsRead: () => api.patch('/notifications/read-all'),

  broadcast: (sessionId: string, title: string, body: string, file?: File | null) => {
    const formData = new FormData();
    formData.append('sessionId', sessionId);
    formData.append('title', title);
    formData.append('body', body);
    if (file) formData.append('file', file);
    return api.post('/notifications/broadcast', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getRecipientCount: (sessionId: string) =>
    api.get('/applications', { params: { sessionId, limit: 1 } }),
};
