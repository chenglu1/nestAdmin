/*
 * @Author: chenglu chenglud@digitalchina.com
 * @Description: Pro 风格的主布局组件 - 支持侧边栏展开收起、用户菜单在底部
 */
import React, { useMemo, useCallback } from 'react';
import { Layout, Button, Space, message, Menu, Dropdown, Avatar, Divider, Spin } from 'antd';
import type { MenuProps } from 'antd';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import {
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DesktopOutlined,
  BugOutlined,
} from '@ant-design/icons';
import { useLayoutData, useSiderCollapsed, useLogout } from '@/hooks/useLayout';
import { IconMap } from './constants';
import './Layout.less';

const { Header, Content, Sider } = Layout;

const ProLayout: React.FC = () => {
  const { user, menus, loading } = useLayoutData();
  const { collapsed, toggleCollapsed } = useSiderCollapsed();
  const logout = useLogout();
  const navigate = useNavigate();
  const location = useLocation();

  const handleMenuClick = useCallback((key: string) => {
    navigate(key);
  }, [navigate]);

  // 用户菜单项 - 使用 useMemo 优化
  const userMenuItems: MenuProps['items'] = useMemo(() => [
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
      onClick: logout,
    },
  ], [logout]);

  // 菜单项 - 使用 useMemo 优化
  const menuItems = useMemo(() => 
    menus.map((menu) => ({
      key: menu.path,
      icon: IconMap[menu.icon || 'MenuOutlined'] || IconMap.MenuOutlined,
      label: menu.name,
      onClick: () => handleMenuClick(menu.path),
      children: menu.children?.map((child) => ({
        key: child.path,
        label: child.name,
        onClick: () => handleMenuClick(child.path),
      })),
    })),
    [menus, handleMenuClick]
  );

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
            onClick={toggleCollapsed}
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
                selectedKeys={[location.pathname]}
                theme="dark"
                items={menuItems}
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
