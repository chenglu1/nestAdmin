/*
 * @Author: chenglu chenglud@digitalchina.com
 * @Description: Pro 风格的主布局组件 - 支持侧边栏展开收起、用户菜单在底部、面包屑、搜索、通知等功能
 */
import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { Layout, Button, Space, message, Menu, Dropdown, Badge, Spin, Breadcrumb } from 'antd';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BugOutlined,
  BellOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/stores/authStore';
import { useLayoutStore } from '@/stores/layoutStore';

// 确保正确导入并使用 layoutStore
import { IconMap } from '@/utils/icons';
import UserMenu from '@/components/UserMenu/UserMenu';
import './Layout.less';

const { Header, Content, Sider } = Layout;

const ProLayout: React.FC = () => {
  const { menus, isAuthenticated, fetchMenus, isLoading } = useAuthStore();
  // 正确访问 collapsed 状态和 toggleCollapsed 方法
  const layoutStore = useLayoutStore();
  const collapsed = layoutStore?.collapsed || false;
  const toggleCollapsed = layoutStore?.toggleCollapsed || (() => {});
  const [notifications, setNotifications] = useState(3);
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

  const handleMenuClick = useCallback((key: string) => {
    navigate(key);
  }, [navigate]);

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

  // 检查是否有任何加载操作正在进行
  const isAnyLoading = Object.values(isLoading).some(loading => loading);
  
  if (isAnyLoading) {
    return (
      <div className="layout-loading">
        <Spin size="large" tip="加载中..." spinning={isAnyLoading} />
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
          <h1 className="logo-title">✨ 管理系统</h1>
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
      <div className="breadcrumb-wrapper" style={{ left: collapsed ? 80 : 216 }}>
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
        {/* 侧边栏 - 只显示用户信息 */}
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          width={216}
          className="pro-sider-enhanced"
        >
          <div className="sider-content">
            {/* 菜单区域 - 只显示聊天菜单或隐藏 */}
            <div className="sider-menu-wrapper">
              {menuItems.length > 0 && (
                <Menu
                  mode="inline"
                  selectedKeys={[location.pathname]}
                  theme="dark"
                  items={menuItems}
                />
              )}
            </div>

            {/* 用户信息区域 - 底部固定 */}
            <div className="sider-user-footer">
              <div style={{ margin: '8px 0', borderTop: '1px solid #1f1f1f' }} />
              <UserMenu collapsed={collapsed} />
            </div>
          </div>
        </Sider>

        {/* 内容区域 */}
        <Content 
          className="pro-content-wrapper-enhanced"
          style={{ marginLeft: collapsed ? 80 : 216 }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default ProLayout;