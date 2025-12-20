import React from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { useAuthStore } from '@/stores/authStore';
// 使用Tailwind CSS替代Less文件

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuthStore();

  const onFinish = async (values: { username: string; password: string }) => {
    try {
      // 清除之前的错误
      useAuthStore.setState({ error: null });
      
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
      // 错误已经在 request 拦截器中统一处理（登录接口会静默处理，不显示提示）
      // 这里只需要从错误对象中提取消息用于组件内显示
      let errorMessage = '登录失败，请检查网络或账号密码';
      
      if (err instanceof AxiosError) {
        // Axios 错误
        const apiResponse = err.response?.data as { message?: string } | undefined;
        errorMessage = apiResponse?.message || err.message || error || errorMessage;
      } else if (err instanceof Error) {
        // 普通错误
        errorMessage = err.message || error || errorMessage;
      } else if (error) {
        // 使用 store 中的错误信息
        errorMessage = error;
      }
      
      message.error(errorMessage);
      console.error('Login error:', err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4 sm:p-6" style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)',
      backgroundSize: '400% 400%',
      animation: 'gradientShift 15s ease infinite'
    }}>
      {/* 网格背景 */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `
          linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px'
      }}></div>
      
      {/* 大型装饰元素 - 左上 */}
      <div 
        className="absolute top-0 left-0 w-96 h-96 rounded-full opacity-30 blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(102, 126, 234, 0.6) 0%, transparent 70%)',
          animation: 'float 20s ease-in-out infinite',
          transform: 'translate(-30%, -30%)'
        }}
      ></div>
      
      {/* 大型装饰元素 - 右下 */}
      <div 
        className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full opacity-30 blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(0, 242, 254, 0.6) 0%, transparent 70%)',
          animation: 'float 25s ease-in-out infinite reverse',
          transform: 'translate(30%, 30%)'
        }}
      ></div>
      
      {/* 中型装饰元素 - 右上 */}
      <div 
        className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full opacity-25 blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(240, 147, 251, 0.5) 0%, transparent 70%)',
          animation: 'float 18s ease-in-out infinite',
        }}
      ></div>
      
      {/* 中型装饰元素 - 左下 */}
      <div 
        className="absolute bottom-1/4 left-1/4 w-72 h-72 rounded-full opacity-25 blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(118, 75, 162, 0.5) 0%, transparent 70%)',
          animation: 'float 22s ease-in-out infinite reverse',
        }}
      ></div>
      
      {/* 小型装饰元素 - 增加层次感 */}
      <div 
        className="absolute top-1/2 left-1/3 w-40 h-40 rounded-full opacity-20 blur-2xl"
        style={{
          background: 'radial-gradient(circle, rgba(79, 172, 254, 0.4) 0%, transparent 70%)',
          animation: 'float 15s ease-in-out infinite',
        }}
      ></div>
      
      {/* 添加CSS动画 */}
      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
      `}</style>
      
      <Card 
        className="w-full max-w-[420px] border-0 rounded-2xl shadow-2xl transition-all duration-300 hover:shadow-3xl sm:max-w-[400px] relative z-10" 
        style={{ 
          borderRadius: '16px',
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)'
        }}
        title={
          <div className="text-center py-2">
            <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              管理系统登录
            </h1>
            <p className="text-sm text-gray-500">欢迎回来，请登录您的账户</p>
          </div>
        }
      >
        <Form
          name="login"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名!' }]}
            className="mb-5"
          >
            <Input 
              prefix={<UserOutlined className="text-blue-500" />} 
              placeholder="请输入用户名" 
              size="large"
              className="rounded-xl border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all h-12"
              style={{ borderRadius: '12px' }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码!' }]}
            className="mb-6"
          >
            <Input.Password
              prefix={<LockOutlined className="text-blue-500" />}
              placeholder="请输入密码"
              size="large"
              className="rounded-xl border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all h-12"
              style={{ borderRadius: '12px' }}
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={Boolean(isLoading.login)}
              block
              size="large"
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-2 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] font-semibold"
              style={{ height: '48px' }}
            >
              登录
            </Button>
          </Form.Item>
        </Form>
        
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200/50">
          <p className="text-center text-blue-700 text-sm font-medium">
            <span className="inline-block mr-2">💡</span>
            默认账号: <span className="font-mono font-semibold">admin</span> / <span className="font-mono font-semibold">admin123</span>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Login;
