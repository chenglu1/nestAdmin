/*
 * @Author: chenglu chenglud@digitalchina.com
 * @Description: Pro 风格的主布局组件 - 支持侧边栏展开收起、用户菜单在底部
 */
import React, { useEffect, useState } from 'react';
import { Layout, Button, Space, message, Menu, Dropdown, Avatar, Divider, Spin } from 'antd';
import type { MenuProps } from 'antd';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import {
  UserOutlined,
  LogoutOutlined,
  TeamOutlined,
  HomeOutlined,
  MenuOutlined,
  SafetyOutlined,
  FileTextOutlined,
  SettingOutlined,
  DashboardOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DesktopOutlined,
  BugOutlined,
} from '@ant-design/icons';
import { getUserProfile, type UserProfile } from '@/api/auth';
import { getUserMenus } from '@/api/menu';
import './Layout.less';

const { Header, Content, Sider } = Layout;

// 图标映射
const IconMap: Record<string, React.ReactNode> = {
  HomeOutlined: <HomeOutlined />,
  UserOutlined: <UserOutlined />,
  TeamOutlined: <TeamOutlined />,
  MenuOutlined: <MenuOutlined />,
  SafetyOutlined: <SafetyOutlined />,
  FileTextOutlined: <FileTextOutlined />,
  SettingOutlined: <SettingOutlined />,
  DashboardOutlined: <DashboardOutlined />,
};

interface MenuItem {
  id: number;
  name: string;
  path: string;
  icon?: string;
  children?: MenuItem[];
}

const ProLayout: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([fetchUserProfile(), fetchMenus()]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await getUserProfile();
      setUser(response.data);
    } catch (error) {
      console.error('获取用户信息失败:', error);
      message.error('获取用户信息失败');
    }
  };

  const fetchMenus = async () => {
    try {
      const response = await getUserMenus();
      setMenus(response.data);
    } catch (error) {
      console.error('获取菜单失败:', error);
      message.error('获取菜单失败');
    }
  };

  const currentPath = location.pathname;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    message.success('退出登录成功!');
    navigate('/login');
  };

  const handleMenuClick = (key: string) => {
    navigate(key);
  };

  // 用户菜单项
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
      onClick: () => {
        message.info('个人资料功能开发中');
      },
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '账户设置',
      onClick: () => {
        message.info('账户设置功能开发中');
      },
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
      onClick: handleLogout,
    },
  ];

  if (loading) {
    return (
      <div className="layout-loading">
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  return (
    <Layout className="pro-layout">
      {/* 顶部Header */}
      <Header className="pro-header">
        <div className="header-left">
          <Button
            type="text"
            size="large"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            className="layout-trigger"
          />
          <h1 className="logo-title">🎯 管理系统</h1>
        </div>

        <div className="header-right">
          {/* 快捷操作按钮 */}
          <Space size="middle">
            <Button
              type="text"
              icon={<DesktopOutlined />}
              title="系统通知"
            />
            <Button
              type="text"
              icon={<BugOutlined />}
              title="问题反馈"
            />
          </Space>
        </div>
      </Header>

      {/* 主体布局 */}
      <Layout className="pro-site-layout">
        {/* 侧边栏 */}
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          width={216}
          className="pro-sider"
        >
          <div className="sider-content">
            {/* 菜单区域 */}
            <div className="sider-menu-wrapper">
              <Menu
                mode="inline"
                selectedKeys={[currentPath]}
                theme="dark"
                items={menus.map((menu) => ({
                  key: menu.path,
                  icon: IconMap[menu.icon || 'MenuOutlined'] || <MenuOutlined />,
                  label: menu.name,
                  onClick: () => handleMenuClick(menu.path),
                  children: menu.children?.map((child) => ({
                    key: child.path,
                    label: child.name,
                    onClick: () => handleMenuClick(child.path),
                  })),
                }))}
              />
            </div>

            {/* 用户信息区域 - 底部固定 */}
            <div className="sider-user-footer">
              <Divider style={{ margin: '8px 0' }} />
              <div className="user-info-card">
                <div className="user-avatar-wrapper">
                  <Avatar
                    size={40}
                    icon={<UserOutlined />}
                    style={{ backgroundColor: '#87d068' }}
                  />
                </div>
                {!collapsed && (
                  <div className="user-info-text">
                    <div className="user-name">{user?.nickname || user?.username}</div>
                    <div className="user-role">管理员</div>
                  </div>
                )}
                <Dropdown
                  menu={{ items: userMenuItems }}
                  placement="topRight"
                  trigger={['click']}
                >
                  <Button
                    type="text"
                    size="small"
                    icon={<SettingOutlined />}
                    className="user-menu-btn"
                  />
                </Dropdown>
              </div>
            </div>
          </div>
        </Sider>

        {/* 内容区域 */}
        <Content className="pro-content-wrapper">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default ProLayout;
