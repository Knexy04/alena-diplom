import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, List, Button, Empty, Modal, Form, Select, Input, DatePicker, Checkbox, notification } from 'antd';
import { PlusOutlined, CalendarOutlined, RightOutlined, UserAddOutlined, PaperClipOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs, { Dayjs } from 'dayjs';
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
  filePath?: string | null;
  fileName?: string | null;
}

interface IChildFormValues {
  firstName: string;
  lastName: string;
  patronymic?: string;
  birthDate: Dayjs;
  medicalNotes?: string;
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
  const [childModalOpen, setChildModalOpen] = useState(false);
  const [childSubmitting, setChildSubmitting] = useState(false);
  const [childForm] = Form.useForm<IChildFormValues>();

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

  const handleCreateApplication = async (values: {
    childId: string;
    sessionId: string;
    notes?: string;
    agreedToPrivacyPolicy?: boolean;
  }) => {
    setCreateLoading(true);
    try {
      await applicationsService.create({
        childId: values.childId,
        sessionId: values.sessionId,
        notes: values.notes,
      });
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

  const handleOpenChildModal = () => {
    childForm.resetFields();
    setChildModalOpen(true);
  };

  const handleAddChild = async (values: IChildFormValues) => {
    setChildSubmitting(true);
    try {
      const res = await clientsService.addMyChild({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        patronymic: values.patronymic?.trim() || undefined,
        birthDate: values.birthDate.format('YYYY-MM-DD'),
        medicalNotes: values.medicalNotes?.trim() || undefined,
      });
      const newChild: IChild = res.data.data;
      setChildren((prev) => [...prev, newChild]);
      createForm.setFieldValue('childId', newChild.id);
      notification.success({ message: 'Ребёнок добавлен' });
      setChildModalOpen(false);
      childForm.resetFields();
    } catch (e) {
      const err = e as { response?: { data?: { message?: string | string[] } } };
      const msg = err.response?.data?.message;
      notification.error({
        message: Array.isArray(msg) ? msg[0] : msg || 'Не удалось добавить ребёнка',
      });
    } finally {
      setChildSubmitting(false);
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
                description={
                  <div style={{ color: '#64748b' }}>
                    <div>{item.body}</div>
                    {item.filePath && (
                      <a
                        href={`/api/uploads/${item.filePath}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#F37022', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: 13 }}
                      >
                        <PaperClipOutlined />
                        {item.fileName || 'Вложение'}
                      </a>
                    )}
                  </div>
                }
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
              placeholder={children.length ? 'Выберите ребёнка' : 'Сначала добавьте ребёнка'}
              options={children.map((c) => ({ label: getFullName(c), value: c.id }))}
              notFoundContent={
                <div style={{ padding: '12px 4px', textAlign: 'center' }}>
                  <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                    Детей пока нет
                  </Text>
                  <Button size="small" type="primary" icon={<UserAddOutlined />} onClick={handleOpenChildModal}>
                    Добавить ребёнка
                  </Button>
                </div>
              }
            />
          </Form.Item>
          <Button
            type="link"
            icon={<UserAddOutlined />}
            onClick={handleOpenChildModal}
            style={{ padding: 0, marginTop: -12, marginBottom: 12 }}
          >
            Добавить нового ребёнка
          </Button>
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
          <Form.Item
            name="agreedToPrivacyPolicy"
            valuePropName="checked"
            rules={[
              {
                validator: (_, value) =>
                  value
                    ? Promise.resolve()
                    : Promise.reject(new Error('Необходимо согласие на обработку персональных данных')),
              },
            ]}
            style={{ marginBottom: 0 }}
          >
            <Checkbox>
              Я ознакомлен(а) и согласен(а) с{' '}
              <a
                href={`/${encodeURIComponent('Политика_обработки_персональных_данных.docx')}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                style={{ color: '#F37022', textDecoration: 'underline' }}
              >
                политикой обработки персональных данных
              </a>
            </Checkbox>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Добавить ребёнка"
        open={childModalOpen}
        onCancel={() => { setChildModalOpen(false); childForm.resetFields(); }}
        onOk={() => childForm.submit()}
        okText="Добавить"
        cancelText="Отмена"
        confirmLoading={childSubmitting}
        width={480}
        zIndex={1100}
      >
        <Form form={childForm} layout="vertical" onFinish={handleAddChild} style={{ marginTop: 16 }}>
          <Form.Item
            name="lastName"
            label="Фамилия"
            rules={[{ required: true, message: 'Введите фамилию' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="firstName"
            label="Имя"
            rules={[{ required: true, message: 'Введите имя' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="patronymic" label="Отчество">
            <Input />
          </Form.Item>
          <Form.Item
            name="birthDate"
            label="Дата рождения"
            rules={[{ required: true, message: 'Укажите дату рождения' }]}
          >
            <DatePicker
              style={{ width: '100%' }}
              format="DD.MM.YYYY"
              disabledDate={(d) => d && d.isAfter(dayjs())}
            />
          </Form.Item>
          <Form.Item name="medicalNotes" label="Мед. особенности">
            <Input.TextArea
              rows={3}
              placeholder="Аллергии, хронические заболевания и т.д."
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ParentDashboardPage;
