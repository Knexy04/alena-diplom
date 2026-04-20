import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Tabs } from 'antd';
import { MailOutlined, LockOutlined, UserOutlined, PhoneOutlined } from '@ant-design/icons';
import { useAuth } from '../../hooks/useAuth';

const { Title, Text } = Typography;

const LoginPage: React.FC = () => {
  const { login, register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');

  const onLogin = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      await login(values);
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async (values: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    patronymic?: string;
    phone?: string;
  }) => {
    setLoading(true);
    try {
      await register(values);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <Card className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">JC</div>
          <Title level={3} style={{ margin: 0, letterSpacing: '-0.5px' }}>
            Junior Camp
          </Title>
        </div>
        <Text className="login-subtitle">
          Система управления детским лагерем
        </Text>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          centered
          items={[
            {
              key: 'login',
              label: 'Вход',
              children: (
                <Form layout="vertical" onFinish={onLogin} size="large">
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
                  <Form.Item
                    name="password"
                    rules={[{ required: true, message: 'Введите пароль' }]}
                  >
                    <Input.Password
                      prefix={<LockOutlined style={{ color: '#94a3b8' }} />}
                      placeholder="Пароль"
                    />
                  </Form.Item>
                  <Form.Item style={{ marginBottom: 0 }}>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      block
                      style={{ height: 44, fontWeight: 600, fontSize: 15 }}
                    >
                      Войти в систему
                    </Button>
                  </Form.Item>
                </Form>
              ),
            },
            {
              key: 'register',
              label: 'Регистрация',
              children: (
                <Form layout="vertical" onFinish={onRegister} size="large">
                  <div style={{ display: 'flex', gap: 12 }}>
                    <Form.Item
                      name="lastName"
                      rules={[{ required: true, message: 'Введите фамилию' }]}
                      style={{ flex: 1 }}
                    >
                      <Input prefix={<UserOutlined style={{ color: '#94a3b8' }} />} placeholder="Фамилия" />
                    </Form.Item>
                    <Form.Item
                      name="firstName"
                      rules={[{ required: true, message: 'Введите имя' }]}
                      style={{ flex: 1 }}
                    >
                      <Input prefix={<UserOutlined style={{ color: '#94a3b8' }} />} placeholder="Имя" />
                    </Form.Item>
                  </div>
                  <Form.Item name="patronymic">
                    <Input prefix={<UserOutlined style={{ color: '#94a3b8' }} />} placeholder="Отчество" />
                  </Form.Item>
                  <Form.Item
                    name="email"
                    rules={[
                      { required: true, message: 'Введите email' },
                      { type: 'email', message: 'Некорректный email' },
                    ]}
                  >
                    <Input prefix={<MailOutlined style={{ color: '#94a3b8' }} />} placeholder="Email" />
                  </Form.Item>
                  <Form.Item name="phone">
                    <Input prefix={<PhoneOutlined style={{ color: '#94a3b8' }} />} placeholder="Телефон" />
                  </Form.Item>
                  <Form.Item
                    name="password"
                    rules={[
                      { required: true, message: 'Введите пароль' },
                      { min: 6, message: 'Минимум 6 символов' },
                    ]}
                  >
                    <Input.Password prefix={<LockOutlined style={{ color: '#94a3b8' }} />} placeholder="Пароль" />
                  </Form.Item>
                  <Form.Item style={{ marginBottom: 0 }}>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      block
                      style={{ height: 44, fontWeight: 600, fontSize: 15 }}
                    >
                      Зарегистрироваться
                    </Button>
                  </Form.Item>
                </Form>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default LoginPage;
