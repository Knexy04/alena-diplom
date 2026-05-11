import React, { useEffect, useState } from 'react';
import {
  Table,
  Tag,
  Typography,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Switch,
  Popconfirm,
  notification,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CalendarOutlined, FileExcelOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { sessionsService, ICreateSessionRequest } from '../../services/sessions.service';
import { ISession } from '../../types/application';
import { formatDate, formatPrice } from '../../utils/helpers';

const { Title } = Typography;
const { RangePicker } = DatePicker;

interface ISessionFormValues {
  title: string;
  country: string;
  range: [Dayjs, Dayjs];
  capacity: number;
  price: number;
  isActive: boolean;
}

const SessionsPage: React.FC = () => {
  const [sessions, setSessions] = useState<ISession[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ISession | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm<ISessionFormValues>();

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await sessionsService.getAllForManager();
      setSessions(res.data.data);
    } catch {
      notification.error({ message: 'Не удалось загрузить смены' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleOpenCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true });
    setModalOpen(true);
  };

  const handleOpenEdit = (session: ISession) => {
    setEditing(session);
    form.setFieldsValue({
      title: session.title,
      country: session.country,
      range: [dayjs(session.startDate), dayjs(session.endDate)],
      capacity: session.capacity,
      price: Number(session.price),
      isActive: session.isActive,
    });
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
    setEditing(null);
    form.resetFields();
  };

  const handleSubmit = async (values: ISessionFormValues) => {
    const payload: ICreateSessionRequest = {
      title: values.title.trim(),
      country: values.country.trim(),
      startDate: values.range[0].format('YYYY-MM-DD'),
      endDate: values.range[1].format('YYYY-MM-DD'),
      capacity: values.capacity,
      price: values.price,
      isActive: values.isActive,
    };
    setSubmitting(true);
    try {
      if (editing) {
        await sessionsService.update(editing.id, payload);
        notification.success({ message: 'Смена обновлена' });
      } else {
        await sessionsService.create(payload);
        notification.success({ message: 'Смена создана' });
      }
      handleClose();
      fetchSessions();
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } };
      notification.error({
        message: err.response?.data?.message || 'Ошибка сохранения смены',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await sessionsService.remove(id);
      notification.success({ message: 'Смена удалена' });
      fetchSessions();
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } };
      notification.error({
        message: err.response?.data?.message || 'Не удалось удалить смену',
      });
    }
  };

  const handleExport = async (session: ISession) => {
    try {
      const res = await sessionsService.exportXlsx(session.id);
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const filename = extractFilename(res.headers?.['content-disposition'])
        || `session_${session.title}_${session.startDate}.xlsx`;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      notification.error({ message: 'Не удалось скачать таблицу' });
    }
  };

  const columns = [
    {
      title: 'Название',
      key: 'title',
      render: (_: unknown, r: ISession) => (
        <div>
          <div style={{ fontWeight: 600 }}>{r.title}</div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>{r.country}</div>
        </div>
      ),
    },
    {
      title: 'Даты',
      key: 'dates',
      render: (_: unknown, r: ISession) => (
        <span style={{ color: '#64748b' }}>
          <CalendarOutlined style={{ marginRight: 6 }} />
          {formatDate(r.startDate)} — {formatDate(r.endDate)}
        </span>
      ),
    },
    {
      title: 'Мест',
      dataIndex: 'capacity',
      key: 'capacity',
      width: 100,
    },
    {
      title: 'Цена',
      key: 'price',
      width: 140,
      render: (_: unknown, r: ISession) => (
        <span style={{ fontWeight: 600, color: '#10b981' }}>{formatPrice(Number(r.price))}</span>
      ),
    },
    {
      title: 'Статус',
      key: 'isActive',
      width: 120,
      render: (_: unknown, r: ISession) =>
        r.isActive ? (
          <Tag color="green">Активна</Tag>
        ) : (
          <Tag color="default">Скрыта</Tag>
        ),
    },
    {
      title: '',
      key: 'actions',
      width: 160,
      render: (_: unknown, r: ISession) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            size="small"
            icon={<FileExcelOutlined />}
            title="Скачать список участников"
            onClick={(e) => {
              e.stopPropagation();
              handleExport(r);
            }}
          />
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              handleOpenEdit(r);
            }}
          />
          <Popconfirm
            title="Удалить смену?"
            description="Это действие необратимо."
            okText="Удалить"
            cancelText="Отмена"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(r.id)}
            onCancel={(e) => e?.stopPropagation()}
          >
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={(e) => e.stopPropagation()}
            />
          </Popconfirm>
        </div>
      ),
    },
  ];

  function extractFilename(disposition?: string): string | null {
    if (!disposition) return null;
    const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(disposition);
    if (utf8?.[1]) {
      try {
        return decodeURIComponent(utf8[1]);
      } catch {
        return utf8[1];
      }
    }
    const plain = /filename="?([^";]+)"?/i.exec(disposition);
    return plain?.[1] ?? null;
  }

  return (
    <div>
      <div className="page-header">
        <Title level={4} className="page-title">Смены</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate} size="large">
          Новая смена
        </Button>
      </div>

      <div className="styled-table">
        <Table
          dataSource={sessions}
          columns={columns}
          rowKey="id"
          loading={loading}
          scroll={{ x: 700 }}
          pagination={false}
        />
      </div>

      <Modal
        title={editing ? 'Редактировать смену' : 'Новая смена'}
        open={modalOpen}
        onCancel={handleClose}
        onOk={() => form.submit()}
        okText={editing ? 'Сохранить' : 'Создать'}
        cancelText="Отмена"
        confirmLoading={submitting}
        width={560}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          style={{ marginTop: 16 }}
          initialValues={{ isActive: true }}
        >
          <Form.Item
            name="title"
            label="Название"
            rules={[{ required: true, message: 'Введите название' }]}
          >
            <Input placeholder="Например: 4-я смена — Грузия" />
          </Form.Item>
          <Form.Item
            name="country"
            label="Страна"
            rules={[{ required: true, message: 'Укажите страну' }]}
          >
            <Input placeholder="Грузия" />
          </Form.Item>
          <Form.Item
            name="range"
            label="Даты"
            rules={[{ required: true, message: 'Выберите даты' }]}
          >
            <RangePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
          </Form.Item>
          <Form.Item
            name="capacity"
            label="Вместимость (мест)"
            rules={[{ required: true, message: 'Укажите количество мест' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="price"
            label="Цена (₽)"
            rules={[{ required: true, message: 'Укажите цену' }]}
          >
            <InputNumber
              min={0}
              step={1000}
              style={{ width: '100%' }}
              formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
            />
          </Form.Item>
          <Form.Item name="isActive" label="Активна" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SessionsPage;
