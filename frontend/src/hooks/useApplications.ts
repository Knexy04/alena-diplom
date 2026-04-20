import { useState, useEffect, useCallback } from 'react';
import { notification } from 'antd';
import { applicationsService } from '../services/applications.service';
import { IApplication } from '../types/application';

interface UseApplicationsParams {
  page?: number;
  limit?: number;
  status?: string;
  sessionId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: string;
}

export const useApplications = (params: UseApplicationsParams = {}) => {
  const [applications, setApplications] = useState<IApplication[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await applicationsService.getAll(params as Record<string, string | number | undefined>);
      const data = response.data.data;
      setApplications(data.items);
      setTotal(data.total);
    } catch {
      notification.error({ message: 'Ошибка загрузки заявок' });
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  return { applications, total, loading, refetch: fetchApplications };
};
