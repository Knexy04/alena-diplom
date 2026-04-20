import React, { useEffect, useState } from 'react';
import { Form, Select, Input, Button, Card, Typography, Modal, notification } from 'antd';
import { SendOutlined, NotificationOutlined } from '@ant-design/icons';
import { sessionsService } from '../../services/sessions.service';
import { notificationsService } from '../../services/notifications.service';
import { ISession } from '../../types/application';

const { Title, Text } = Typography;
const { TextArea } = Input;

const BroadcastPage: React.FC = () => {
  const [sessions, setSessions] = useState<ISession[]>([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    sessionsService.getAll().then((res) => setSessions(res.data.data));
  }, []);

  const handleSend = async (values: { sessionId: string; title: string; body: string }) => {
    Modal.confirm({
      title: 'Подтверждение рассылки',
      content: 'Отправить уведомление всем родителям выбранной смены?',
      okText: 'Отправить',
      cancelText: 'Отмена',
      onOk: async () => {
        setLoading(true);
        try {
          const res = await notificationsService.broadcast(
            values.sessionId,
            values.title,
            values.body,
          );
          notification.success({
            message: `Рассылка отправлена ${res.data.data.recipientCount} родителям`,
          });
          form.resetFields();
        } catch {
          notification.error({ message: 'Ошибка при рассылке' });
        } finally {
          setLoading(false);
        }
      },
    });
  };

  return (
    <div>
      <div className="page-header">
        <Title level={4} className="page-title">
          <NotificationOutlined style={{ marginRight: 10 }} />
          Массовая рассылка
        </Title>
      </div>

      <Card className="broadcast-card">
        <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
          Отправьте уведомление всем родителям, чьи дети записаны на выбранную смену
        </Text>
        <Form form={form} layout="vertical" onFinish={handleSend}>
          <Form.Item
            name="sessionId"
            label="Смена"
            rules={[{ required: true, message: 'Выберите смену' }]}
          >
            <Select
              placeholder="Выберите смену"
              options={sessions.map((s) => ({ label: s.title, value: s.id }))}
            />
          </Form.Item>
          <Form.Item
            name="title"
            label="Заголовок"
            rules={[{ required: true, message: 'Введите заголовок' }]}
          >
            <Input placeholder="Заголовок уведомления" />
          </Form.Item>
          <Form.Item
            name="body"
            label="Текст сообщения"
            rules={[{ required: true, message: 'Введите текст' }]}
          >
            <TextArea rows={6} placeholder="Текст уведомления для родителей..." />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SendOutlined />}
              loading={loading}
              size="large"
              style={{ fontWeight: 600 }}
            >
              Отправить рассылку
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default BroadcastPage;
