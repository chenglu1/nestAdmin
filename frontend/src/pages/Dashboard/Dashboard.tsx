import React, { useEffect, useState } from 'react';
import { Card, Descriptions, Breadcrumb, Tag, Row, Col, Statistic } from 'antd';
import { 
  HomeOutlined, 
  UserOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  TeamOutlined,
  SafetyOutlined,
  MenuOutlined,
  FileTextOutlined,
  ArrowUpOutlined
} from '@ant-design/icons';
import { getUserProfile, type UserProfile } from '@/api/auth';

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await getUserProfile();
      setUser(response.data);
    } catch (error) {
      console.error('获取用户信息失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <Breadcrumb
        className="mb-6"
        items={[
          {
            href: '/home',
            title: <><HomeOutlined className="mr-1" /><span>首页</span></>,
          },
        ]}
      />

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card hover:shadow-lg transition-all duration-300 border-0" style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '12px'
          }}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.9)' }}>总用户数</span>}
              value={1128}
              prefix={<TeamOutlined style={{ color: 'rgba(255,255,255,0.9)' }} />}
              valueStyle={{ color: '#fff', fontWeight: 600 }}
              suffix={<ArrowUpOutlined style={{ color: '#52c41a', fontSize: '14px' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card hover:shadow-lg transition-all duration-300 border-0" style={{ 
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            borderRadius: '12px'
          }}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.9)' }}>角色数量</span>}
              value={24}
              prefix={<SafetyOutlined style={{ color: 'rgba(255,255,255,0.9)' }} />}
              valueStyle={{ color: '#fff', fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card hover:shadow-lg transition-all duration-300 border-0" style={{ 
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            borderRadius: '12px'
          }}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.9)' }}>菜单数量</span>}
              value={48}
              prefix={<MenuOutlined style={{ color: 'rgba(255,255,255,0.9)' }} />}
              valueStyle={{ color: '#fff', fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card hover:shadow-lg transition-all duration-300 border-0" style={{ 
            background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            borderRadius: '12px'
          }}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.9)' }}>操作日志</span>}
              value={8562}
              prefix={<FileTextOutlined style={{ color: 'rgba(255,255,255,0.9)' }} />}
              valueStyle={{ color: '#fff', fontWeight: 600 }}
              suffix={<ArrowUpOutlined style={{ color: '#fff', fontSize: '14px' }} />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card 
            title={
              <span className="flex items-center">
                <UserOutlined className="mr-2 text-blue-500" />
                <span className="font-semibold">个人信息</span>
              </span>
            }
            loading={loading}
            bordered={false}
            className="shadow-sm border-0 rounded-xl"
            style={{ borderRadius: '12px' }}
          >
            {user && (
              <Descriptions column={1} bordered className="rounded-lg overflow-hidden">
                <Descriptions.Item label="用户ID" className="py-3">
                  <span className="font-mono">{user.id}</span>
                </Descriptions.Item>
                <Descriptions.Item label="用户名" className="py-3">
                  <span className="font-medium">{user.username}</span>
                </Descriptions.Item>
                <Descriptions.Item label="昵称" className="py-3">
                  {user.nickname || <span className="text-gray-400">未设置</span>}
                </Descriptions.Item>
                <Descriptions.Item label="邮箱" className="py-3">
                  {user.email || <span className="text-gray-400">未设置</span>}
                </Descriptions.Item>
                <Descriptions.Item label="状态" className="py-3">
                  {user.status === 1 ? (
                    <Tag icon={<CheckCircleOutlined />} color="success" className="px-3 py-1">
                      正常
                    </Tag>
                  ) : (
                    <Tag icon={<CloseCircleOutlined />} color="error" className="px-3 py-1">
                      禁用
                    </Tag>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="创建时间" className="py-3">
                  {new Date(user.createdAt).toLocaleString('zh-CN')}
                </Descriptions.Item>
              </Descriptions>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card 
            title={
              <span className="flex items-center">
                <span className="text-green-500 mr-2">✨</span>
                <span className="font-semibold">系统信息</span>
              </span>
            }
            bordered={false}
            className="shadow-sm border-0 rounded-xl h-full"
            style={{ borderRadius: '12px' }}
          >
            <div className="system-info space-y-3">
              <div className="flex items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                <span className="text-blue-500 mr-2">⚛️</span>
                <span className="text-sm font-medium">前端: React + TypeScript + Vite</span>
              </div>
              <div className="flex items-center p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                <span className="text-purple-500 mr-2">🚀</span>
                <span className="text-sm font-medium">后端: NestJS + TypeORM + MySQL</span>
              </div>
              <div className="flex items-center p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                <span className="text-green-500 mr-2">🔐</span>
                <span className="text-sm font-medium">认证: JWT + Passport</span>
              </div>
              <div className="flex items-center p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
                <span className="text-orange-500 mr-2">🎨</span>
                <span className="text-sm font-medium">样式: Tailwind CSS + Ant Design</span>
              </div>
              <div className="flex items-center p-3 bg-pink-50 rounded-lg hover:bg-pink-100 transition-colors mt-4">
                <span className="text-pink-500 mr-2 text-lg">🎉</span>
                <span className="text-sm font-semibold">用户管理系统已完成!</span>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
