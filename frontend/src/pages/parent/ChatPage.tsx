import React, { useEffect, useState } from 'react';
import { Typography, Spin, Empty } from 'antd';
import { MessageOutlined, RightOutlined, CalendarOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { applicationsService } from '../../services/applications.service';
import { IApplication, statusLabels } from '../../types/application';
import { getFullName } from '../../utils/helpers';

const { Title } = Typography;

const ParentChatPage: React.FC = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<IApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    applicationsService
      .getAll({ limit: 100 })
      .then((res) => setApplications(res.data.data.items))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  return (
    <div>
      <div className="page-header">
        <Title level={4} className="page-title">
          <MessageOutlined style={{ marginRight: 10 }} />
          Мои чаты
        </Title>
      </div>

      {applications.length === 0 ? (
        <Empty description="Нет активных заявок" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {applications.map((app) => (
            <div
              key={app.id}
              className="chat-channel"
              onClick={() => navigate(`/parent/applications/${app.id}`)}
              style={{
                padding: '16px 20px',
                background: '#fff',
                borderRadius: 12,
                border: '1px solid #e2e8f0',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #818cf8, #06b6d4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: 18,
                  }}
                >
                  <MessageOutlined />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>
                    {app.applicationNumber} — {getFullName(app.child)}
                  </div>
                  <div style={{ fontSize: 13, color: '#64748b' }}>
                    <CalendarOutlined style={{ marginRight: 4 }} />
                    {app.session?.title}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>
                  {statusLabels[app.status]}
                </span>
                <RightOutlined style={{ color: '#cbd5e1', fontSize: 12 }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ParentChatPage;
