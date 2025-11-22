import React, { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, DatePicker, Button, Space, message } from 'antd';
import {
  ClockCircleOutlined,
  ThunderboltOutlined,
  WarningOutlined,
  CheckCircleOutlined,
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
import './PerformanceMonitor.less';

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
      width: 80,
      render: (method: string) => <Tag color="blue">{method}</Tag>,
      align: 'center' as const,
    },
    {
      title: '路径',
      dataIndex: 'path',
      key: 'path',
      ellipsis: true,
      width: 400,
      align: 'left' as const,
    },
    {
      title: '响应时间',
      dataIndex: 'responseTime',
      key: 'responseTime',
      width: 120,
      align: 'center' as const,
      render: (time: number) => (
        <span style={{ color: time > 1000 ? '#ff4d4f' : '#faad14' }}>
          {time.toFixed(2)}ms
        </span>
      ),
      sorter: (a: { responseTime: number }, b: { responseTime: number }) => a.responseTime - b.responseTime,
    },
    {
      title: '状态码',
      dataIndex: 'statusCode',
      key: 'statusCode',
      width: 100,
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
    <div className="performance-monitor">
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 操作栏 */}
        <Card>
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
            <Button type="primary" onClick={fetchData} loading={loading}>
              刷新数据
            </Button>
          </Space>
        </Card>

        {/* 关键指标卡片 */}
        <Row gutter={16}>
          <Col span={6}>
            <Card>
              <Statistic
                title="平均响应时间"
                value={stats?.avgResponseTime || 0}
                suffix="ms"
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="总请求数"
                value={stats?.totalRequests || 0}
                prefix={<ThunderboltOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="错误率"
                value={stats?.errorRate || 0}
                suffix="%"
                prefix={<WarningOutlined />}
                valueStyle={{ color: parseFloat(stats?.errorRate || '0') > 1 ? '#ff4d4f' : '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="最大响应时间"
                value={stats?.maxResponseTime || 0}
                suffix="ms"
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: (stats?.maxResponseTime || 0) > 1000 ? '#ff4d4f' : '#faad14' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 图表区域 */}
        <Row gutter={16}>
          <Col span={12}>
            <Card>
              <ReactECharts option={responseTimeOption} style={{ height: 300 }} />
            </Card>
          </Col>
          <Col span={12}>
            <Card>
              <ReactECharts option={requestCountOption} style={{ height: 300 }} />
            </Card>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Card title="状态码分布" className="chart-card">
              <ReactECharts option={statusCodeOption} style={{ flex: 1 }} />
            </Card>
          </Col>
          <Col span={24}>
            <Card title="Top 10 慢接口" bordered className="table-card">
              <Table
                dataSource={metrics || []}
                columns={slowEndpointsColumns}
                pagination={false}
                size="middle"
                rowKey={(record) => `${record.method}-${record.path}-${record.createdAt}`}
                bordered
                scroll={{ x: 800, y: 400 }}
                style={{ minWidth: '100%' }}
                sticky={false}
              />
            </Card>
          </Col>
        </Row>
      </Space>
    </div>
  );
};

export default PerformanceMonitor;
