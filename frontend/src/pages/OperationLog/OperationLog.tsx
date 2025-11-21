/*
 * @Author: chenglu chenglud@digitalchina.com
 * @Date: 2025-11-16 11:10:04
 * @LastEditors: chenglu chenglud@digitalchina.com
 * @LastEditTime: 2025-11-16 16:04:22
 * @FilePath: \nestAdmin\frontend\src\pages\OperationLog\OperationLog.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
  Form,
  Input,
  Button,
  Space,
  Tag,
  message,
  Modal,
  Tooltip,
  Typography,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  ClearOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getLogList, deleteLog, clearAllLogs, type OperationLog } from '@/api/log';
import LogDetailDrawer from './LogDetailDrawer';
import './OperationLog.less';

const { confirm } = Modal;
const { Text } = Typography;

const OperationLog: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState<OperationLog[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentLog, setCurrentLog] = useState<OperationLog | null>(null);

  // 获取日志列表
  const fetchLogList = useCallback(async (page = currentPage, limit = pageSize) => {
    setLoading(true);
    try {
      const values = form.getFieldsValue();
      const params = {
        ...values,
        page,
        limit,
      };
      const res = await getLogList(params);
      setDataSource(res.data.list);
      setTotal(res.data.total);
      setCurrentPage(res.data.page);
    } catch {
      message.error('获取日志列表失败');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, form]);

  // 初始加载
  useEffect(() => {
    fetchLogList();
  }, [fetchLogList]);

  // 搜索
  const handleSearch = () => {
    setCurrentPage(1);
    fetchLogList(1, pageSize);
  };

  // 重置
  const handleReset = () => {
    form.resetFields();
    setCurrentPage(1);
    fetchLogList(1, pageSize);
  };

  // 查看详情
  const handleViewDetail = (record: OperationLog) => {
    setCurrentLog(record);
    setDetailVisible(true);
  };

  // 删除单条日志
  const handleDelete = (id: number) => {
    confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: '确定要删除这条日志吗?',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteLog(id);
          message.success('删除成功');
          fetchLogList();
        } catch {
          message.error('删除失败');
        }
      },
    });
  };

  // 清空所有日志
  const handleClearAll = () => {
    confirm({
      title: '确认清空',
      icon: <ExclamationCircleOutlined />,
      content: '确定要清空所有日志吗?此操作不可恢复!',
      okText: '确定',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await clearAllLogs();
          message.success('清空成功');
          fetchLogList(1, pageSize);
        } catch {
          message.error('清空失败');
        }
      },
    });
  };

  // 表格分页配置
  const handleTableChange = (page: number, size: number) => {
    setPageSize(size);
    fetchLogList(page, size);
  };

  // 获取状态码标签颜色
  const getStatusColor = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) return 'success';
    if (statusCode >= 400 && statusCode < 500) return 'warning';
    if (statusCode >= 500) return 'error';
    return 'default';
  };

  // 获取请求方法标签颜色
  const getMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      GET: 'blue',
      POST: 'green',
      PUT: 'orange',
      PATCH: 'cyan',
      DELETE: 'red',
    };
    return colors[method] || 'default';
  };

  // 表格列配置
  const columns: ColumnsType<OperationLog> = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      fixed: 'left',
    },
    {
      title: '用户',
      dataIndex: 'username',
      width: 120,
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: '操作模块',
      dataIndex: 'module',
      width: 120,
      render: (text: string) => <Tag color="purple">{text}</Tag>,
    },
    {
      title: '操作描述',
      dataIndex: 'description',
      width: 150,
    },
    {
      title: '请求方法',
      dataIndex: 'method',
      width: 100,
      render: (text: string) => <Tag color={getMethodColor(text)}>{text}</Tag>,
    },
    {
      title: '请求路径',
      dataIndex: 'path',
      width: 200,
      ellipsis: {
        showTitle: false,
      },
      render: (text: string) => (
        <Tooltip placement="topLeft" title={text}>
          <Text code>{text}</Text>
        </Tooltip>
      ),
    },
    {
      title: 'IP地址',
      dataIndex: 'ip',
      width: 140,
    },
    {
      title: '状态码',
      dataIndex: 'statusCode',
      width: 100,
      render: (code: number) => <Tag color={getStatusColor(code)}>{code}</Tag>,
    },
    {
      title: '执行时间',
      dataIndex: 'duration',
      width: 100,
      render: (duration: number) => (
        <Text type={duration > 1000 ? 'danger' : duration > 500 ? 'warning' : 'success'}>
          {duration}ms
        </Text>
      ),
    },
    {
      title: '操作时间',
      dataIndex: 'createdAt',
      width: 180,
      render: (text: string) => new Date(text).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Tooltip title="查看详情">
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record)}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="operation-log-container">
      <Card>
        {/* 搜索表单 */}
        <Form form={form} layout="inline" className="search-form">
          <Form.Item name="username" label="用户名">
            <Input placeholder="请输入用户名" allowClear />
          </Form.Item>
          <Form.Item name="module" label="操作模块">
            <Input placeholder="请输入操作模块" allowClear />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                搜索
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                重置
              </Button>
              <Button
                danger
                icon={<ClearOutlined />}
                onClick={handleClearAll}
              >
                清空日志
              </Button>
            </Space>
          </Form.Item>
        </Form>

        {/* 数据表格 */}
        <Table
          columns={columns}
          dataSource={dataSource}
          loading={loading}
          rowKey="id"
          scroll={{ x: 1600 }}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: handleTableChange,
            onShowSizeChange: handleTableChange,
          }}
          style={{ marginTop: 16 }}
        />
      </Card>

      {/* 日志详情抽屉 */}
      <LogDetailDrawer
        visible={detailVisible}
        log={currentLog}
        onClose={() => setDetailVisible(false)}
      />
    </div>
  );
};

export default OperationLog;
