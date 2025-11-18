import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, message, Popconfirm, Switch, Breadcrumb, Card, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, HomeOutlined, UserOutlined, KeyOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import request from '@/utils/request';
import { getRoleList, assignRolesToUser, getUserRoles } from '@/api/role';
import './UserManagement.less';

interface User {
  id: number;
  username: string;
  email?: string;
  nickname?: string;
  status: number;
  createdAt: string;
  updatedAt: string;
}

interface Role {
  id: number;
  name: string;
  code: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
  const [form] = Form.useForm();

  // 获取用户列表
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await request.get('/user/list', {
        params: { page, limit },
      });
      setUsers(response.data.list);
      setTotal(response.data.total);
    } catch (error) {
      message.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [page]);

  // 获取角色列表
  const fetchRoles = async () => {
    try {
      const response = await getRoleList();
      setRoles(response.data || []);
    } catch (error) {
      console.error('获取角色列表失败');
    }
  };

  // 添加用户
  const handleAdd = () => {
    handleOpenModal();
  };

  // 分配角色
  const handleAssignRoles = async (user: User) => {
    setCurrentUser(user);
    try {
      const response = await getUserRoles(user.id);
      setSelectedRoles(response.data || []);
      setIsRoleModalOpen(true);
    } catch (error: any) {
      message.error('获取用户角色失败');
    }
  };

  // 提交角色分配
  const handleRoleSubmit = async () => {
    if (!currentUser) return;
    
    try {
      await assignRolesToUser(currentUser.id, selectedRoles);
      message.success('角色分配成功');
      setIsRoleModalOpen(false);
    } catch (error: any) {
      message.error(error.response?.data?.message || '角色分配失败');
    }
  };

  // 打开添加/编辑弹窗
  const handleOpenModal = (user?: User) => {
    setEditingUser(user || null);
    if (user) {
      form.setFieldsValue({
        username: user.username,
        email: user.email,
        nickname: user.nickname,
      });
    } else {
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  // 关闭弹窗
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    form.resetFields();
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingUser) {
        // 编辑用户
        await request.patch(`/user/${editingUser.id}`, values);
        message.success('更新成功');
      } else {
        // 添加用户
        await request.post('/user/register', values);
        message.success('添加成功');
      }
      
      handleCloseModal();
      fetchUsers();
    } catch (error: any) {
      if (error.errorFields) {
        // 表单验证错误
        return;
      }
      message.error(error.message || '操作失败');
    }
  };

  // 删除用户
  const handleDelete = async (id: number) => {
    try {
      await request.delete(`/user/${id}`);
      message.success('删除成功');
      fetchUsers();
    } catch (error: any) {
      message.error(error.message || '删除失败');
    }
  };

  // 切换用户状态
  const handleToggleStatus = async (user: User) => {
    try {
      const newStatus = user.status === 1 ? 0 : 1;
      await request.patch(`/user/${user.id}/status`, { status: newStatus });
      message.success(newStatus === 1 ? '已启用' : '已禁用');
      fetchUsers();
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  const columns: ColumnsType<User> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '昵称',
      dataIndex: 'nickname',
      key: 'nickname',
      render: (text) => text || '-',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      render: (text) => text || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: number, record: User) => (
        <Switch
          checked={status === 1}
          onChange={() => handleToggleStatus(record)}
          checkedChildren="启用"
          unCheckedChildren="禁用"
        />
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text) => new Date(text).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<KeyOutlined />}
            onClick={() => handleAssignRoles(record)}
          >
            分配角色
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleOpenModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个用户吗?"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
            disabled={record.username === 'admin'}
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              disabled={record.username === 'admin'}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="user-management">
      <Breadcrumb
        style={{ marginBottom: 16 }}
        items={[
          {
            href: '/home',
            title: <><HomeOutlined /><span>首页</span></>,
          },
          {
            title: <><UserOutlined /><span>用户管理</span></>,
          },
        ]}
      />
      
      <Card
        bordered={false}
        style={{ boxShadow: '0 1px 2px 0 rgba(0,0,0,.03)' }}
      >
        <div className="page-header">
          <h2>用户管理</h2>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            新增用户
          </Button>
        </div>

      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          pageSize: limit,
          total: total,
          showSizeChanger: false,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (page) => setPage(page),
        }}
      />

      <Modal
        title={editingUser ? '编辑用户' : '添加用户'}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={handleCloseModal}
        okText="确定"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
          autoComplete="off"
        >
          <Form.Item
            label="用户名"
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名至少3个字符' },
              { max: 50, message: '用户名最多50个字符' },
            ]}
          >
            <Input placeholder="请输入用户名" disabled={!!editingUser} />
          </Form.Item>

          {!editingUser && (
            <Form.Item
              label="密码"
              name="password"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少6个字符' },
              ]}
            >
              <Input.Password placeholder="请输入密码" />
            </Form.Item>
          )}

          <Form.Item
            label="邮箱"
            name="email"
            rules={[
              { type: 'email', message: '邮箱格式不正确' },
            ]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>

          <Form.Item
            label="昵称"
            name="nickname"
            rules={[
              { max: 50, message: '昵称最多50个字符' },
            ]}
          >
            <Input placeholder="请输入昵称" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 分配角色弹窗 */}
      <Modal
        title={`分配角色 - ${currentUser?.username}`}
        open={isRoleModalOpen}
        onOk={handleRoleSubmit}
        onCancel={() => setIsRoleModalOpen(false)}
        width={500}
      >
        <div style={{ marginTop: 20 }}>
          <Select
            mode="multiple"
            placeholder="请选择角色"
            style={{ width: '100%' }}
            value={selectedRoles}
            onChange={setSelectedRoles}
            options={roles.map(role => ({
              label: role.name,
              value: role.id,
            }))}
          />
        </div>
      </Modal>
      </Card>
    </div>
  );
};

export default UserManagement;
