import React, { useEffect, useState } from 'react';
import { Card, Steps, Descriptions, Typography, Spin, Button, Row, Col, Grid, notification } from 'antd';
import { ArrowLeftOutlined, CalendarOutlined, FileTextOutlined, MessageOutlined } from '@ant-design/icons';

const { useBreakpoint } = Grid;
import { useParams, useNavigate } from 'react-router-dom';
import { applicationsService } from '../../services/applications.service';
import { IApplication, ApplicationStatus, statusLabels } from '../../types/application';
import { formatDate, formatPrice, getFullName } from '../../utils/helpers';
import DocumentsList from '../../components/documents/DocumentsList';
import ChatWindow from '../../components/chat/ChatWindow';

const { Title, Text } = Typography;

const statusSteps = [
  ApplicationStatus.REVIEW,
  ApplicationStatus.PROCESSING,
  ApplicationStatus.AWAITING_PAYMENT,
  ApplicationStatus.PAID,
  ApplicationStatus.COMPLETED,
];

const ApplicationStatusPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const [application, setApplication] = useState<IApplication | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    applicationsService
      .getById(id)
      .then((res) => setApplication(res.data.data))
      .catch(() => notification.error({ message: 'Ошибка загрузки' }))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  if (!application) return <div>Заявка не найдена</div>;

  const currentStep = statusSteps.indexOf(application.status);

  return (
    <div>
      <Button
        className="back-btn"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/parent/dashboard')}
      >
        Назад
      </Button>

      <div className="page-header" style={{ marginBottom: 20 }}>
        <Title level={4} className="page-title">
          Заявка {application.applicationNumber}
        </Title>
      </div>

      <Card className="styled-card" style={{ marginBottom: 24 }}>
        <Steps
          current={currentStep}
          className="status-steps"
          direction={screens.md ? 'horizontal' : 'vertical'}
          size={screens.lg ? 'default' : 'small'}
          items={statusSteps.map((s) => ({ title: statusLabels[s] }))}
        />
      </Card>

      <Row gutter={[24, 20]}>
        <Col xs={24} lg={16}>
          <Card
            className="styled-card"
            title={<span><CalendarOutlined style={{ marginRight: 8 }} />Информация о заявке</span>}
            style={{ marginBottom: 20 }}
          >
            <Descriptions bordered column={{ xs: 1, lg: 2 }} size="small">
              <Descriptions.Item label="Ребёнок">
                <Text strong>{getFullName(application.child)}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Дата рождения">
                {formatDate(application.child.birthDate)}
              </Descriptions.Item>
              <Descriptions.Item label="Смена">
                <Text strong>{application.session.title}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Даты смены">
                {formatDate(application.session.startDate)} — {formatDate(application.session.endDate)}
              </Descriptions.Item>
              <Descriptions.Item label="Стоимость">
                <Text strong style={{ color: '#10b981' }}>
                  {formatPrice(application.session.price)}
                </Text>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card
            className="styled-card"
            title={<span><MessageOutlined style={{ marginRight: 8 }} />Чат с менеджером</span>}
            bodyStyle={{ padding: 0 }}
          >
            <ChatWindow applicationId={application.id} />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            className="styled-card"
            title={<span><FileTextOutlined style={{ marginRight: 8 }} />Документы</span>}
          >
            <DocumentsList applicationId={application.id} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ApplicationStatusPage;
