import React, { useEffect, useState } from 'react';
import { Card, Descriptions, Breadcrumb, Tag } from 'antd';
import { HomeOutlined, UserOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
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
    <div>
      <Breadcrumb
        className="mb-4"
        items={[
          {
            href: '/home',
            title: <><HomeOutlined className="mr-1" /><span>首页</span></>,
          },
        ]}
      />

      <Card 
        title={<><UserOutlined className="mr-2" />个人信息</>}
        loading={loading}
        bordered={false}
        className="mb-4 rounded-lg shadow-sm border border-gray-100 font-semibold"
      >
        {user && (
          <Descriptions column={2} bordered>
            <Descriptions.Item label="用户ID">{user.id}</Descriptions.Item>
            <Descriptions.Item label="用户名">{user.username}</Descriptions.Item>
            <Descriptions.Item label="昵称">{user.nickname || '-'}</Descriptions.Item>
            <Descriptions.Item label="邮箱">{user.email || '-'}</Descriptions.Item>
            <Descriptions.Item label="状态">
              {user.status === 1 ? (
                <Tag icon={<CheckCircleOutlined />} color="success">正常</Tag>
              ) : (
                <Tag icon={<CloseCircleOutlined />} color="error">禁用</Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {new Date(user.createdAt).toLocaleString('zh-CN')}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Card>

      <Card 
        title="系统信息" 
        bordered={false}
        className="rounded-lg shadow-sm border border-gray-100 font-semibold"
      >
        <div className="system-info">
          <p className="text-base leading-8 mb-0">✅ 前端: React + TypeScript + Vite + Ant Design</p>
          <p className="text-base leading-8 mb-0">✅ 后端: NestJS + TypeORM + MySQL</p>
          <p className="text-base leading-8 mb-0">✅ 认证: JWT + Passport</p>
          <p className="text-base leading-8 mb-0">✅ 样式: Tailwind CSS + Ant Design Pro 设计规范</p>
          <p className="text-base leading-8 mb-0">🎉 用户管理系统已完成!</p>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
