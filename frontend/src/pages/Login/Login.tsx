import React from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import './Login.less';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuthStore();

  const onFinish = async (values: { username: string; password: string }) => {
    try {
      await login(values.username, values.password);
      
      message.success({
        content: '登录成功!',
        duration: 2,
      });
      
      // 延迟跳转,让用户看到成功提示
      setTimeout(() => {
        navigate('/home');
      }, 800);
    } catch (err) {
      message.error(error || '登录失败，请检查网络或账号密码');
      console.error('Login error:', err);
    }
  };

  return (
    <div className="login-container">
      <Card className="login-card" title="管理系统登录">
        <Form
          name="login"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名!' }]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="用户名" 
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码!' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={Boolean(isLoading.login)}
              block
            >
              登录
            </Button>
          </Form.Item>
        </Form>
        
        <div style={{ textAlign: 'center', color: '#999', marginTop: '16px' }}>
          <p>默认账号: admin / admin123</p>
        </div>
      </Card>
    </div>
  );
};

export default Login;
