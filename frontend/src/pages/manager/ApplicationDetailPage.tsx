import React, { useEffect, useState } from 'react';
import {
  Card,
  Descriptions,
  Tag,
  Select,
  Button,
  Modal,
  Row,
  Col,
  Grid,
  Typography,
  Spin,
  notification,
  Steps,
} from 'antd';

const { useBreakpoint } = Grid;
import {
  ArrowLeftOutlined,
  UserOutlined,
  CalendarOutlined,
  FileTextOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { applicationsService } from '../../services/applications.service';
import {
  IApplication,
  ApplicationStatus,
  statusLabels,
  statusColors,
} from '../../types/application';
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

const ApplicationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const [application, setApplication] = useState<IApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState<ApplicationStatus | undefined>();
  const [statusModalOpen, setStatusModalOpen] = useState(false);

  const fetchApplication = async () => {
    if (!id) return;
    try {
      const res = await applicationsService.getById(id);
      setApplication(res.data.data);
    } catch {
      notification.error({ message: 'Ошибка загрузки заявки' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplication();
  }, [id]);

  const handleStatusChange = async () => {
    if (!id || !newStatus) return;
    try {
      await applicationsService.update(id, { status: newStatus });
      notification.success({ message: 'Статус обновлён' });
      setStatusModalOpen(false);
      fetchApplication();
    } catch {
      notification.error({ message: 'Ошибка обновления статуса' });
    }
  };

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  if (!application) return <div>Заявка не найдена</div>;

  const currentStep = statusSteps.indexOf(application.status);

  return (
    <div>
      <Button
        className="back-btn"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/manager/applications')}
      >
        Назад к списку
      </Button>

      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <Title level={4} className="page-title">
            Заявка {application.applicationNumber}
          </Title>
          <Tag className="status-tag" color={statusColors[application.status]} style={{ marginTop: 8 }}>
            {statusLabels[application.status]}
          </Tag>
        </div>
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
            title={<span><FileTextOutlined style={{ marginRight: 8 }} />Данные заявки</span>}
            style={{ marginBottom: 20 }}
          >
            <Descriptions column={{ xs: 1, lg: 2 }} bordered size="small">
              <Descriptions.Item label="Номер">
                <Text strong style={{ color: '#F37022' }}>{application.applicationNumber}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Дата создания">
                {formatDate(application.createdAt)}
              </Descriptions.Item>
              <Descriptions.Item label="Заметки" span={2}>
                {application.notes || '—'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card
            className="styled-card"
            title={<span><UserOutlined style={{ marginRight: 8 }} />Данные ребёнка</span>}
            style={{ marginBottom: 20 }}
          >
            <Descriptions column={{ xs: 1, lg: 2 }} bordered size="small">
              <Descriptions.Item label="ФИО">
                <Text strong>{getFullName(application.child)}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Дата рождения">
                {formatDate(application.child.birthDate)}
              </Descriptions.Item>
              <Descriptions.Item label="Мед. особенности" span={2}>
                {application.child.medicalNotes || '—'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card
            className="styled-card"
            title={<span><UserOutlined style={{ marginRight: 8 }} />Данные родителя</span>}
            style={{ marginBottom: 20 }}
          >
            <Descriptions column={{ xs: 1, lg: 2 }} bordered size="small">
              <Descriptions.Item label="ФИО">
                <Text strong>{getFullName(application.parent)}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Email">{application.parent.email}</Descriptions.Item>
              <Descriptions.Item label="Телефон">{application.parent.phone || '—'}</Descriptions.Item>
            </Descriptions>
          </Card>

          <Card
            className="styled-card"
            title={<span><CalendarOutlined style={{ marginRight: 8 }} />Смена</span>}
          >
            <Descriptions column={{ xs: 1, lg: 2 }} bordered size="small">
              <Descriptions.Item label="Название">
                <Text strong>{application.session.title}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Страна">{application.session.country}</Descriptions.Item>
              <Descriptions.Item label="Даты">
                {formatDate(application.session.startDate)} — {formatDate(application.session.endDate)}
              </Descriptions.Item>
              <Descriptions.Item label="Стоимость">
                <Text strong style={{ color: '#10b981' }}>{formatPrice(application.session.price)}</Text>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card className="styled-card" title="Изменить статус" style={{ marginBottom: 20 }}>
            <Select
              style={{ width: '100%' }}
              value={application.status}
              onChange={(value) => {
                setNewStatus(value);
                setStatusModalOpen(true);
              }}
              options={Object.values(ApplicationStatus).map((s) => ({
                label: statusLabels[s],
                value: s,
              }))}
            />
          </Card>

          <Card
            className="styled-card"
            title={<span><FileTextOutlined style={{ marginRight: 8 }} />Документы</span>}
            style={{ marginBottom: 20 }}
          >
            <DocumentsList applicationId={application.id} />
          </Card>

          <Card
            className="styled-card"
            title={<span><MessageOutlined style={{ marginRight: 8 }} />Чат</span>}
            bodyStyle={{ padding: 0 }}
          >
            <ChatWindow applicationId={application.id} compact />
          </Card>
        </Col>
      </Row>

      <Modal
        title="Подтверждение"
        open={statusModalOpen}
        onOk={handleStatusChange}
        onCancel={() => setStatusModalOpen(false)}
        okText="Подтвердить"
        cancelText="Отмена"
      >
        <p>Изменить статус заявки на «{newStatus ? statusLabels[newStatus] : ''}»?</p>
      </Modal>
    </div>
  );
};

export default ApplicationDetailPage;
