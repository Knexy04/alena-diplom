import api from './api';
import { ICreateApplicationRequest, IUpdateApplicationRequest } from '../types/application';

export const applicationsService = {
  getAll: (params: Record<string, string | number | undefined>) =>
    api.get('/applications', { params }),

  getById: (id: string) => api.get(`/applications/${id}`),

  create: (data: ICreateApplicationRequest) => api.post('/applications', data),

  update: (id: string, data: IUpdateApplicationRequest) =>
    api.patch(`/applications/${id}`, data),

  remove: (id: string) => api.delete(`/applications/${id}`),
};
