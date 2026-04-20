import React, { useEffect, useState } from 'react';
import {
  Tabs,
  Card,
  Descriptions,
  Button,
  Table,
  Tag,
  Modal,
  Form,
  Input,
  DatePicker,
  List,
  Popconfirm,
  Typography,
  Spin,
  notification,
} from 'antd';
import {
  ArrowLeftOutlined,
  PlusOutlined,
  FileOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  DownloadOutlined,
  UserOutlined,
  TeamOutlined,
  FileTextOutlined,
  MessageOutlined,
  IdcardOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { clientsService } from '../../services/clients.service';
import { documentsService } from '../../services/documents.service';
import { chatService } from '../../services/chat.service';
import { IClient, IChild } from '../../types/client';
import { IApplication, statusLabels, statusColors } from '../../types/application';
import { IDocument, documentTypeLabels } from '../../types/document';
import { IMessage } from '../../types/chat';
import { formatDate, formatDateTime, getFullName, formatFileSize } from '../../utils/helpers';

const { Title, Text } = Typography;

const ClientDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<IClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [childModalOpen, setChildModalOpen] = useState(false);
  const [documents, setDocuments] = useState<IDocument[]>([]);
  const [chatMessages, setChatMessages] = useState<{ applicationNumber: string; messages: IMessage[] }[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [form] = Form.useForm();

  const fetchClient = async () => {
    if (!id) return;
    try {
      const res = await clientsService.getById(id);
      setClient(res.data.data);
    } catch {
      notification.error({ message: 'Ошибка загрузки клиента' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClient();
  }, [id]);

  const fetchDocuments = async () => {
    if (!client?.applications?.length) return;
    setDocsLoading(true);
    try {
      const allDocs: IDocument[] = [];
      for (const app of client.applications) {
        const res = await documentsService.getByApplication(app.id);
        allDocs.push(...res.data.data);
      }
      setDocuments(allDocs);
    } catch {
      // handled
    } finally {
      setDocsLoading(false);
    }
  };

  const fetchChatHistory = async () => {
    if (!client?.applications?.length) return;
    setChatLoading(true);
    try {
      const allChats: { applicationNumber: string; messages: IMessage[] }[] = [];
      for (const app of client.applications) {
        const res = await chatService.getMessages(app.id);
        if (res.data.data.items.length > 0) {
          allChats.push({ applicationNumber: app.applicationNumber, messages: res.data.data.items });
        }
      }
      setChatMessages(allChats);
    } catch {
      // handled
    } finally {
      setChatLoading(false);
    }
  };

  const handleDeleteClient = async () => {
    if (!id) return;
    try {
      await clientsService.remove(id);
      notification.success({ message: 'Клиент удалён' });
      navigate('/manager/clients');
    } catch {
      notification.error({ message: 'Не удалось удалить клиента' });
    }
  };

  const handleAddChild = async (values: { firstName: string; lastName: string; patronymic?: string; birthDate: unknown; medicalNotes?: string }) => {
    if (!id) return;
    try {
      await clientsService.addChild(id, {
        ...values,
        birthDate: (values.birthDate as { format: (f: string) => string }).format('YYYY-MM-DD'),
      });
      notification.success({ message: 'Ребёнок добавлен' });
      setChildModalOpen(false);
      form.resetFields();
      fetchClient();
    } catch {
      notification.error({ message: 'Ошибка' });
    }
  };

  const handleDownload = async (doc: IDocument) => {
    try {
      const res = await documentsService.download(doc.id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.originalName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      notification.error({ message: 'Ошибка скачивания' });
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType === 'application/pdf') return <FilePdfOutlined style={{ color: '#ef4444', fontSize: 20 }} />;
    if (mimeType?.startsWith('image/')) return <FileImageOutlined style={{ color: '#3b82f6', fontSize: 20 }} />;
    return <FileOutlined style={{ fontSize: 20 }} />;
  };

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  if (!client) return <div>Клиент не найден</div>;

  const appColumns = [
    {
      title: 'Номер',
      dataIndex: 'applicationNumber',
      key: 'number',
      render: (v: string) => <span style={{ fontWeight: 600, color: '#4f46e5' }}>{v}</span>,
    },
    {
      title: 'Ребёнок',
      key: 'child',
      render: (_: unknown, r: IApplication) => getFullName(r.child),
    },
    { title: 'Смена', key: 'session', render: (_: unknown, r: IApplication) => r.session?.title },
    {
      title: 'Статус',
      key: 'status',
      render: (_: unknown, r: IApplication) => (
        <Tag className="status-tag" color={statusColors[r.status]}>{statusLabels[r.status]}</Tag>
      ),
    },
    {
      title: 'Дата',
      key: 'date',
      render: (_: unknown, r: IApplication) => (
        <span style={{ color: '#94a3b8' }}>{formatDate(r.createdAt)}</span>
      ),
    },
  ];

  return (
    <div>
      <Button
        className="back-btn"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/manager/clients')}
      >
        Назад к списку
      </Button>

      <div className="page-header" style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #4f46e5, #818cf8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 22,
            }}
          >
            <UserOutlined />
          </div>
          <div>
            <Title level={4} className="page-title">{getFullName(client)}</Title>
            <Text type="secondary">{client.email}</Text>
          </div>
        </div>
        <Popconfirm
          title="Удалить клиента?"
          description="Будут удалены все его заявки, дети, сообщения и документы. Действие необратимо."
          okText="Удалить"
          cancelText="Отмена"
          okButtonProps={{ danger: true }}
          onConfirm={handleDeleteClient}
        >
          <Button danger icon={<DeleteOutlined />}>Удалить клиента</Button>
        </Popconfirm>
      </div>

      <Tabs
        defaultActiveKey="info"
        onChange={(key) => {
          if (key === 'documents' && documents.length === 0) fetchDocuments();
          if (key === 'communication' && chatMessages.length === 0) fetchChatHistory();
        }}
        items={[
          {
            key: 'info',
            label: <span><IdcardOutlined /> Данные</span>,
            children: (
              <Card className="styled-card">
                <Descriptions bordered column={{ xs: 1, lg: 2 }}>
                  <Descriptions.Item label="Фамилия">{client.lastName}</Descriptions.Item>
                  <Descriptions.Item label="Имя">{client.firstName}</Descriptions.Item>
                  <Descriptions.Item label="Отчество">{client.patronymic || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Email">{client.email}</Descriptions.Item>
                  <Descriptions.Item label="Телефон">{client.phone || '—'}</Descriptions.Item>
                </Descriptions>
              </Card>
            ),
          },
          {
            key: 'children',
            label: <span><TeamOutlined /> Дети</span>,
            children: (
              <div>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setChildModalOpen(true)}
                  style={{ marginBottom: 20 }}
                >
                  Добавить ребёнка
                </Button>
                {client.children?.map((child: IChild) => (
                  <Card key={child.id} className="styled-card" style={{ marginBottom: 12 }}>
                    <Descriptions bordered size="small" column={{ xs: 1, lg: 2 }}>
                      <Descriptions.Item label="ФИО">
                        <Text strong>{getFullName(child)}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Дата рождения">
                        {formatDate(child.birthDate)}
                      </Descriptions.Item>
                      <Descriptions.Item label="Мед. особенности" span={2}>
                        {child.medicalNotes || '—'}
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>
                ))}
              </div>
            ),
          },
          {
            key: 'applications',
            label: <span><FileTextOutlined /> Заявки</span>,
            children: (
              <div className="styled-table">
                <Table
                  dataSource={client.applications || []}
                  columns={appColumns}
                  rowKey="id"
                  scroll={{ x: 600 }}
                  onRow={(r) => ({
                    onClick: () => navigate(`/manager/applications/${r.id}`),
                    style: { cursor: 'pointer' },
                  })}
                />
              </div>
            ),
          },
          {
            key: 'documents',
            label: <span><FileOutlined /> Документы</span>,
            children: (
              <Spin spinning={docsLoading}>
                {documents.length === 0 ? (
                  <Text type="secondary">Нет документов</Text>
                ) : (
                  <List
                    dataSource={documents}
                    renderItem={(doc) => (
                      <List.Item
                        actions={[
                          <Button size="small" icon={<DownloadOutlined />} onClick={() => handleDownload(doc)}>
                            Скачать
                          </Button>,
                        ]}
                        style={{
                          padding: '12px 16px',
                          background: '#fff',
                          borderRadius: 10,
                          marginBottom: 8,
                          border: '1px solid #e2e8f0',
                        }}
                      >
                        <List.Item.Meta
                          avatar={getFileIcon(doc.mimeType)}
                          title={<Text strong>{doc.originalName}</Text>}
                          description={`${documentTypeLabels[doc.type]} · ${formatFileSize(doc.fileSize)} · ${formatDate(doc.createdAt)}`}
                        />
                      </List.Item>
                    )}
                  />
                )}
              </Spin>
            ),
          },
          {
            key: 'communication',
            label: <span><MessageOutlined /> Коммуникация</span>,
            children: (
              <Spin spinning={chatLoading}>
                {chatMessages.length === 0 ? (
                  <Text type="secondary">Нет сообщений</Text>
                ) : (
                  chatMessages.map((chat) => (
                    <Card
                      key={chat.applicationNumber}
                      className="styled-card"
                      title={`Заявка ${chat.applicationNumber}`}
                      size="small"
                      style={{ marginBottom: 16 }}
                    >
                      {chat.messages.map((msg) => (
                        <div
                          key={msg.id}
                          style={{
                            padding: '10px 0',
                            borderBottom: '1px solid #f1f5f9',
                          }}
                        >
                          <Text strong>{msg.sender ? getFullName(msg.sender) : 'Пользователь'}</Text>
                          <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                            {formatDateTime(msg.createdAt)}
                          </Text>
                          <div style={{ marginTop: 4 }}>
                            {msg.text && <div>{msg.text}</div>}
                            {msg.fileName && (
                              <Tag icon={<FileOutlined />} style={{ marginTop: 4 }}>{msg.fileName}</Tag>
                            )}
                          </div>
                        </div>
                      ))}
                    </Card>
                  ))
                )}
              </Spin>
            ),
          },
        ]}
      />

      <Modal
        title="Добавить ребёнка"
        open={childModalOpen}
        onCancel={() => setChildModalOpen(false)}
        onOk={() => form.submit()}
        okText="Добавить"
        cancelText="Отмена"
      >
        <Form form={form} layout="vertical" onFinish={handleAddChild} style={{ marginTop: 16 }}>
          <Form.Item name="lastName" label="Фамилия" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="firstName" label="Имя" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="patronymic" label="Отчество">
            <Input />
          </Form.Item>
          <Form.Item name="birthDate" label="Дата рождения" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="medicalNotes" label="Мед. особенности">
            <Input.TextArea />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ClientDetailPage;
