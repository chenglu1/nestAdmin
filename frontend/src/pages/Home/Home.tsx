/*
 * @Author: chenglu chenglud@digitalchina.com
 * @Date: 2025-11-14 14:14:53
 * @LastEditors: chenglu chenglud@digitalchina.com
 * @LastEditTime: 2025-11-16 10:37:50
 * @FilePath: \nestAdmin\frontend\src\pages\Home\Home.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import React, { useEffect, useState } from 'react';
import { Layout, Button, Space, message, Menu } from 'antd';
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
  DashboardOutlined 
} from '@ant-design/icons';
import { getUserProfile, type UserProfile } from '@/api/auth';
import { getUserMenus } from '@/api/menu';
import './Home.less';

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

const Home: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserProfile();
    fetchMenus();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await getUserProfile();
      setUser(response.data);
    } catch (error) {
      console.error('获取用户信息失败:', error);
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

  const location = useLocation();
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

  return (
    <Layout className="home-layout">
      {/* 顶部导航栏 */}
      <Header className="home-header">
        <div className="header-content">
          <h2>🎯 后台管理</h2>
          <Space size="middle">
            <Space>
              <UserOutlined style={{ fontSize: 16 }} />
              <span style={{ fontWeight: 500 }}>{user?.nickname || user?.username}</span>
            </Space>
            <Button 
              type="text" 
              danger 
              icon={<LogoutOutlined />} 
              onClick={handleLogout}
            >
              退出登录
            </Button>
          </Space>
        </div>
      </Header>

      {/* 主体布局 */}
      <Layout className="site-layout">
        {/* 侧边栏 */}
        <Sider width={208} className="site-sider">
          <Menu
            mode="inline"
            selectedKeys={[currentPath]}
            theme="dark"
            style={{ borderRight: 0 }}
            items={menus.map(menu => ({
              key: menu.path,
              icon: IconMap[menu.icon || 'MenuOutlined'] || <MenuOutlined />,
              label: menu.name,
              onClick: () => handleMenuClick(menu.path),
              children: menu.children?.map(child => ({
                key: child.path,
                label: child.name,
                onClick: () => handleMenuClick(child.path),
              })),
            }))}
          />
        </Sider>

        {/* 内容区域 */}
        <Content className="site-content-wrapper">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default Home;
