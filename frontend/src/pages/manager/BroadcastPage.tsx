import React, { useEffect, useState } from 'react';
import { Form, Select, Input, Button, Card, Typography, Modal, Upload, notification } from 'antd';
import { SendOutlined, NotificationOutlined, PaperClipOutlined, CloseOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd';
import { sessionsService } from '../../services/sessions.service';
import { notificationsService } from '../../services/notifications.service';
import { ISession } from '../../types/application';

const { Title, Text } = Typography;
const { TextArea } = Input;

const BroadcastPage: React.FC = () => {
  const [sessions, setSessions] = useState<ISession[]>([]);
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [form] = Form.useForm<{ sessionId: string; title: string; body: string }>();

  useEffect(() => {
    sessionsService.getAll().then((res) => setSessions(res.data.data));
  }, []);

  const handleSend = (values: { sessionId: string; title: string; body: string }) => {
    const file = fileList[0]?.originFileObj || null;
    Modal.confirm({
      title: 'Подтверждение рассылки',
      content: file
        ? `Отправить уведомление всем родителям выбранной смены с вложением «${file.name}»?`
        : 'Отправить уведомление всем родителям выбранной смены?',
      okText: 'Отправить',
      cancelText: 'Отмена',
      onOk: async () => {
        setLoading(true);
        try {
          const res = await notificationsService.broadcast(
            values.sessionId,
            values.title,
            values.body,
            file,
          );
          notification.success({
            message: `Рассылка отправлена ${res.data.data.recipientCount} родителям`,
          });
          form.resetFields();
          setFileList([]);
        } catch (e) {
          const err = e as { response?: { data?: { message?: string | string[] } } };
          const msg = err.response?.data?.message;
          notification.error({
            message: Array.isArray(msg) ? msg[0] : msg || 'Ошибка при рассылке',
          });
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
          <Form.Item label="Вложение" extra="Один файл, максимум 10 МБ. PDF, DOC/DOCX, JPG, PNG.">
            <Upload
              beforeUpload={(file) => {
                if (file.size > 10 * 1024 * 1024) {
                  notification.error({
                    message: 'Файл слишком большой',
                    description: 'Максимальный размер — 10 МБ',
                  });
                  return Upload.LIST_IGNORE;
                }
                setFileList([
                  {
                    uid: file.uid,
                    name: file.name,
                    status: 'done',
                    originFileObj: file,
                  } as UploadFile,
                ]);
                return false;
              }}
              fileList={fileList}
              onRemove={() => setFileList([])}
              maxCount={1}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              showUploadList={{ removeIcon: <CloseOutlined /> }}
            >
              <Button icon={<PaperClipOutlined />}>Прикрепить файл</Button>
            </Upload>
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
