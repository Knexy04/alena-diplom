import api from './api';
import { ILoginRequest, IRegisterRequest } from '../types/user';

export const authService = {
  login: (data: ILoginRequest) => api.post('/auth/login', data),
  register: (data: IRegisterRequest) => api.post('/auth/register', data),
  refresh: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),
};
