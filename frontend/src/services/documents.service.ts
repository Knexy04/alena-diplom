import api from './api';
import { DocumentType } from '../types/document';

export const documentsService = {
  upload: (applicationId: string, file: File, type: DocumentType) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('applicationId', applicationId);
    formData.append('type', type);
    return api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getByApplication: (applicationId: string) =>
    api.get(`/applications/${applicationId}/documents`),

  download: (id: string) =>
    api.get(`/documents/${id}/download`, { responseType: 'blob' }),

  remove: (id: string) => api.delete(`/documents/${id}`),
};
