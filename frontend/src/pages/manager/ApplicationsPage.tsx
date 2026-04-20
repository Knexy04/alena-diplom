import React, { useState, useEffect } from 'react';
import { Table, Tag, Input, Select, DatePicker, Typography, Button, Modal, Form, notification } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useApplications } from '../../hooks/useApplications';
import { sessionsService } from '../../services/sessions.service';
import { clientsService } from '../../services/clients.service';
import { applicationsService } from '../../services/applications.service';
import {
  IApplication,
  ISession,
  ApplicationStatus,
  statusLabels,
  statusColors,
} from '../../types/application';
import { IClient, IChild } from '../../types/client';
import { formatDate, getFullName } from '../../utils/helpers';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const ApplicationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [status, setStatus] = useState<string | undefined>();
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [search, setSearch] = useState<string | undefined>();
  const [dateRange, setDateRange] = useState<[string, string] | undefined>();
  const [sessions, setSessions] = useState<ISession[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [clients, setClients] = useState<IClient[]>([]);
  const [selectedClientChildren, setSelectedClientChildren] = useState<IChild[]>([]);
  const [createLoading, setCreateLoading] = useState(false);
  const [createForm] = Form.useForm();

  const { applications, total, loading, refetch } = useApplications({
    page,
    limit,
    status,
    sessionId,
    search,
    dateFrom: dateRange?.[0],
    dateTo: dateRange?.[1],
  });

  useEffect(() => {
    sessionsService.getAll().then((res) => setSessions(res.data.data));
  }, []);

  const handleOpenCreate = async () => {
    try {
      const res = await clientsService.getAll();
      setClients(res.data.data);
    } catch {
      notification.error({ message: 'Ошибка загрузки клиентов' });
    }
    setCreateModalOpen(true);
  };

  const handleClientChange = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    setSelectedClientChildren(client?.children || []);
    createForm.setFieldValue('childId', undefined);
  };

  const handleCreateApplication = async (values: { parentId: string; childId: string; sessionId: string; notes?: string }) => {
    setCreateLoading(true);
    try {
      await applicationsService.create({
        childId: values.childId,
        sessionId: values.sessionId,
        notes: values.notes,
      });
      notification.success({ message: 'Заявка создана' });
      setCreateModalOpen(false);
      createForm.resetFields();
      setSelectedClientChildren([]);
      refetch();
    } catch {
      notification.error({ message: 'Ошибка создания заявки' });
    } finally {
      setCreateLoading(false);
    }
  };

  const columns = [
    {
      title: 'Номер',
      dataIndex: 'applicationNumber',
      key: 'number',
      width: 140,
      render: (v: string) => <span style={{ fontWeight: 600, color: '#4f46e5' }}>{v}</span>,
    },
    {
      title: 'Ребёнок',
      key: 'child',
      render: (_: unknown, record: IApplication) => (
        <span style={{ fontWeight: 500 }}>{getFullName(record.child)}</span>
      ),
    },
    {
      title: 'Родитель',
      key: 'parent',
      render: (_: unknown, record: IApplication) => getFullName(record.parent),
    },
    {
      title: 'Смена',
      key: 'session',
      render: (_: unknown, record: IApplication) => (
        <span style={{ color: '#64748b' }}>{record.session?.title}</span>
      ),
    },
    {
      title: 'Статус',
      key: 'status',
      render: (_: unknown, record: IApplication) => (
        <Tag className="status-tag" color={statusColors[record.status]}>
          {statusLabels[record.status]}
        </Tag>
      ),
    },
    {
      title: 'Дата',
      key: 'createdAt',
      render: (_: unknown, record: IApplication) => (
        <span style={{ color: '#94a3b8' }}>{formatDate(record.createdAt)}</span>
      ),
    },
  ];

  const statusOptions = Object.values(ApplicationStatus).map((s) => ({
    label: statusLabels[s],
    value: s,
  }));

  return (
    <div>
      <div className="page-header">
        <Title level={4} className="page-title">Заявки</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate} size="large">
          Новая заявка
        </Button>
      </div>

      <div className="filters-bar">
        <Input.Search
          placeholder="Поиск по ФИО..."
          prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
          onSearch={(value) => { setSearch(value || undefined); setPage(1); }}
          allowClear
          style={{ maxWidth: 280 }}
        />
        <Select
          placeholder="Статус"
          mode="multiple"
          allowClear
          style={{ minWidth: 200 }}
          options={statusOptions}
          onChange={(values) => { setStatus(values?.join(',') || undefined); setPage(1); }}
        />
        <Select
          placeholder="Смена"
          allowClear
          style={{ minWidth: 200 }}
          options={sessions.map((s) => ({ label: s.title, value: s.id }))}
          onChange={(value) => { setSessionId(value || undefined); setPage(1); }}
        />
        <RangePicker
          style={{ minWidth: 240 }}
          onChange={(dates) => {
            if (dates && dates[0] && dates[1]) {
              setDateRange([dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD')]);
            } else {
              setDateRange(undefined);
            }
            setPage(1);
          }}
        />
      </div>

      <div className="styled-table">
        <Table
          dataSource={applications}
          columns={columns}
          rowKey="id"
          loading={loading}
          scroll={{ x: 700 }}
          pagination={{
            current: page,
            pageSize: limit,
            total,
            onChange: (p) => setPage(p),
            showTotal: (t) => `Всего: ${t}`,
            style: { padding: '12px 16px' },
          }}
          onRow={(record) => ({
            onClick: () => navigate(`/manager/applications/${record.id}`),
            style: { cursor: 'pointer' },
          })}
        />
      </div>

      <Modal
        title="Новая заявка"
        open={createModalOpen}
        onCancel={() => { setCreateModalOpen(false); createForm.resetFields(); setSelectedClientChildren([]); }}
        onOk={() => createForm.submit()}
        okText="Создать"
        cancelText="Отмена"
        confirmLoading={createLoading}
        width={520}
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreateApplication} style={{ marginTop: 16 }}>
          <Form.Item name="parentId" label="Родитель" rules={[{ required: true, message: 'Выберите родителя' }]}>
            <Select
              placeholder="Выберите родителя"
              showSearch
              optionFilterProp="label"
              onChange={handleClientChange}
              options={clients.map((c) => ({ label: getFullName(c) + ` (${c.email})`, value: c.id }))}
            />
          </Form.Item>
          <Form.Item name="childId" label="Ребёнок" rules={[{ required: true, message: 'Выберите ребёнка' }]}>
            <Select
              placeholder={selectedClientChildren.length ? 'Выберите ребёнка' : 'Сначала выберите родителя'}
              disabled={selectedClientChildren.length === 0}
              options={selectedClientChildren.map((c) => ({ label: getFullName(c), value: c.id }))}
            />
          </Form.Item>
          <Form.Item name="sessionId" label="Смена" rules={[{ required: true, message: 'Выберите смену' }]}>
            <Select
              placeholder="Выберите смену"
              options={sessions.map((s) => ({ label: s.title, value: s.id }))}
            />
          </Form.Item>
          <Form.Item name="notes" label="Заметки">
            <Input.TextArea rows={3} placeholder="Комментарий к заявке" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ApplicationsPage;
