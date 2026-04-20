import React, { useState, useEffect } from 'react';
import { Layout, Avatar, Dropdown, Badge, Button, List, Popover, Drawer, Typography, Empty } from 'antd';
import {
  HomeOutlined,
  FolderOutlined,
  BellOutlined,
  LogoutOutlined,
  UserOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { notificationsService } from '../services/notifications.service';
import { formatDateTime } from '../utils/helpers';

const { Content } = Layout;
const { Text } = Typography;

interface INotification {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

const navItems = [
  { path: '/parent/dashboard', icon: <HomeOutlined />, label: 'Главная' },
  { path: '/parent/documents', icon: <FolderOutlined />, label: 'Документы' },
  { path: '/parent/chat', icon: <MessageOutlined />, label: 'Чат' },
];

const useIsMobile = (breakpoint = 768) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= breakpoint);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= breakpoint);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [breakpoint]);
  return isMobile;
};

const ParentLayout: React.FC = () => {
  const isMobile = useIsMobile(768);
  const isTablet = useIsMobile(992);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);

  const fetchUnread = async () => {
    try {
      const res = await notificationsService.getUnreadCount();
      setUnreadCount(res.data.data.count);
    } catch { /* ignore */ }
  };

  const fetchNotifications = async () => {
    try {
      const res = await notificationsService.getAll(10);
      setNotifications(res.data.data);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleBellClick = () => {
    fetchNotifications();
    setNotifOpen(!notifOpen);
  };

  const handleMarkAllRead = async () => {
    await notificationsService.markAllAsRead();
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const notificationsList = (
    <>
      {notifications.length === 0 ? (
        <Empty description="Нет уведомлений" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: 32 }} />
      ) : (
        <List
          dataSource={notifications}
          renderItem={(item) => (
            <div className={`notif-item ${!item.isRead ? 'notif-item-unread' : ''}`}>
              <Text style={{ fontWeight: item.isRead ? 400 : 600, fontSize: 13 }}>{item.title}</Text>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{item.body}</div>
              <Text type="secondary" style={{ fontSize: 11 }}>{formatDateTime(item.createdAt)}</Text>
            </div>
          )}
        />
      )}
    </>
  );

  const notificationsContent = (
    <div className="notif-popover">
      <div className="notif-header">
        <Text strong style={{ fontSize: 15 }}>Уведомления</Text>
        {unreadCount > 0 && (
          <Button type="link" size="small" onClick={handleMarkAllRead}>Прочитать все</Button>
        )}
      </div>
      {notificationsList}
    </div>
  );

  const userMenuItems = [
    { key: 'logout', icon: <LogoutOutlined />, label: 'Выйти', onClick: logout },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <header className="parent-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
            onClick={() => navigate('/parent/dashboard')}
          >
            <div className="sidebar-logo-icon" style={{ width: 34, height: 34, fontSize: 14, borderRadius: 9 }}>
              JC
            </div>
            <span style={{ color: '#fff', fontSize: 17, fontWeight: 700, letterSpacing: '-0.3px' }}>
              Junior Camp
            </span>
          </div>

          <nav className="parent-nav">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <div
                  key={item.path}
                  className={`parent-nav-item ${isActive ? 'parent-nav-item-active' : ''}`}
                  onClick={() => navigate(item.path)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </div>
              );
            })}
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: isTablet ? 10 : 16 }}>
          {isTablet ? (
            <>
              <Badge count={unreadCount} size="small" offset={[-2, 2]}>
                <div className="header-bell" onClick={handleBellClick} style={{ background: 'rgba(255,255,255,0.12)' }}>
                  <BellOutlined style={{ fontSize: 18, color: '#fff' }} />
                </div>
              </Badge>
              <Drawer
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Уведомления</span>
                    {unreadCount > 0 && (
                      <Button type="link" size="small" onClick={handleMarkAllRead}>Прочитать все</Button>
                    )}
                  </div>
                }
                placement="right"
                open={notifOpen}
                onClose={() => setNotifOpen(false)}
                width={Math.min(340, window.innerWidth - 40)}
                styles={{ body: { padding: 0 } }}
              >
                {notificationsList}
              </Drawer>
            </>
          ) : (
            <Popover
              content={notificationsContent}
              trigger="click"
              open={notifOpen}
              onOpenChange={setNotifOpen}
              placement="bottomRight"
            >
              <Badge count={unreadCount} size="small" offset={[-2, 2]}>
                <div className="header-bell" onClick={handleBellClick} style={{ background: 'rgba(255,255,255,0.12)' }}>
                  <BellOutlined style={{ fontSize: 18, color: '#fff' }} />
                </div>
              </Badge>
            </Popover>
          )}
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar
                size={isTablet ? 32 : 36}
                style={{ background: 'linear-gradient(135deg, #818cf8, #06b6d4)' }}
                icon={<UserOutlined />}
              />
              {!isTablet && (
                <span style={{ color: '#fff', fontWeight: 500, fontSize: 14 }}>
                  {user?.firstName} {user?.lastName}
                </span>
              )}
            </div>
          </Dropdown>
        </div>
      </header>
      <Content className={`page-content ${isMobile ? 'parent-page-content' : ''}`}>
        <div className="fade-in">
          <Outlet />
        </div>
      </Content>

      {/* Mobile bottom tab navigation */}
      {isMobile && (
        <div className="parent-nav-mobile">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <div
                key={item.path}
                className={`parent-nav-mobile-item ${isActive ? 'parent-nav-mobile-item-active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                {item.icon}
                <span>{item.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
};

export default ParentLayout;
