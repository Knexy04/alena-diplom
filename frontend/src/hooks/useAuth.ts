import { useNavigate } from 'react-router-dom';
import { notification } from 'antd';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/auth.service';
import { ILoginRequest, IRegisterRequest, UserRole } from '../types/user';

export const useAuth = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, setAuth, logout: storeLogout } = useAuthStore();

  const login = async (data: ILoginRequest) => {
    try {
      const response = await authService.login(data);
      const { accessToken, refreshToken, user: userData } = response.data.data;

      setAuth(userData, accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      notification.success({ message: 'Добро пожаловать!' });

      if (userData.role === UserRole.MANAGER) {
        navigate('/manager/dashboard');
      } else {
        navigate('/parent/dashboard');
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      notification.error({
        message: 'Ошибка входа',
        description: err.response?.data?.message || 'Неверный email или пароль',
      });
      throw error;
    }
  };

  const register = async (data: IRegisterRequest) => {
    try {
      const response = await authService.register(data);
      const { accessToken, refreshToken, user: userData } = response.data.data;

      setAuth(userData, accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      notification.success({ message: 'Регистрация прошла успешно!' });
      navigate('/parent/dashboard');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      notification.error({
        message: 'Ошибка регистрации',
        description: err.response?.data?.message || 'Попробуйте ещё раз',
      });
      throw error;
    }
  };

  const logout = () => {
    storeLogout();
    navigate('/login');
  };

  return { user, isAuthenticated, login, register, logout };
};
