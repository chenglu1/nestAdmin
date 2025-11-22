/*
 * @Author: chenglu chenglud@digitalchina.com
 * @Description: Pro 风格的主布局组件 - 支持侧边栏展开收起、用户菜单在底部、面包屑、搜索、通知等功能
 */
import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { AxiosError } from 'axios';
import { Layout, Button, Space, message, Menu, Dropdown, Avatar, Divider, Spin, Breadcrumb, Badge, Modal, Form, Input } from 'antd';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import {
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BugOutlined,
  BellOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/stores/authStore';
import { useLayoutStore } from '@/stores/layoutStore';

// 确保正确导入并使用 layoutStore
import { changePassword } from '@/api/auth';
import { IconMap } from './constants';
import type { ChangePasswordFormData } from './types';
import './Layout.less';

const { Header, Content, Sider } = Layout;

const ProLayout: React.FC = () => {
  const { user, menus, isAuthenticated, fetchMenus, logout, isLoading: loading } = useAuthStore();
  // 正确访问 collapsed 状态和 toggleCollapsed 方法
  const layoutStore = useLayoutStore();
  const collapsed = layoutStore?.collapsed || false;
  const toggleCollapsed = layoutStore?.toggleCollapsed || (() => {});
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  const [notifications, setNotifications] = useState(3);
  const [form] = Form.useForm<ChangePasswordFormData>();
  const navigate = useNavigate();
  const location = useLocation();

  // 组件加载时获取菜单
  useEffect(() => {
    if (isAuthenticated && menus.length === 0) {
      fetchMenus();
    }
  }, [isAuthenticated, menus.length, fetchMenus]);

  // 面包屑导航构建 - 使用 useMemo 优化
  const breadcrumbs = useMemo(() => {
    const paths = location.pathname.split('/').filter(Boolean);
    const items = [{ label: '首页', path: '/home' }];
    let currentMenus = menus;
    for (const path of paths) {
      if (path === 'home') continue;
      const menu = currentMenus.find((m) => m.path.includes(path));
      if (menu) {
        items.push({ label: menu.name, path: menu.path });
        currentMenus = menu.children || [];
      }
    }
    return items;
  }, [location.pathname, menus]);

  const handleLogoutWithConfirm = useCallback(() => {
    Modal.confirm({
      title: '退出登录',
      content: '确定要退出登录吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: logout,
    });
  }, [logout]);

  const handleChangePassword = useCallback(async (values: ChangePasswordFormData) => {
    try {
      await changePassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });
      message.success('密码修改成功！');
      setChangePasswordVisible(false);
      form.resetFields();
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const errorMessage = axiosError?.response?.data?.message || '密码修改失败';
      message.error(errorMessage);
    }
  }, [form]);

  const handleMenuClick = useCallback((key: string) => {
    navigate(key);
  }, [navigate]);

  // 用户菜单项 - 使用 useMemo 优化
  const userMenuItems = useMemo(() => [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
      onClick: () => {
        message.info('个人资料功能开发中');
      },
    },
    {
      key: 'password',
      icon: <CopyOutlined />,
      label: '修改密码',
      onClick: () => {
        setChangePasswordVisible(true);
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
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
      onClick: handleLogoutWithConfirm,
    },
  ], [handleLogoutWithConfirm]);

  // 通知菜单项 - 使用 useMemo 优化
  const notificationItems = useMemo(() => [
    {
      key: '1',
      label: '系统通知',
      onClick: () => {
        message.info('这是一条系统通知');
        setNotifications(Math.max(0, notifications - 1));
      },
    },
    {
      key: '2',
      label: '审批待办',
      onClick: () => {
        message.info('您有3个待审批任务');
      },
    },
    {
      type: 'divider' as const,
    },
    {
      key: '3',
      label: '清空通知',
      onClick: () => {
        setNotifications(0);
      },
    },
  ], [notifications]);

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
    <Layout className="pro-layout-enhanced">
      {/* 顶部Header */}
      <Header className="pro-header-enhanced">
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
{/* 
        <div className="header-center">
          <div className="search-wrapper">
            <SearchOutlined className="search-icon" />
            <input
              type="text"
              placeholder="搜索页面、功能..."
              className="search-input"
            />
          </div>
        </div> */}

        <div className="header-right">
          <Space size={16}>
            <Dropdown
              menu={{ items: notificationItems }}
              placement="bottomRight"
              trigger={['click']}
            >
              <Button
                type="text"
                icon={
                  <Badge
                    count={notifications}
                    offset={[-4, 4]}
                    style={{ backgroundColor: '#ff4d4f' }}
                  >
                    <BellOutlined style={{ fontSize: 16 }} />
                  </Badge>
                }
                title="系统通知"
              />
            </Dropdown>
            <Button
              type="text"
              icon={<BugOutlined />}
              title="问题反馈"
              onClick={() => {
                message.info('感谢您的反馈！');
              }}
            />
          </Space>
        </div>
      </Header>

      {/* 面包屑导航 */}
      <div 
        className="breadcrumb-wrapper"
        style={{ left: collapsed ? 80 : 216 }}
      >
        <Breadcrumb
          items={breadcrumbs.map((item) => ({
            title: (
              <span
                onClick={() => navigate(item.path)}
                style={{ cursor: 'pointer' }}
              >
                {item.label}
              </span>
            ),
          }))}
        />
      </div>

      {/* 主体布局 */}
      <Layout className="pro-site-layout-enhanced">
        {/* 侧边栏 */}
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          width={216}
          className="pro-sider-enhanced"
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
                  <Badge status="success" />
                </div>
                {!collapsed ? (
                  <>
                    <div className="user-info-text">
                      <div className="user-name">{user?.nickname || user?.username}</div>
                      <div className="user-role">{user?.username === 'admin' ? '管理员' : '用户'}</div>
                    </div>
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
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </Sider>

        {/* 内容区域 */}
        <Content className="pro-content-wrapper-enhanced">
          <Outlet />
        </Content>
      </Layout>

      {/* 修改密码Modal */}
      <Modal
        title="修改密码"
        open={changePasswordVisible}
        onOk={() => form.submit()}
        onCancel={() => setChangePasswordVisible(false)}
        okText="确定"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleChangePassword}
        >
          <Form.Item
            label="当前密码"
            name="oldPassword"
            rules={[{ required: true, message: '请输入当前密码' }]}
          >
            <Input.Password placeholder="请输入当前密码" />
          </Form.Item>
          <Form.Item
            label="新密码"
            name="newPassword"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码长度不少于6位' },
            ]}
          >
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>
          <Form.Item
            label="确认密码"
            name="confirmPassword"
            dependencies={["newPassword"]}
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入密码不一致！'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="请再次输入新密码" />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default ProLayout;
