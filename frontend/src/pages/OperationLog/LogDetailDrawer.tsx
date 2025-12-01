import React from 'react';
import { Drawer, Descriptions, Tag, Typography, Space, Divider } from 'antd';
import {
  ClockCircleOutlined,
  UserOutlined,
  GlobalOutlined,
  CodeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import type { OperationLog } from '@/api/log';
import './LogDetailDrawer.less';

const { Text, Paragraph } = Typography;

interface LogDetailDrawerProps {
  visible: boolean;
  log: OperationLog | null;
  onClose: () => void;
}

const LogDetailDrawer: React.FC<LogDetailDrawerProps> = ({ visible, log, onClose }) => {
  if (!log) return null;

  // 格式化 JSON 字符串
  const formatJson = (jsonStr: string) => {
    try {
      const obj = JSON.parse(jsonStr);
      return JSON.stringify(obj, null, 2);
    } catch {
      return jsonStr;
    }
  };

  // 获取状态标签
  const getStatusTag = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) {
      return (
        <Tag icon={<CheckCircleOutlined />} color="success">
          成功 ({statusCode})
        </Tag>
      );
    }
    if (statusCode >= 400) {
      return (
        <Tag icon={<CloseCircleOutlined />} color="error">
          失败 ({statusCode})
        </Tag>
      );
    }
    return <Tag color="default">{statusCode}</Tag>;
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

  return (
    <Drawer
      title="操作日志详情"
      placement="right"
      width={720}
      onClose={onClose}
      open={visible}
      className="log-detail-drawer"
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 基本信息 */}
        <div>
          <Divider titlePlacement="left">
            <Space>
              <UserOutlined />
              基本信息
            </Space>
          </Divider>
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="日志ID">{log.id}</Descriptions.Item>
            <Descriptions.Item label="用户ID">{log.userId}</Descriptions.Item>
            <Descriptions.Item label="用户名">
              <Text strong>{log.username}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="操作模块">
              <Tag color="purple">{log.module}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="操作描述" span={2}>
              {log.description}
            </Descriptions.Item>
            <Descriptions.Item label="操作时间" span={2}>
              <Space>
                <ClockCircleOutlined />
                {new Date(log.createdAt).toLocaleString('zh-CN')}
              </Space>
            </Descriptions.Item>
          </Descriptions>
        </div>

        {/* 请求信息 */}
        <div>
          <Divider titlePlacement="left">
            <Space>
              <CodeOutlined />
              请求信息
            </Space>
          </Divider>
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="请求方法">
              <Tag color={getMethodColor(log.method)}>{log.method}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="请求路径">
              <Text code copyable>
                {log.path}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="请求参数">
              <Paragraph>
                <pre className="json-content">{formatJson(log.params)}</pre>
              </Paragraph>
            </Descriptions.Item>
          </Descriptions>
        </div>

        {/* 响应信息 */}
        <div>
          <Divider titlePlacement="left">
            <Space>
              <CheckCircleOutlined />
              响应信息
            </Space>
          </Divider>
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="状态码">{getStatusTag(log.statusCode)}</Descriptions.Item>
            <Descriptions.Item label="执行时间">
              <Text
                type={
                  log.duration > 1000 ? 'danger' : log.duration > 500 ? 'warning' : 'success'
                }
              >
                {log.duration}ms
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="响应数据" span={2}>
              <Paragraph>
                <pre className="json-content">{formatJson(log.response)}</pre>
              </Paragraph>
            </Descriptions.Item>
          </Descriptions>
        </div>

        {/* 客户端信息 */}
        <div>
          <Divider titlePlacement="left">
            <Space>
              <GlobalOutlined />
              客户端信息
            </Space>
          </Divider>
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="IP地址">
              <Text code>{log.ip}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="User Agent">
              <Paragraph ellipsis={{ rows: 2, expandable: true }}>
                {log.userAgent}
              </Paragraph>
            </Descriptions.Item>
          </Descriptions>
        </div>
      </Space>
    </Drawer>
  );
};

export default LogDetailDrawer;
