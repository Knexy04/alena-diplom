import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Steps, notification } from 'antd';
import { MailOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

// Код восстановления всегда фиксированный — бэкенд не задействован
const RESET_CODE = '123456';

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState('');

  const onRequestCode = async (values: { email: string }) => {
    setLoading(true);
    // Имитация отправки кода без обращения к бэкенду
    setTimeout(() => {
      setEmail(values.email);
      setStep(1);
      notification.success({
        message: 'Код отправлен',
        description: 'Если аккаунт с таким email существует, мы отправили на него код подтверждения.',
      });
      setLoading(false);
    }, 500);
  };

  const onResetPassword = async (values: { code: string; newPassword: string }) => {
    setLoading(true);
    // Проверка кода целиком на фронте — корректный код всегда 123456
    setTimeout(() => {
      if (values.code !== RESET_CODE) {
        notification.error({
          message: 'Ошибка',
          description: 'Неверный код или срок его действия истёк',
        });
        setLoading(false);
        return;
      }
      notification.success({
        message: 'Пароль изменён',
        description: 'Теперь вы можете войти с новым паролем.',
      });
      setLoading(false);
      navigate('/login');
    }, 500);
  };

  return (
    <div className="login-page">
      <Card className="login-card">
        <div className="login-logo">
          <img src="/logo.jpg" alt="Джуниор Кэмп" className="login-logo-img" />
          <Title level={3} style={{ margin: 0, letterSpacing: '-0.5px', textAlign: 'center' }}>
            Восстановление пароля
          </Title>
        </div>
        <Text className="login-subtitle">
          {step === 0
            ? 'Введите email — мы отправим код для сброса пароля'
            : `Код отправлен на ${email}`}
        </Text>

        <Steps
          current={step}
          size="small"
          style={{ margin: '20px 0 28px' }}
          items={[{ title: 'Email' }, { title: 'Новый пароль' }]}
        />

        {step === 0 ? (
          <Form layout="vertical" onFinish={onRequestCode} size="large">
            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Введите email' },
                { type: 'email', message: 'Некорректный email' },
              ]}
            >
              <Input
                prefix={<MailOutlined style={{ color: '#94a3b8' }} />}
                placeholder="Email"
              />
            </Form.Item>
            <Form.Item style={{ marginBottom: 12 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                style={{ height: 44, fontWeight: 600, fontSize: 15 }}
              >
                Отправить код
              </Button>
            </Form.Item>
          </Form>
        ) : (
          <Form layout="vertical" onFinish={onResetPassword} size="large">
            <Form.Item
              name="code"
              rules={[
                { required: true, message: 'Введите код из письма' },
                { len: 6, message: 'Код состоит из 6 цифр' },
              ]}
            >
              <Input
                prefix={<SafetyOutlined style={{ color: '#94a3b8' }} />}
                placeholder="Код из письма"
                maxLength={6}
              />
            </Form.Item>
            <Form.Item
              name="newPassword"
              rules={[
                { required: true, message: 'Введите новый пароль' },
                { min: 6, message: 'Минимум 6 символов' },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#94a3b8' }} />}
                placeholder="Новый пароль"
              />
            </Form.Item>
            <Form.Item style={{ marginBottom: 12 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                style={{ height: 44, fontWeight: 600, fontSize: 15 }}
              >
                Сменить пароль
              </Button>
            </Form.Item>
            <Form.Item style={{ marginBottom: 0, textAlign: 'center' }}>
              <Button type="link" onClick={() => setStep(0)}>
                Изменить email
              </Button>
            </Form.Item>
          </Form>
        )}

        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <Link to="/login">Вернуться ко входу</Link>
        </div>
      </Card>
    </div>
  );
};

export default ForgotPasswordPage;
