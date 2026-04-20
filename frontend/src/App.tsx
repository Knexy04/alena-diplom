import React from 'react';
import { ConfigProvider } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import AppRouter from './routes';
import 'dayjs/locale/ru';
import dayjs from 'dayjs';

dayjs.locale('ru');

const App: React.FC = () => {
  return (
    <ConfigProvider
      locale={ruRU}
      theme={{
        token: {
          colorPrimary: '#F37022',
          colorSuccess: '#10b981',
          colorWarning: '#f59e0b',
          colorError: '#ef4444',
          colorInfo: '#14B8A6',
          borderRadius: 8,
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          fontSize: 14,
          colorBgContainer: '#ffffff',
          colorBgLayout: '#f1f5f9',
          colorBorder: '#e2e8f0',
          colorText: '#1e293b',
          colorTextSecondary: '#64748b',
          controlHeight: 40,
        },
        components: {
          Button: {
            borderRadius: 8,
            controlHeight: 40,
            fontWeight: 500,
          },
          Input: {
            borderRadius: 8,
            controlHeight: 40,
          },
          Select: {
            borderRadius: 8,
            controlHeight: 40,
          },
          Card: {
            borderRadiusLG: 12,
          },
          Table: {
            borderRadius: 12,
            headerBg: '#f8fafc',
            headerColor: '#64748b',
          },
          Tag: {
            borderRadiusSM: 6,
          },
          Tabs: {
            itemSelectedColor: '#F37022',
            inkBarColor: '#F37022',
          },
          Steps: {
            colorPrimary: '#F37022',
          },
          Notification: {
            borderRadiusLG: 12,
          },
        },
      }}
    >
      <AppRouter />
    </ConfigProvider>
  );
};

export default App;
