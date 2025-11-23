import React, { useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { Table, Button, Space, Modal, Form, Input, InputNumber, Select, message, Popconfirm, Breadcrumb, Card, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, HomeOutlined, MenuOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getMenuList, createMenu, updateMenu, deleteMenu } from '@/api/menu';

interface Menu {
  id: number;
  name: string;
  path?: string;
  component?: string;
  icon?: string;
  parentId?: number;
  sort: number;
  type: number;
  status: number;
  createdAt: string;
}

const MenuManagement: React.FC = () => {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchMenus();
  }, []);

  const fetchMenus = async () => {
    setLoading(true);
    try {
      const response = await getMenuList();
      setMenus(response.data || []);
    } catch (error: unknown) {
      message.error((error as Error).message || '获取菜单列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingMenu(null);
    form.resetFields();
    form.setFieldsValue({ sort: 0, type: 1, status: 1 });
    setIsModalOpen(true);
  };

  const handleEdit = (menu: Menu) => {
    setEditingMenu(menu);
    form.setFieldsValue(menu);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMenu(id);
      message.success('删除成功');
      fetchMenus();
    } catch (error: unknown) {
      message.error((error as AxiosError<{ message?: string }>)?.response?.data?.message || '删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingMenu) {
        await updateMenu(editingMenu.id, values);
        message.success('更新成功');
      } else {
        await createMenu(values);
        message.success('创建成功');
      }
      
      setIsModalOpen(false);
      fetchMenus();
    } catch (error: unknown) {
      // 检查是否是表单验证错误
      if (typeof error === 'object' && error !== null && 'errorFields' in error) {
        return;
      }
      message.error((error as AxiosError<{ message?: string }>)?.response?.data?.message || '操作失败');
    }
  };

  const columns: ColumnsType<Menu> = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 60,
    },
    {
      title: '菜单名称',
      dataIndex: 'name',
      width: 150,
    },
    {
      title: '路径',
      dataIndex: 'path',
      width: 180,
    },
    {
      title: '组件',
      dataIndex: 'component',
      width: 150,
    },
    {
      title: '图标',
      dataIndex: 'icon',
      width: 120,
    },
    {
      title: '父菜单ID',
      dataIndex: 'parentId',
      width: 100,
      render: (parentId) => parentId || '-',
    },
    {
      title: '排序',
      dataIndex: 'sort',
      width: 80,
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 100,
      render: (type) => (
        <Tag color={type === 1 ? 'blue' : 'green'}>
          {type === 1 ? '菜单' : '按钮'}
        </Tag>
      ),
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
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              className="h-auto p-0 hover:opacity-80"
            >
              编辑
            </Button>
            <Popconfirm
              title="确定删除此菜单吗？"
              onConfirm={() => handleDelete(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
                className="h-auto p-0 hover:opacity-80"
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
      <Breadcrumb
        className="mb-4"
        items={[
          {
            href: '/home',
            title: <><HomeOutlined className="mr-1" /><span>首页</span></>,
          },
          {
            title: <><MenuOutlined className="mr-1" /><span>菜单管理</span></>,
          },
        ]}
      />

      <Card bordered={false} className="shadow-sm font-semibold">
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 m-0 flex items-center">
            <span className="inline-block w-1 h-5 bg-blue-500 mr-3 rounded"></span>
            菜单管理
          </h2>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            新增菜单
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={menus}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1300 }}
          pagination={{
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          className="bg-white"
        />
      </Card>

      <Modal
        title={editingMenu ? '编辑菜单' : '新增菜单'}
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
            label="菜单名称"
            name="name"
            rules={[{ required: true, message: '请输入菜单名称' }]}
          >
            <Input placeholder="请输入菜单名称" />
          </Form.Item>

          <Form.Item
            label="路径"
            name="path"
          >
            <Input placeholder="例如: /home/users" />
          </Form.Item>

          <Form.Item
            label="组件路径"
            name="component"
          >
            <Input placeholder="例如: UserManagement" />
          </Form.Item>

          <Form.Item
            label="图标"
            name="icon"
          >
            <Select placeholder="选择图标">
              <Select.Option value="HomeOutlined" children="HomeOutlined" />
              <Select.Option value="UserOutlined" children="UserOutlined" />
              <Select.Option value="TeamOutlined" children="TeamOutlined" />
              <Select.Option value="MenuOutlined" children="MenuOutlined" />
              <Select.Option value="SafetyOutlined" children="SafetyOutlined" />
              <Select.Option value="SettingOutlined" children="SettingOutlined" />
            </Select>
          </Form.Item>

          <Form.Item
            label="父菜单ID"
            name="parentId"
          >
            <InputNumber 
              placeholder="留空表示顶级菜单" 
              style={{ width: '100%' }}
              min={0}
            />
          </Form.Item>

          <Form.Item
            label="排序"
            name="sort"
            rules={[{ required: true, message: '请输入排序' }]}
          >
            <InputNumber 
              placeholder="数字越小越靠前" 
              style={{ width: '100%' }}
              min={0}
            />
          </Form.Item>

          <Form.Item
            label="类型"
            name="type"
            rules={[{ required: true, message: '请选择类型' }]}
          >
            <Select>
              <Select.Option value={1} children="菜单" />
              <Select.Option value={2} children="按钮" />
            </Select>
          </Form.Item>

          <Form.Item
            label="状态"
            name="status"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select>
              <Select.Option value={1} children="启用" />
              <Select.Option value={0} children="禁用" />
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MenuManagement;
