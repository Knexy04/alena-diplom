import React, { useState, useEffect, useCallback } from 'react';
import { Layout, Avatar, Dropdown, Badge, Button, List, Popover, Drawer, Typography, Empty } from 'antd';
import {
  DashboardOutlined,
  FileTextOutlined,
  TeamOutlined,
  MessageOutlined,
  NotificationOutlined,
  BellOutlined,
  LogoutOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { notificationsService } from '../services/notifications.service';
import { formatDateTime } from '../utils/helpers';

const { Sider, Content } = Layout;
const { Text } = Typography;

interface INotification {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

const sidebarItems = [
  { path: '/manager/dashboard', icon: <DashboardOutlined />, label: 'Дашборд' },
  { path: '/manager/applications', icon: <FileTextOutlined />, label: 'Заявки' },
  { path: '/manager/clients', icon: <TeamOutlined />, label: 'Клиенты' },
  { path: '/manager/chat', icon: <MessageOutlined />, label: 'Чат' },
  { path: '/manager/broadcast', icon: <NotificationOutlined />, label: 'Рассылка' },
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

const ManagerLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile(768);
  const isTablet = useIsMobile(992);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

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
      {/* Mobile overlay */}
      {isMobile && (
        <div
          className={`mobile-overlay ${mobileMenuOpen ? 'active' : ''}`}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      <Sider
        trigger={null}
        collapsible
        collapsed={isMobile ? false : collapsed}
        collapsedWidth={isMobile ? 240 : 80}
        width={240}
        className={`manager-sider ${isMobile && mobileMenuOpen ? 'mobile-open' : ''}`}
      >
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">JC</div>
          {(!collapsed || isMobile) && <span className="sidebar-logo-text">Junior Camp</span>}
        </div>
        <nav style={{ padding: 8 }}>
          {sidebarItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <div
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`sidebar-item ${isActive ? 'sidebar-item-active' : ''}`}
              >
                <span className="sidebar-item-icon">{item.icon}</span>
                {(!collapsed || isMobile) && <span>{item.label}</span>}
              </div>
            );
          })}
        </nav>
      </Sider>
      <Layout>
        <header className="manager-header">
          {isMobile ? (
            <Button
              type="text"
              className="mobile-menu-btn"
              icon={<MenuOutlined />}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{ fontSize: 18, color: '#64748b' }}
            />
          ) : (
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: 18, color: '#64748b' }}
            />
          )}
          <div className="header-right">
            {isTablet ? (
              <>
                <Badge count={unreadCount} size="small" offset={[-2, 2]}>
                  <div className="header-bell" onClick={handleBellClick}>
                    <BellOutlined style={{ fontSize: 18, color: '#64748b' }} />
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
                  <div className="header-bell" onClick={handleBellClick}>
                    <BellOutlined style={{ fontSize: 18, color: '#64748b' }} />
                  </div>
                </Badge>
              </Popover>
            )}
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div className="header-user">
                <Avatar
                  size={36}
                  style={{ background: 'linear-gradient(135deg, #4f46e5, #818cf8)' }}
                  icon={<UserOutlined />}
                />
                {!isTablet && (
                  <div style={{ lineHeight: 1.3 }}>
                    <div className="header-user-name">{user?.firstName} {user?.lastName}</div>
                    <div className="header-user-role">Менеджер</div>
                  </div>
                )}
              </div>
            </Dropdown>
          </div>
        </header>
        <Content className="page-content">
          <div className="fade-in">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default ManagerLayout;
