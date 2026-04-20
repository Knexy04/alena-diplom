import React, { useEffect, useState } from 'react';
import { Table, Typography, Select, Button, notification } from 'antd';
import { DownloadOutlined, FileOutlined, FilePdfOutlined, FileImageOutlined, FolderOutlined } from '@ant-design/icons';
import { applicationsService } from '../../services/applications.service';
import { documentsService } from '../../services/documents.service';
import { IDocument, DocumentType, documentTypeLabels } from '../../types/document';
import { formatDate, formatFileSize } from '../../utils/helpers';

const { Title } = Typography;

const DocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<IDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<DocumentType | undefined>();

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const appsRes = await applicationsService.getAll({ limit: 100 });
        const apps = appsRes.data.data.items;

        const allDocs: IDocument[] = [];
        for (const app of apps) {
          const docsRes = await documentsService.getByApplication(app.id);
          allDocs.push(...docsRes.data.data);
        }
        setDocuments(allDocs);
      } catch {
        notification.error({ message: 'Ошибка загрузки документов' });
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const filteredDocs = typeFilter
    ? documents.filter((d) => d.type === typeFilter)
    : documents;

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

  const getIcon = (mimeType: string) => {
    if (mimeType === 'application/pdf') return <FilePdfOutlined style={{ color: '#ef4444', fontSize: 18 }} />;
    if (mimeType?.startsWith('image/')) return <FileImageOutlined style={{ color: '#3b82f6', fontSize: 18 }} />;
    return <FileOutlined style={{ fontSize: 18, color: '#64748b' }} />;
  };

  const columns = [
    {
      title: 'Название',
      key: 'name',
      render: (_: unknown, record: IDocument) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {getIcon(record.mimeType)}
          <span style={{ fontWeight: 500 }}>{record.originalName}</span>
        </div>
      ),
    },
    {
      title: 'Тип',
      key: 'type',
      render: (_: unknown, record: IDocument) => (
        <span style={{ color: '#64748b' }}>{documentTypeLabels[record.type]}</span>
      ),
    },
    {
      title: 'Размер',
      key: 'size',
      render: (_: unknown, record: IDocument) => (
        <span style={{ color: '#94a3b8' }}>{formatFileSize(record.fileSize)}</span>
      ),
    },
    {
      title: 'Дата',
      key: 'date',
      render: (_: unknown, record: IDocument) => (
        <span style={{ color: '#94a3b8' }}>{formatDate(record.createdAt)}</span>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 120,
      render: (_: unknown, record: IDocument) => (
        <Button
          icon={<DownloadOutlined />}
          size="small"
          onClick={() => handleDownload(record)}
          type="primary"
          ghost
        >
          Скачать
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <Title level={4} className="page-title">
          <FolderOutlined style={{ marginRight: 10 }} />
          Мои документы
        </Title>
      </div>

      <div className="filters-bar" style={{ marginBottom: 20 }}>
        <Select
          placeholder="Фильтр по типу"
          allowClear
          style={{ minWidth: 250 }}
          onChange={(value) => setTypeFilter(value)}
          options={Object.values(DocumentType).map((t) => ({
            label: documentTypeLabels[t],
            value: t,
          }))}
        />
      </div>

      <div className="styled-table">
        <Table
          dataSource={filteredDocs}
          columns={columns}
          rowKey="id"
          loading={loading}
          scroll={{ x: 500 }}
        />
      </div>
    </div>
  );
};

export default DocumentsPage;
