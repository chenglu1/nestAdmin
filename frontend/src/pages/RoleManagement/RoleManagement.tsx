import React, { useEffect, useState, useCallback } from 'react';
import { AxiosError } from 'axios';
import { Table, Button, Space, Modal, Form, Input, message, Popconfirm, Breadcrumb, Card, Tag, Tree } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, HomeOutlined, SafetyOutlined, KeyOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getRoleList, createRole, updateRole, deleteRole, assignMenusToRole, getRoleMenus } from '@/api/role';
import { getMenuTree } from '@/api/menu';


interface Role {
  id: number;
  name: string;
  code: string;
  description?: string;
  status: number;
  createdAt: string;
}

interface MenuTreeNode {
  key: number;
  title: string;
  children?: MenuTreeNode[];
}

const RoleManagement: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  const [menuTree, setMenuTree] = useState<MenuTreeNode[]>([]);
  const [checkedKeys, setCheckedKeys] = useState<number[]>([]);
  const [form] = Form.useForm();

  interface MenuItem {
    id: number;
    name: string;
    children?: MenuItem[];
  }

  const convertToTreeData = useCallback((menus: MenuItem[]): MenuTreeNode[] => {
    return menus.map(menu => ({
      key: menu.id,
      title: menu.name,
      children: menu.children && menu.children.length > 0 ? convertToTreeData(menu.children) : undefined,
    }));
  }, []);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getRoleList();
      setRoles(response.data || []);
    } catch (error: unknown) {
      message.error((error as Error).message || '获取角色列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMenuTree = useCallback(async () => {
    try {
      const response = await getMenuTree();
      const treeData = convertToTreeData(response.data || []);
      setMenuTree(treeData);
    } catch {
      message.error('获取菜单树失败');
    }
  }, [convertToTreeData]);

  useEffect(() => {
    fetchRoles();
    fetchMenuTree();
  }, [fetchRoles, fetchMenuTree]);



  const handleAdd = () => {
    setEditingRole(null);
    form.resetFields();
    form.setFieldsValue({ status: 1 });
    setIsModalOpen(true);
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    form.setFieldsValue(role);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteRole(id);
      message.success('删除成功');
      fetchRoles();
    } catch (error: unknown) {
      message.error((error as AxiosError<{ message?: string }>)?.response?.data?.message || '删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingRole) {
        await updateRole(editingRole.id, values);
        message.success('更新成功');
      } else {
        await createRole(values);
        message.success('创建成功');
      }
      
      setIsModalOpen(false);
      fetchRoles();
    } catch (error: unknown) {
      // 检查是否是表单验证错误
      if (typeof error === 'object' && error !== null && 'errorFields' in error) {
        return;
      }
      message.error((error as AxiosError<{ message?: string }>)?.response?.data?.message || '操作失败');
    }
  };

  const handleSetPermission = async (role: Role) => {
    setCurrentRole(role);
    try {
      const response = await getRoleMenus(role.id);
      setCheckedKeys(response.data || []);
      setIsPermissionModalOpen(true);
    } catch {
      message.error('获取角色权限失败');
    }
  };

  const handlePermissionSubmit = async () => {
    if (!currentRole) return;
    
    try {
      await assignMenusToRole(currentRole.id, checkedKeys);
      message.success('权限分配成功');
      setIsPermissionModalOpen(false);
    } catch (error: unknown) {
      message.error((error as AxiosError<{ message?: string }>)?.response?.data?.message || '权限分配失败');
    }
  };

  const columns: ColumnsType<Role> = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 60,
    },
    {
      title: '角色名称',
      dataIndex: 'name',
      width: 150,
    },
    {
      title: '角色编码',
      dataIndex: 'code',
      width: 150,
    },
    {
      title: '描述',
      dataIndex: 'description',
      width: 250,
      render: (text) => text || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status) => (
        <Tag color={status === 1 ? 'success' : 'error'}>
          {status === 1 ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 180,
      render: (time) => new Date(time).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<KeyOutlined />}
            onClick={() => handleSetPermission(record)}
          >
            分配权限
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            disabled={record.code === 'admin'}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除此角色吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
            disabled={record.code === 'admin'}
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              disabled={record.code === 'admin'}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Breadcrumb className="mb-4"
        items={[
          {
            href: '/home',
            title: <><HomeOutlined /><span>首页</span></>,
          },
          {
            title: <><SafetyOutlined /><span>角色管理</span></>,
          },
        ]}
      />

      <Card bordered={false} className="shadow-lg border-0 rounded-xl" style={{ borderRadius: '12px' }}>
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-800 flex items-center">
            <span className="w-1 h-5 bg-gradient-to-b from-purple-500 to-purple-600 rounded-full mr-3"></span>
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              角色管理
            </span>
          </h2>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
            className="shadow-md hover:shadow-lg transition-all"
          >
            新增角色
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={roles}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      </Card>

      {/* 新增/编辑角色弹窗 */}
      <Modal
        title={editingRole ? '编辑角色' : '新增角色'}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => setIsModalOpen(false)}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 20 }}
        >
          <Form.Item
            label="角色名称"
            name="name"
            rules={[{ required: true, message: '请输入角色名称' }]}
          >
            <Input placeholder="请输入角色名称" />
          </Form.Item>

          <Form.Item
            label="角色编码"
            name="code"
            rules={[
              { required: true, message: '请输入角色编码' },
              { pattern: /^[a-z_]+$/, message: '只能包含小写字母和下划线' },
            ]}
          >
            <Input placeholder="例如: manager" disabled={!!editingRole} />
          </Form.Item>

          <Form.Item
            label="描述"
            name="description"
          >
            <Input.TextArea 
              placeholder="请输入角色描述" 
              rows={4}
            />
          </Form.Item>

          <Form.Item
            label="状态"
            name="status"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Input disabled value={form.getFieldValue('status') === 1 ? '启用' : '禁用'} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 分配权限弹窗 */}
      <Modal
        title={`分配权限 - ${currentRole?.name}`}
        open={isPermissionModalOpen}
        onOk={handlePermissionSubmit}
        onCancel={() => setIsPermissionModalOpen(false)}
        width={600}
      >
        <div className="mt-5 max-h-[400px] overflow-auto">
          <Tree
            checkable
            treeData={menuTree}
            checkedKeys={checkedKeys}
            onCheck={(checkedKeysArg) => {
              // 处理两种可能的参数形式
              let checkedKeysArray: React.Key[] = [];
              
              // 如果是数组形式
              if (Array.isArray(checkedKeysArg)) {
                checkedKeysArray = checkedKeysArg;
              }
              // 如果是对象形式
              else if (typeof checkedKeysArg === 'object' && checkedKeysArg !== null) {
                checkedKeysArray = checkedKeysArg.checked || [];
              }
              
              // 过滤并转换为number类型数组
              const numberKeys = checkedKeysArray.filter(key => typeof key === 'number') as number[];
              setCheckedKeys(numberKeys);
            }}
            defaultExpandAll
            className="space-y-1"
          />
        </div>
      </Modal>
    </div>
  );
};

export default RoleManagement;