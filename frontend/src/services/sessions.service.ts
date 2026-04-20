import api from './api';

export const sessionsService = {
  getAll: () => api.get('/sessions'),
  getById: (id: string) => api.get(`/sessions/${id}`),
};
