import api from './api';

export interface ICreateSessionRequest {
  title: string;
  country: string;
  startDate: string;
  endDate: string;
  capacity: number;
  price: number;
  isActive?: boolean;
}

export type IUpdateSessionRequest = Partial<ICreateSessionRequest>;

export const sessionsService = {
  getAll: () => api.get('/sessions'),
  getAllForManager: () => api.get('/sessions/all'),
  getById: (id: string) => api.get(`/sessions/${id}`),
  create: (data: ICreateSessionRequest) => api.post('/sessions', data),
  update: (id: string, data: IUpdateSessionRequest) => api.patch(`/sessions/${id}`, data),
  remove: (id: string) => api.delete(`/sessions/${id}`),
  exportXlsx: (id: string) =>
    api.get(`/sessions/${id}/export.xlsx`, { responseType: 'blob' }),
};
