import React, { useState, useEffect } from 'react';
import { Card, Table, Spin, Alert, Button, Breadcrumb } from 'antd';
import { ReloadOutlined, HomeOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getModels } from '@/api/chatanywhere';
import type { Model } from '@/api/chatanywhere';

const ChatAnywhere: React.FC = () => {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchModels = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getModels();
      setModels(response.data.list);
      // 更新最后更新时间
      const now = new Date();
      setLastUpdated(now.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }));
    } catch (err) {
      setError('获取模型列表失败，请稍后重试');
      console.error('Failed to fetch models:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const columns: ColumnsType<Model> = [
    {
      title: '模型 ID',
      dataIndex: 'id',
      key: 'id',
      ellipsis: true,
    },
    {
      title: '对象类型',
      dataIndex: 'object',
      key: 'object',
    },
    {
      title: '所属组织',
      dataIndex: 'owned_by',
      key: 'owned_by',
    },
    {
      title: '权限信息',
      key: 'permission',
      render: (_, record) => (
        <span>
          {record.permission && record.permission.length > 0 ? '已配置' : '默认权限'}
        </span>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Breadcrumb
        className="mb-4"
        items={[
          {
            href: '/home',
            title: <><HomeOutlined className="mr-1" /><span>首页</span></>,
          },
          {
            title: <span>ChatAnywhere</span>,
          },
        ]}
      />
      <Card
        bordered={false}
        className="shadow-sm mb-4"
      >
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 m-0 flex items-center">
            <span className="inline-block w-1 h-5 bg-blue-500 mr-3 rounded"></span>
            我的模型
          </h2>
          <div className="flex items-center">
            {lastUpdated && (
              <span className="text-sm text-gray-600 mr-4">
                最后更新: {lastUpdated}
              </span>
            )}
            <Button 
              type="primary" 
              icon={<ReloadOutlined />} 
              onClick={fetchModels}
              loading={loading}
            >
              刷新
            </Button>
          </div>
        </div>
      </Card>
      
      <Card className="bg-white">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Spin size="large" />
            <div className="mt-4 text-center text-gray-500">
              正在获取模型数据...
            </div>
          </div>
        ) : error ? (
          <Alert 
            type="error" 
            message={error} 
            className="my-4 mx-4" 
            showIcon
          />
        ) : (
          <Table
            columns={columns}
            dataSource={models}
            rowKey="id"
            pagination={{
              showSizeChanger: false,
              showTotal: (total) => `共 ${total} 条`,
            }}
            locale={{
              emptyText: (
                <div className="text-center py-4 text-gray-500">
                  暂无可用模型
                </div>
              ),
            }}
          />
        )}
      </Card>
    </div>
  );
};

export default ChatAnywhere;
