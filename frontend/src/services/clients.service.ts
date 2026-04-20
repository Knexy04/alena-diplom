import api from './api';
import { ICreateChildRequest, IUpdateClientRequest } from '../types/client';

export const clientsService = {
  getAll: (search?: string) => api.get('/clients', { params: { search } }),

  getMyChildren: () => api.get('/clients/me/children'),

  getById: (id: string) => api.get(`/clients/${id}`),

  update: (id: string, data: IUpdateClientRequest) => api.patch(`/clients/${id}`, data),

  remove: (id: string) => api.delete(`/clients/${id}`),

  addChild: (parentId: string, data: ICreateChildRequest) =>
    api.post(`/clients/${parentId}/children`, data),

  updateChild: (childId: string, data: Partial<ICreateChildRequest>) =>
    api.patch(`/children/${childId}`, data),
};
