import React, { useState } from 'react';
import { LogoutOutlined, SettingOutlined, UserOutlined, CopyOutlined } from '@ant-design/icons';
import { Avatar, Button, Dropdown, Modal, Form, Input, message, Badge } from 'antd';
import { useAuthStore } from '@/stores/authStore';
import { changePassword } from '@/api/auth';
import type { ChangePasswordFormData } from './types';

interface UserMenuProps {
  collapsed?: boolean;
}

const UserMenu: React.FC<UserMenuProps> = ({ collapsed = false }) => {
  const { user, logout } = useAuthStore();
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  const [form] = Form.useForm<ChangePasswordFormData>();

  // 用户菜单事件处理
  const handleLogoutWithConfirm = () => {
    Modal.confirm({
      title: '退出登录',
      content: '确定要退出登录吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: logout,
    });
  };
  
  const handleChangePassword = async (values: ChangePasswordFormData) => {
    try {
      await changePassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });
      message.success('密码修改成功！');
      setChangePasswordVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('密码修改失败，请重试');
    }
  };

  // 用户菜单项
  const userMenuItems = [
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
  ];

  return (
    <>
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
    </>
  );
};

export default UserMenu;