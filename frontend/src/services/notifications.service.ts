import api from './api';

export const notificationsService = {
  getAll: (limit = 20) => api.get('/notifications', { params: { limit } }),

  getUnreadCount: () => api.get('/notifications/unread-count'),

  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),

  markAllAsRead: () => api.patch('/notifications/read-all'),

  broadcast: (sessionId: string, title: string, body: string) =>
    api.post('/notifications/broadcast', { sessionId, title, body }),

  getRecipientCount: (sessionId: string) =>
    api.get('/applications', { params: { sessionId, limit: 1 } }),
};
