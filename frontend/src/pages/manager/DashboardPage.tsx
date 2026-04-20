import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Table, Tag } from 'antd';
import {
  FileTextOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { applicationsService } from '../../services/applications.service';
import { clientsService } from '../../services/clients.service';
import { IApplication, statusLabels, statusColors } from '../../types/application';
import { formatDate, getFullName } from '../../utils/helpers';

const { Title } = Typography;

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, review: 0, paid: 0, clients: 0 });
  const [recentApps, setRecentApps] = useState<IApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [appsRes, reviewRes, paidRes, clientsRes] = await Promise.all([
          applicationsService.getAll({ page: 1, limit: 5, sortBy: 'createdAt', sortOrder: 'DESC' }),
          applicationsService.getAll({ status: 'review', limit: 1 }),
          applicationsService.getAll({ status: 'paid', limit: 1 }),
          clientsService.getAll(),
        ]);

        setRecentApps(appsRes.data.data.items);
        setStats({
          total: appsRes.data.data.total,
          review: reviewRes.data.data.total,
          paid: paidRes.data.data.total,
          clients: clientsRes.data.data.length,
        });
      } catch {
        // handled by interceptor
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const columns = [
    { title: 'Номер', dataIndex: 'applicationNumber', key: 'number', width: 140 },
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
      render: (_: unknown, record: IApplication) => record.session?.title,
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
      key: 'date',
      render: (_: unknown, record: IApplication) => (
        <span style={{ color: '#64748b' }}>{formatDate(record.createdAt)}</span>
      ),
    },
  ];

  const statCards = [
    { label: 'Всего заявок', value: stats.total, icon: <FileTextOutlined />, className: 'stat-icon-blue' },
    { label: 'На рассмотрении', value: stats.review, icon: <ClockCircleOutlined />, className: 'stat-icon-amber' },
    { label: 'Оплачено', value: stats.paid, icon: <CheckCircleOutlined />, className: 'stat-icon-green' },
    { label: 'Клиентов', value: stats.clients, icon: <TeamOutlined />, className: 'stat-icon-purple' },
  ];

  return (
    <div>
      <div className="page-header">
        <Title level={4} className="page-title">Дашборд</Title>
      </div>

      <Row gutter={[16, 0]} style={{ marginBottom: 28 }}>
        {statCards.map((stat) => (
          <Col xs={12} sm={12} md={6} key={stat.label} style={{ marginBottom: 12 }}>
            <Card className="stat-card" bodyStyle={{ padding: 24 }}>
              <div className={`stat-card-icon ${stat.className}`}>
                {stat.icon}
              </div>
              <div className="stat-card-value">{stat.value}</div>
              <div className="stat-card-label">{stat.label}</div>
            </Card>
          </Col>
        ))}
      </Row>

      <Card
        className="styled-card"
        title="Последние заявки"
        extra={
          <a onClick={() => navigate('/manager/applications')} style={{ fontWeight: 500 }}>
            Все заявки
          </a>
        }
      >
        <div className="styled-table">
          <Table
            dataSource={recentApps}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={false}
            scroll={{ x: 600 }}
            onRow={(record) => ({
              onClick: () => navigate(`/manager/applications/${record.id}`),
              style: { cursor: 'pointer' },
            })}
          />
        </div>
      </Card>
    </div>
  );
};

export default DashboardPage;
