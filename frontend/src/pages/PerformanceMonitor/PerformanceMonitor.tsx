import React, { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, DatePicker, Button, Space, message, Breadcrumb } from 'antd';
import {
  ClockCircleOutlined,
  ThunderboltOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  HomeOutlined,
  DashboardOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import {
  getPerformanceStats,
  getPerformanceTimeSeries,
  getPerformanceMetrics,
  type PerformanceStats,
  type TimeSeriesData,
  type PerformanceMetric,
} from '@/api/performance';


const { RangePicker } = DatePicker;

const PerformanceMonitor: React.FC = () => {
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesData[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, timeSeriesRes, metricsRes] = await Promise.all([
        getPerformanceStats(dateRange?.[0], dateRange?.[1]),
        getPerformanceTimeSeries(24),
        getPerformanceMetrics({ page: 1, pageSize: 10, minResponseTime: 500 }),
      ]);

      setStats(statsRes.data);
      setTimeSeries(timeSeriesRes.data);
      setMetrics(Array.isArray(metricsRes.data) ? metricsRes.data : (metricsRes.data?.data || []));
    } catch {
      message.error('获取性能数据失败');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // 每30秒刷新
    return () => clearInterval(interval);
  }, [fetchData]);

  // 响应时间趋势图
  const responseTimeOption: EChartsOption = {
    title: { text: 'API响应时间趋势', left: 'center' },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: timeSeries.map(item => new Date(item.time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })),
    },
    yAxis: { type: 'value', name: '响应时间(ms)' },
    series: [
      {
        data: timeSeries.map(item => parseFloat(item.avgResponseTime)),
        type: 'line',
        smooth: true,
        areaStyle: { color: 'rgba(24, 144, 255, 0.2)' },
        itemStyle: { color: '#1890ff' },
      },
    ],
  };

  // 请求量趋势图
  const requestCountOption: EChartsOption = {
    title: { text: '请求量趋势', left: 'center' },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: timeSeries.map(item => new Date(item.time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })),
    },
    yAxis: { type: 'value', name: '请求数' },
    series: [
      {
        name: '总请求',
        data: timeSeries.map(item => item.requestCount),
        type: 'bar',
        itemStyle: { color: '#52c41a' },
      },
      {
        name: '错误请求',
        data: timeSeries.map(item => item.errorCount),
        type: 'bar',
        itemStyle: { color: '#ff4d4f' },
      },
    ],
  };

  // 状态码分布饼图
  const statusCodeOption: EChartsOption = {
    title: { text: '状态码分布', left: 'center' },
    tooltip: { trigger: 'item', formatter: '{a} <br/>{b}: {c} ({d}%)' },
    series: [
      {
        name: '状态码',
        type: 'pie',
        radius: '50%',
        data: stats?.statusCodeDistribution.map(item => ({
          name: item.statusCode.toString(),
          value: item.count,
        })) || [],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      },
    ],
  };

  // 慢接口表格列
  const slowEndpointsColumns = [
    {
      title: '方法',
      dataIndex: 'method',
      key: 'method',
      width: 100,
      fixed: 'left' as const,
      render: (method: string) => <Tag color="blue">{method}</Tag>,
      align: 'center' as const,
    },
    {
      title: '路径',
      dataIndex: 'path',
      key: 'path',
      ellipsis: {
        showTitle: false,
      },
      render: (text: string) => (
        <span title={text} style={{ maxWidth: '400px', display: 'inline-block' }}>
          {text}
        </span>
      ),
      align: 'left' as const,
    },
    {
      title: '响应时间',
      dataIndex: 'responseTime',
      key: 'responseTime',
      width: 140,
      align: 'center' as const,
      render: (time: number) => (
        <span className={`font-medium ${time > 1000 ? 'text-red-500' : time > 500 ? 'text-orange-500' : 'text-gray-600'}`}>
          {time.toFixed(2)}ms
        </span>
      ),
      sorter: (a: { responseTime: number }, b: { responseTime: number }) => a.responseTime - b.responseTime,
    },
    {
      title: '状态码',
      dataIndex: 'statusCode',
      key: 'statusCode',
      width: 120,
      align: 'center' as const,
      render: (code: number) => (
        <Tag color={code >= 500 ? 'red' : code >= 400 ? 'orange' : 'green'}>
          {code}
        </Tag>
      ),
      sorter: (a: { statusCode: number }, b: { statusCode: number }) => a.statusCode - b.statusCode,
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
            title: <><DashboardOutlined className="mr-1" /><span>性能监控</span></>,
          },
        ]}
      />

      <Space direction="vertical" size="large" className="w-full" style={{ width: '100%' }}>
        {/* 操作栏 */}
        <Card bordered={false} className="shadow-lg border-0 rounded-xl" style={{ borderRadius: '12px' }}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-800 m-0 flex items-center">
              <span className="inline-block w-1 h-5 bg-gradient-to-b from-indigo-500 to-indigo-600 rounded-full mr-3"></span>
              <span className="bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                性能监控
              </span>
            </h2>
            <Space>
              <RangePicker
                showTime
                onChange={(dates) => {
                  if (dates) {
                    setDateRange([
                      dates[0]!.toISOString(),
                      dates[1]!.toISOString(),
                    ]);
                  } else {
                    setDateRange(null);
                  }
                }}
              />
              <Button type="primary" onClick={fetchData} loading={loading} className="shadow-md hover:shadow-lg transition-all">
                刷新数据
              </Button>
            </Space>
          </div>
        </Card>

        {/* 关键指标卡片 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card className="rounded-lg shadow-sm border-0" style={{ borderRadius: '12px' }}>
              <Statistic
                title="平均响应时间"
                value={stats?.avgResponseTime || 0}
                suffix="ms"
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#1890ff' }}
                className="text-lg font-semibold"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="rounded-lg shadow-sm border-0" style={{ borderRadius: '12px' }}>
              <Statistic
                title="总请求数"
                value={stats?.totalRequests || 0}
                prefix={<ThunderboltOutlined />}
                valueStyle={{ color: '#52c41a' }}
                className="text-lg font-semibold"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="rounded-lg shadow-sm border-0" style={{ borderRadius: '12px' }}>
              <Statistic
                title="错误率"
                value={stats?.errorRate || 0}
                suffix="%"
                prefix={<WarningOutlined />}
                valueStyle={{ color: parseFloat(stats?.errorRate || '0') > 1 ? '#ff4d4f' : '#52c41a' }}
                className="text-lg font-semibold"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="rounded-lg shadow-sm border-0" style={{ borderRadius: '12px' }}>
              <Statistic
                title="最大响应时间"
                value={stats?.maxResponseTime || 0}
                suffix="ms"
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: (stats?.maxResponseTime || 0) > 1000 ? '#ff4d4f' : '#faad14' }}
                className="text-lg font-semibold"
              />
            </Card>
          </Col>
        </Row>

        {/* 图表区域 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card className="rounded-lg shadow-sm border-0 overflow-hidden" style={{ borderRadius: '12px' }}>
              <ReactECharts 
                option={responseTimeOption} 
                style={{ height: '300px', width: '100%' }}
                opts={{ renderer: 'svg' }}
              />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card className="rounded-lg shadow-sm border-0 overflow-hidden" style={{ borderRadius: '12px' }}>
              <ReactECharts 
                option={requestCountOption} 
                style={{ height: '300px', width: '100%' }}
                opts={{ renderer: 'svg' }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card 
              title={<span className="font-semibold">状态码分布</span>} 
              className="rounded-lg shadow-sm border-0 overflow-hidden" 
              style={{ borderRadius: '12px' }}
            >
              <ReactECharts 
                option={statusCodeOption} 
                style={{ height: '350px', width: '100%' }}
                opts={{ renderer: 'svg' }}
              />
            </Card>
          </Col>
          <Col span={24}>
            <Card 
              title={<span className="font-semibold">Top 10 慢接口</span>} 
              bordered={false}
              className="rounded-lg shadow-sm border-0 overflow-hidden" 
              style={{ borderRadius: '12px' }}
            >
              <Table
                dataSource={metrics || []}
                columns={slowEndpointsColumns}
                pagination={false}
                size="middle"
                rowKey={(record) => `${record.method}-${record.path}-${record.createdAt}`}
                bordered
                scroll={{ x: 'max-content', y: 400 }}
                className="w-full bg-white rounded-lg overflow-hidden"
              />
            </Card>
          </Col>
        </Row>
      </Space>
    </div>
  );
};

export default PerformanceMonitor;