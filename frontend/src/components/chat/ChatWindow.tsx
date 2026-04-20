import React, { useEffect, useState, useRef } from 'react';
import { Input, Button, Upload, notification } from 'antd';
import { SendOutlined, PaperClipOutlined } from '@ant-design/icons';
import { chatService } from '../../services/chat.service';
import { useSocket } from '../../hooks/useSocket';
import { useAuthStore } from '../../store/authStore';
import { IMessage } from '../../types/chat';
import { formatDateTime } from '../../utils/helpers';

interface ChatWindowProps {
  applicationId: string;
  compact?: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ applicationId, compact }) => {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();
  const { sendMessage, onNewMessage, markAsRead } = useSocket(applicationId);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await chatService.getMessages(applicationId);
        setMessages(res.data.data.items);
      } catch {
        // handled
      }
    };
    fetchMessages();
  }, [applicationId]);

  useEffect(() => {
    const unsub = onNewMessage((message: IMessage) => {
      setMessages((prev) => [...prev, message]);
      markAsRead(applicationId);
    });
    return unsub;
  }, [onNewMessage, markAsRead, applicationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!text.trim()) return;
    sendMessage({ applicationId, text });
    setText('');
  };

  const handleFileUpload = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      notification.error({ message: 'Файл слишком большой', description: 'Максимальный размер — 10 МБ' });
      return;
    }
    setLoading(true);
    try {
      await chatService.uploadFile(applicationId, file);
    } catch {
      notification.error({ message: 'Ошибка загрузки файла' });
    } finally {
      setLoading(false);
    }
  };

  const height = compact ? 320 : 460;

  return (
    <div className="chat-container" style={{ height }}>
      <div className="chat-messages" style={{ flex: 1, overflowY: 'auto', padding: 16, background: '#f8fafc' }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: 40, fontSize: 13 }}>
            Нет сообщений. Начните диалог!
          </div>
        )}
        {messages.map((msg) => {
          const isOurSide = msg.sender?.role
            ? msg.sender.role === user?.role
            : msg.senderId === user?.id;
          const isMine = msg.senderId === user?.id;
          const senderLabel = !isMine && isOurSide && msg.sender
            ? `${msg.sender.firstName} ${msg.sender.lastName}`.trim()
            : null;
          return (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                justifyContent: isOurSide ? 'flex-end' : 'flex-start',
                marginBottom: 8,
              }}
            >
              <div className={`chat-bubble ${isOurSide ? 'chat-bubble-mine' : 'chat-bubble-other'}`}>
                {senderLabel && (
                  <div style={{ fontSize: 11, opacity: 0.75, marginBottom: 4, fontWeight: 600 }}>
                    {senderLabel}
                  </div>
                )}
                {msg.text && <div style={{ lineHeight: 1.5 }}>{msg.text}</div>}
                {msg.filePath && (
                  <div style={{ marginTop: 6 }}>
                    {msg.filePath.match(/\.(jpg|jpeg|png)$/i) ? (
                      <img
                        src={`/api/uploads/${msg.filePath}`}
                        alt={msg.fileName || 'file'}
                        style={{ maxWidth: 200, borderRadius: 8 }}
                      />
                    ) : (
                      <a
                        href={`/api/uploads/${msg.filePath}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: isOurSide ? '#FFE4CC' : '#F37022', textDecoration: 'underline' }}
                      >
                        {msg.fileName || 'Файл'}
                      </a>
                    )}
                  </div>
                )}
                <div className="chat-time">
                  {formatDateTime(msg.createdAt)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      <div className="chat-input-bar">
        <Upload
          beforeUpload={(file) => {
            handleFileUpload(file);
            return false;
          }}
          showUploadList={false}
          accept=".pdf,.jpg,.jpeg,.png"
        >
          <Button
            icon={<PaperClipOutlined />}
            loading={loading}
            style={{ borderRadius: 10, width: 40, height: 40 }}
          />
        </Upload>
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onPressEnter={handleSend}
          placeholder="Введите сообщение..."
          style={{ borderRadius: 10 }}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSend}
          style={{ borderRadius: 10, width: 40, height: 40 }}
        />
      </div>
    </div>
  );
};

export default ChatWindow;
