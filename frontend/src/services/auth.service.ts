import api from './api';
import { ILoginRequest, IRegisterRequest } from '../types/user';

export const authService = {
  login: (data: ILoginRequest) => api.post('/auth/login', data),
  register: (data: IRegisterRequest) => api.post('/auth/register', data),
  refresh: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  resetPassword: (data: { email: string; code: string; newPassword: string }) =>
    api.post('/auth/reset-password', data),
};
