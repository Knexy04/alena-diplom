import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Tag, Typography, List, Button, Empty, Modal, Form, Select, Input, notification } from 'antd';
import { PlusOutlined, CalendarOutlined, RightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { applicationsService } from '../../services/applications.service';
import { notificationsService } from '../../services/notifications.service';
import { sessionsService } from '../../services/sessions.service';
import { clientsService } from '../../services/clients.service';
import { IApplication, ISession, statusLabels, statusColors } from '../../types/application';
import { IChild } from '../../types/client';
import { formatDate, getFullName, formatPrice } from '../../utils/helpers';

const { Title, Text } = Typography;

interface INotification {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

const statusColorMap: Record<string, string> = {
  default: '#94a3b8',
  blue: '#3b82f6',
  orange: '#f59e0b',
  green: '#10b981',
  purple: '#8b5cf6',
};

const statusBgMap: Record<string, string> = {
  default: '#f1f5f9',
  blue: '#eff6ff',
  orange: '#fffbeb',
  green: '#ecfdf5',
  purple: '#f5f3ff',
};

const ParentDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<IApplication[]>([]);
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [sessions, setSessions] = useState<ISession[]>([]);
  const [children, setChildren] = useState<IChild[]>([]);
  const [createLoading, setCreateLoading] = useState(false);
  const [createForm] = Form.useForm();

  const fetchData = async () => {
    try {
      const [appsRes, notifsRes] = await Promise.all([
        applicationsService.getAll({ limit: 10 }),
        notificationsService.getAll(5),
      ]);
      setApplications(appsRes.data.data.items);
      setNotifications(notifsRes.data.data);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreate = async () => {
    try {
      const [sessRes, childrenRes] = await Promise.all([
        sessionsService.getAll(),
        clientsService.getMyChildren(),
      ]);
      setSessions(sessRes.data.data);
      setChildren(childrenRes.data.data);
    } catch {
      notification.error({ message: 'Ошибка загрузки данных' });
    }
    setCreateModalOpen(true);
  };

  const handleCreateApplication = async (values: { childId: string; sessionId: string; notes?: string }) => {
    setCreateLoading(true);
    try {
      await applicationsService.create(values);
      notification.success({ message: 'Заявка подана!' });
      setCreateModalOpen(false);
      createForm.resetFields();
      fetchData();
    } catch {
      notification.error({ message: 'Ошибка при подаче заявки' });
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <Title level={4} className="page-title">Мои заявки</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate} size="large">
          Подать заявку
        </Button>
      </div>

      {applications.length === 0 && !loading ? (
        <Card className="styled-card" style={{ textAlign: 'center', padding: 48 }}>
          <Empty description="У вас пока нет заявок" style={{ marginBottom: 24 }}>
            <Button type="primary" onClick={handleOpenCreate} size="large" icon={<PlusOutlined />}>
              Подать первую заявку
            </Button>
          </Empty>
        </Card>
      ) : (
        <Row gutter={20}>
          {applications.map((app) => {
            const color = statusColorMap[statusColors[app.status]] || '#94a3b8';
            const bg = statusBgMap[statusColors[app.status]] || '#f1f5f9';
            return (
              <Col xs={24} sm={12} lg={8} key={app.id} style={{ marginBottom: 20 }}>
                <div
                  className="app-card"
                  onClick={() => navigate(`/parent/applications/${app.id}`)}
                  style={{
                    background: '#fff',
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ height: 4, background: color }} />
                  <div style={{ padding: '20px 24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <Text strong style={{ fontSize: 15, color: '#F37022' }}>
                        {app.applicationNumber}
                      </Text>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 500,
                          padding: '2px 10px',
                          borderRadius: 6,
                          background: bg,
                          color: color,
                        }}
                      >
                        {statusLabels[app.status]}
                      </span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>
                      {getFullName(app.child)}
                    </div>
                    <div style={{ color: '#64748b', fontSize: 13, marginBottom: 12 }}>
                      <CalendarOutlined style={{ marginRight: 6 }} />
                      {app.session?.title}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text strong style={{ color: '#10b981' }}>
                        {formatPrice(app.session?.price)}
                      </Text>
                      <RightOutlined style={{ color: '#cbd5e1', fontSize: 12 }} />
                    </div>
                  </div>
                </div>
              </Col>
            );
          })}
        </Row>
      )}

      <Card className="styled-card" title="Последние уведомления" style={{ marginTop: 8 }}>
        <List
          dataSource={notifications}
          renderItem={(item) => (
            <List.Item style={{ padding: '12px 0' }}>
              <List.Item.Meta
                title={
                  <span style={{ fontWeight: item.isRead ? 400 : 600 }}>
                    {item.title}
                  </span>
                }
                description={<span style={{ color: '#64748b' }}>{item.body}</span>}
              />
              <Text type="secondary" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                {formatDate(item.createdAt)}
              </Text>
            </List.Item>
          )}
          locale={{ emptyText: 'Нет уведомлений' }}
        />
      </Card>

      <Modal
        title="Подать заявку"
        open={createModalOpen}
        onCancel={() => { setCreateModalOpen(false); createForm.resetFields(); }}
        onOk={() => createForm.submit()}
        okText="Подать заявку"
        cancelText="Отмена"
        confirmLoading={createLoading}
        width={520}
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreateApplication} style={{ marginTop: 16 }}>
          <Form.Item name="childId" label="Ребёнок" rules={[{ required: true, message: 'Выберите ребёнка' }]}>
            <Select
              placeholder="Выберите ребёнка"
              options={children.map((c) => ({ label: getFullName(c), value: c.id }))}
            />
          </Form.Item>
          <Form.Item name="sessionId" label="Смена" rules={[{ required: true, message: 'Выберите смену' }]}>
            <Select
              placeholder="Выберите смену"
              options={sessions.map((s) => ({
                label: `${s.title} (${formatPrice(s.price)})`,
                value: s.id,
              }))}
            />
          </Form.Item>
          <Form.Item name="notes" label="Комментарий">
            <Input.TextArea rows={3} placeholder="Дополнительная информация" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ParentDashboardPage;
