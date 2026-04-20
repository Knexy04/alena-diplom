import React, { useEffect, useState } from 'react';
import { List, Button, Upload, Modal, Select, notification, Typography } from 'antd';
import {
  UploadOutlined,
  DownloadOutlined,
  DeleteOutlined,
  FileOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import { documentsService } from '../../services/documents.service';
import { IDocument, DocumentType, documentTypeLabels } from '../../types/document';
import { formatDate, formatFileSize } from '../../utils/helpers';
import { useAuthStore } from '../../store/authStore';
import { UserRole } from '../../types/user';

const { Text } = Typography;

interface DocumentsListProps {
  applicationId: string;
}

const DocumentsList: React.FC<DocumentsListProps> = ({ applicationId }) => {
  const [documents, setDocuments] = useState<IDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [docType, setDocType] = useState<DocumentType>(DocumentType.OTHER);
  const { user } = useAuthStore();

  const fetchDocuments = async () => {
    try {
      const res = await documentsService.getByApplication(applicationId);
      setDocuments(res.data.data);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [applicationId]);

  const handleUpload = async (file: File) => {
    try {
      await documentsService.upload(applicationId, file, docType);
      notification.success({ message: 'Документ загружен' });
      setUploadModalOpen(false);
      fetchDocuments();
    } catch {
      notification.error({ message: 'Ошибка загрузки' });
    }
    return false;
  };

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

  const handleDelete = async (doc: IDocument) => {
    Modal.confirm({
      title: 'Удалить документ?',
      content: doc.originalName,
      okText: 'Удалить',
      cancelText: 'Отмена',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await documentsService.remove(doc.id);
          notification.success({ message: 'Документ удалён' });
          fetchDocuments();
        } catch {
          notification.error({ message: 'Ошибка удаления' });
        }
      },
    });
  };

  const getIcon = (mimeType: string) => {
    if (mimeType === 'application/pdf') return <FilePdfOutlined style={{ color: '#ef4444', fontSize: 18 }} />;
    if (mimeType.startsWith('image/')) return <FileImageOutlined style={{ color: '#3b82f6', fontSize: 18 }} />;
    return <FileOutlined style={{ fontSize: 18, color: '#64748b' }} />;
  };

  return (
    <div>
      <Button
        icon={<UploadOutlined />}
        onClick={() => setUploadModalOpen(true)}
        style={{ marginBottom: 12, borderRadius: 8 }}
        size="small"
        type="primary"
        ghost
      >
        Загрузить
      </Button>
      <List
        loading={loading}
        dataSource={documents}
        size="small"
        renderItem={(doc) => (
          <List.Item
            actions={[
              <Button
                size="small"
                icon={<DownloadOutlined />}
                onClick={() => handleDownload(doc)}
                style={{ borderRadius: 6 }}
              />,
              ...(user?.role === UserRole.MANAGER
                ? [
                    <Button
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleDelete(doc)}
                      style={{ borderRadius: 6 }}
                    />,
                  ]
                : []),
            ]}
          >
            <List.Item.Meta
              avatar={getIcon(doc.mimeType)}
              title={<Text ellipsis style={{ maxWidth: 150, fontSize: 13 }}>{doc.originalName}</Text>}
              description={
                <span style={{ fontSize: 11, color: '#94a3b8' }}>
                  {documentTypeLabels[doc.type]} · {formatFileSize(doc.fileSize)}
                </span>
              }
            />
          </List.Item>
        )}
        locale={{ emptyText: 'Нет документов' }}
      />

      <Modal
        title="Загрузить документ"
        open={uploadModalOpen}
        onCancel={() => setUploadModalOpen(false)}
        footer={null}
      >
        <Select
          value={docType}
          onChange={setDocType}
          style={{ width: '100%', marginBottom: 16 }}
          options={Object.values(DocumentType).map((t) => ({
            label: documentTypeLabels[t],
            value: t,
          }))}
        />
        <Upload.Dragger
          beforeUpload={(file) => {
            handleUpload(file);
            return false;
          }}
          accept=".pdf,.jpg,.jpeg,.png"
          showUploadList={false}
        >
          <p style={{ marginBottom: 8 }}>
            <InboxOutlined style={{ fontSize: 40, color: '#FFA45C' }} />
          </p>
          <p style={{ fontWeight: 500, marginBottom: 4 }}>Нажмите или перетащите файл</p>
          <p style={{ color: '#94a3b8', fontSize: 13 }}>PDF, JPG, PNG (до 10MB)</p>
        </Upload.Dragger>
      </Modal>
    </div>
  );
};

export default DocumentsList;
