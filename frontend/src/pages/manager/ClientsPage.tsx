import React, { useEffect, useState } from 'react';
import { Table, Input, Typography, Tag } from 'antd';
import { SearchOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { clientsService } from '../../services/clients.service';
import { IClient } from '../../types/client';
import { getFullName } from '../../utils/helpers';

const { Title } = Typography;

const ClientsPage: React.FC = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<IClient[]>([]);
  const [loading, setLoading] = useState(true);

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
              background: 'linear-gradient(135deg, #4f46e5, #818cf8)',
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
          onRow={(record) => ({
            onClick: () => navigate(`/manager/clients/${record.id}`),
            style: { cursor: 'pointer' },
          })}
        />
      </div>
    </div>
  );
};

export default ClientsPage;
