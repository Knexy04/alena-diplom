import React, { useEffect, useState } from 'react';
import {
  Card,
  Typography,
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
  Empty,
  Descriptions,
  notification,
} from 'antd';
import { PlusOutlined, EditOutlined, TeamOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { clientsService } from '../../services/clients.service';
import { IChild, ICreateChildRequest } from '../../types/client';
import { formatDate, getFullName } from '../../utils/helpers';

const { Title, Text } = Typography;

interface IChildFormValues {
  firstName: string;
  lastName: string;
  patronymic?: string;
  birthDate: Dayjs;
  medicalNotes?: string;
}

const ChildrenPage: React.FC = () => {
  const [children, setChildren] = useState<IChild[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<IChild | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm<IChildFormValues>();

  const fetchChildren = async () => {
    setLoading(true);
    try {
      const res = await clientsService.getMyChildren();
      setChildren(res.data.data);
    } catch {
      notification.error({ message: 'Не удалось загрузить детей' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChildren();
  }, []);

  const handleOpenAdd = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleOpenEdit = (child: IChild) => {
    setEditing(child);
    form.setFieldsValue({
      firstName: child.firstName,
      lastName: child.lastName,
      patronymic: child.patronymic,
      birthDate: dayjs(child.birthDate),
      medicalNotes: child.medicalNotes,
    });
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
    setEditing(null);
    form.resetFields();
  };

  const handleSubmit = async (values: IChildFormValues) => {
    const payload: ICreateChildRequest = {
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      patronymic: values.patronymic?.trim() || undefined,
      birthDate: values.birthDate.format('YYYY-MM-DD'),
      medicalNotes: values.medicalNotes?.trim() || undefined,
    };
    setSubmitting(true);
    try {
      if (editing) {
        await clientsService.updateChild(editing.id, payload);
        notification.success({ message: 'Данные ребёнка обновлены' });
      } else {
        await clientsService.addMyChild(payload);
        notification.success({ message: 'Ребёнок добавлен' });
      }
      handleClose();
      fetchChildren();
    } catch (e) {
      const err = e as { response?: { data?: { message?: string | string[] } } };
      const msg = err.response?.data?.message;
      notification.error({
        message: Array.isArray(msg) ? msg[0] : msg || 'Ошибка сохранения',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <Title level={4} className="page-title">
          <TeamOutlined style={{ marginRight: 10 }} />
          Мои дети
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenAdd} size="large">
          Добавить ребёнка
        </Button>
      </div>

      {!loading && children.length === 0 ? (
        <Card className="styled-card" style={{ textAlign: 'center', padding: 48 }}>
          <Empty description="Вы ещё не добавили детей" style={{ marginBottom: 24 }}>
            <Button type="primary" icon={<PlusOutlined />} size="large" onClick={handleOpenAdd}>
              Добавить первого ребёнка
            </Button>
          </Empty>
        </Card>
      ) : (
        children.map((child) => (
          <Card
            key={child.id}
            className="styled-card"
            style={{ marginBottom: 12 }}
            title={<Text strong>{getFullName(child)}</Text>}
            extra={
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleOpenEdit(child)}
              >
                Редактировать
              </Button>
            }
          >
            <Descriptions bordered size="small" column={{ xs: 1, lg: 2 }}>
              <Descriptions.Item label="Дата рождения">
                {formatDate(child.birthDate)}
              </Descriptions.Item>
              <Descriptions.Item label="Мед. особенности" span={2}>
                {child.medicalNotes || '—'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        ))
      )}

      <Modal
        title={editing ? 'Редактировать ребёнка' : 'Добавить ребёнка'}
        open={modalOpen}
        onCancel={handleClose}
        onOk={() => form.submit()}
        okText={editing ? 'Сохранить' : 'Добавить'}
        cancelText="Отмена"
        confirmLoading={submitting}
        width={520}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 16 }}>
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
            name="birthDate"
            label="Дата рождения"
            rules={[{ required: true, message: 'Укажите дату рождения' }]}
          >
            <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
          </Form.Item>
          <Form.Item name="medicalNotes" label="Мед. особенности">
            <Input.TextArea
              rows={3}
              placeholder="Аллергии, хронические заболевания и т.д."
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ChildrenPage;
