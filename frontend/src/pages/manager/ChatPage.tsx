import React, { useEffect, useState } from 'react';
import { Typography, Spin, Empty } from 'antd';
import { MessageOutlined, RightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { applicationsService } from '../../services/applications.service';
import { IApplication, statusLabels, statusColors } from '../../types/application';
import { getFullName } from '../../utils/helpers';

const { Title, Text } = Typography;

const ChatPage: React.FC = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<IApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await applicationsService.getAll({ limit: 100, sortOrder: 'DESC' });
        setApplications(res.data.data.items);
      } catch {
        // handled
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  return (
    <div>
      <div className="page-header">
        <Title level={4} className="page-title">
          <MessageOutlined style={{ marginRight: 10 }} />
          Чат с клиентами
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
              onClick={() => navigate(`/manager/applications/${app.id}`)}
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
                    background: 'linear-gradient(135deg, #F37022, #FFA45C)',
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
                    {getFullName(app.parent)}
                  </div>
                  <div style={{ fontSize: 13, color: '#64748b' }}>
                    {app.applicationNumber} · {app.session?.title}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span
                  style={{
                    fontSize: 12,
                    padding: '2px 10px',
                    borderRadius: 6,
                    background: statusColors[app.status] === 'green' ? '#ecfdf5' :
                                statusColors[app.status] === 'blue' ? '#eff6ff' :
                                statusColors[app.status] === 'orange' ? '#fffbeb' :
                                statusColors[app.status] === 'purple' ? '#f5f3ff' : '#f1f5f9',
                    color: statusColors[app.status] === 'green' ? '#10b981' :
                           statusColors[app.status] === 'blue' ? '#3b82f6' :
                           statusColors[app.status] === 'orange' ? '#f59e0b' :
                           statusColors[app.status] === 'purple' ? '#8b5cf6' : '#64748b',
                    fontWeight: 500,
                  }}
                >
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

export default ChatPage;
