import React from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
// 使用Tailwind CSS替代Less文件

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 relative overflow-hidden p-4 sm:p-6">
      {/* 装饰元素 - 参考图片设计，添加动画效果 */}
      <div className="absolute top-0 left-0 w-64 h-64 sm:w-96 sm:h-96 bg-blue-400 rounded-full opacity-10 -translate-x-1/2 -translate-y-1/2 blur-2xl sm:blur-3xl animate-pulse [animation-duration:8s]"></div>
      <div className="absolute bottom-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-indigo-400 rounded-full opacity-10 translate-x-1/2 translate-y-1/2 blur-2xl sm:blur-3xl animate-pulse [animation-duration:10s]"></div>
      <div className="absolute top-1/3 right-1/4 w-40 h-40 sm:w-64 sm:h-64 bg-purple-400 rounded-full opacity-10 blur-2xl sm:blur-3xl animate-pulse [animation-duration:12s]"></div>
      
      <Card className="w-full max-w-[420px] bg-white/95 backdrop-blur-sm border border-gray-100 rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl sm:max-w-[400px]" title="管理系统登录">
        <Form
          name="login"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名!' }]}
            className="mb-4"
          >
            <Input 
              prefix={<UserOutlined className="text-gray-400" />} 
              placeholder="用户名" 
              className="rounded-lg border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码!' }]}
            className="mb-6"
          >
            <Input.Password
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="密码"
              className="rounded-lg border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all"
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={Boolean(isLoading.login)}
              block
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-2 rounded-lg transition-all shadow-md hover:shadow-lg"
            >
              登录
            </Button>
          </Form.Item>
        </Form>
        
        <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-center text-blue-700 text-sm">默认账号: admin / admin123</p>
        </div>
      </Card>
    </div>
  );
};

export default Login;
