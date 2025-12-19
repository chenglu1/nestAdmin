import React, { useState, useEffect } from 'react';
import { Card, Table, Spin, Alert, Button, Breadcrumb } from 'antd';
import { ReloadOutlined, HomeOutlined, MessageOutlined } from '@ant-design/icons';
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
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button
          type="primary"
          icon={<MessageOutlined />}
          size="small"
          onClick={() => {
            window.open(`/chat?model=${record.id}`, '_blank');
          }}
        >
          对话
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Breadcrumb
        className="mb-6"
        items={[
          {
            href: '/home',
            title: <><HomeOutlined className="mr-1" /><span>首页</span></>,
          },
          {
            title: <><MessageOutlined className="mr-1" /><span>我的模型</span></>,
          },
        ]}
      />

      <Card
        bordered={false}
        className="shadow-lg border-0 rounded-xl"
        style={{ borderRadius: '12px' }}
      >
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-800 m-0 flex items-center">
            <span className="inline-block w-1 h-5 bg-gradient-to-b from-cyan-500 to-cyan-600 rounded-full mr-3"></span>
            <span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
              我的模型
            </span>
          </h2>
          <div className="flex items-center gap-4">
            {lastUpdated && (
              <span className="text-sm text-gray-600 font-medium">
                最后更新: <span className="text-blue-600">{lastUpdated}</span>
              </span>
            )}
            <Button 
              type="primary" 
              icon={<ReloadOutlined />} 
              onClick={fetchModels}
              loading={loading}
              className="shadow-md hover:shadow-lg transition-all"
            >
              刷新
            </Button>
          </div>
        </div>
        
        <div className="mt-4">
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
              className="my-4" 
              showIcon
              closable
            />
          ) : (
            <Table
              columns={columns}
              dataSource={models}
              rowKey="id"
              className="bg-white rounded-lg overflow-hidden"
              pagination={{
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => (
                  <span className="text-gray-600 font-medium">
                    共 <span className="text-blue-600 font-semibold">{total}</span> 条记录，显示第 {range[0]}-{range[1]} 条
                  </span>
                ),
                pageSizeOptions: ['10', '20', '50', '100'],
              }}
              locale={{
                emptyText: (
                  <div className="text-center py-12 text-gray-500">
                    <MessageOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
                    <div className="mt-4 text-base">暂无可用模型</div>
                  </div>
                ),
              }}
              style={{ borderRadius: '8px' }}
            />
          )}
        </div>
      </Card>
    </div>
  );
};

export default ChatAnywhere;
