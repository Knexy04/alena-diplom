import dayjs from 'dayjs';
import { DATE_FORMAT, DATETIME_FORMAT } from './constants';

export const formatDate = (date: string) => dayjs(date).format(DATE_FORMAT);
export const formatDateTime = (date: string) => dayjs(date).format(DATETIME_FORMAT);

export const formatPrice = (price: number) =>
  new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
  }).format(price);

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
};

export const getFullName = (user: { firstName: string; lastName: string; patronymic?: string }) =>
  `${user.lastName} ${user.firstName}${user.patronymic ? ' ' + user.patronymic : ''}`;
