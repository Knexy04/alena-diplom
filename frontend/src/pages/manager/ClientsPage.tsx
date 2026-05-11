import React, { useEffect, useState } from 'react';
import { Table, Input, Typography, Tag, Button, Modal, Form, notification } from 'antd';
import { SearchOutlined, UserOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { clientsService } from '../../services/clients.service';
import { IClient, ICreateClientRequest } from '../../types/client';
import { getFullName } from '../../utils/helpers';

const { Title } = Typography;

const ClientsPage: React.FC = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<IClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm<ICreateClientRequest>();

  const fetchClients = async (search?: string) => {
    setLoading(true);
    try {
      const res = await clientsService.getAll(search);
      setClients(res.data.data);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleCloseCreate = () => {
    setCreateModalOpen(false);
    form.resetFields();
  };

  const handleCreate = async (values: ICreateClientRequest) => {
    setSubmitting(true);
    try {
      await clientsService.create(values);
      notification.success({ message: 'Клиент создан' });
      handleCloseCreate();
      fetchClients();
    } catch (e) {
      const err = e as { response?: { data?: { message?: string | string[] } } };
      const msg = err.response?.data?.message;
      notification.error({
        message: Array.isArray(msg) ? msg[0] : msg || 'Ошибка создания клиента',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: 'Клиент',
      key: 'name',
      render: (_: unknown, record: IClient) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #F37022, #FFA45C)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 16,
              flexShrink: 0,
            }}
          >
            <UserOutlined />
          </div>
          <div>
            <div style={{ fontWeight: 600 }}>{getFullName(record)}</div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>{record.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Телефон',
      dataIndex: 'phone',
      key: 'phone',
      render: (v: string) => v || <span style={{ color: '#cbd5e1' }}>—</span>,
    },
    {
      title: 'Дети',
      key: 'children',
      render: (_: unknown, record: IClient) =>
        record.children?.length ? (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {record.children.map((c) => (
              <Tag key={c.id} style={{ borderRadius: 6, margin: 0 }}>
                {c.firstName} {c.lastName}
              </Tag>
            ))}
          </div>
        ) : (
          <span style={{ color: '#cbd5e1' }}>—</span>
        ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <Title level={4} className="page-title">Клиенты</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={() => setCreateModalOpen(true)}
        >
          Новый клиент
        </Button>
      </div>

      <div className="filters-bar" style={{ marginBottom: 20 }}>
        <Input.Search
          placeholder="Поиск по ФИО или email..."
          prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
          onSearch={(value) => fetchClients(value || undefined)}
          allowClear
          style={{ maxWidth: 400 }}
        />
      </div>

      <div className="styled-table">
        <Table
          dataSource={clients}
          columns={columns}
          rowKey="id"
          loading={loading}
          scroll={{ x: 500 }}
          childrenColumnName="__children__"
          onRow={(record) => ({
            onClick: () => navigate(`/manager/clients/${record.id}`),
            style: { cursor: 'pointer' },
          })}
        />
      </div>

      <Modal
        title="Новый клиент"
        open={createModalOpen}
        onCancel={handleCloseCreate}
        onOk={() => form.submit()}
        okText="Создать"
        cancelText="Отмена"
        confirmLoading={submitting}
        width={520}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate} style={{ marginTop: 16 }}>
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
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Введите email' },
              { type: 'email', message: 'Некорректный email' },
            ]}
          >
            <Input placeholder="parent@mail.ru" />
          </Form.Item>
          <Form.Item name="phone" label="Телефон">
            <Input placeholder="+7 999 123-45-67" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Пароль"
            rules={[
              { required: true, message: 'Введите пароль' },
              { min: 6, message: 'Минимум 6 символов' },
            ]}
            extra="Пароль для входа клиента в личный кабинет"
          >
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ClientsPage;
