import request from '@/utils/request';

// 性能指标接口
export interface PerformanceMetric {
  id: number;
  method: string;
  path: string;
  statusCode: number;
  responseTime: number;
  requestSize?: number;
  responseSize?: number;
  ipAddress?: string;
  userAgent?: string;
  userId?: number;
  username?: string;
  cpuUsage?: number;
  memoryUsage?: number;
  errorMessage?: string;
  createdAt: string;
}

// 查询参数
export interface QueryPerformanceParams {
  page?: number;
  pageSize?: number;
  method?: string;
  path?: string;
  minResponseTime?: number;
  startDate?: string;
  endDate?: string;
}

// 统计数据
export interface PerformanceStats {
  avgResponseTime: string;
  maxResponseTime: number;
  minResponseTime: number;
  totalRequests: number;
  errorCount: number;
  errorRate: string;
  statusCodeDistribution: Array<{
    statusCode: number;
    count: number;
  }>;
  slowEndpoints: Array<{
    method: string;
    path: string;
    avgResponseTime: string;
    count: number;
  }>;
}

// 时间序列数据
export interface TimeSeriesData {
  time: string;
  avgResponseTime: string;
  requestCount: number;
  errorCount: number;
}

// 获取性能记录列表
export const getPerformanceMetrics = (params: QueryPerformanceParams) => {
  return request.get<{
    data: PerformanceMetric[];
    total: number;
    page: number;
    pageSize: number;
  }>('/performance/metrics', { params });
};

// 获取性能统计数据
export const getPerformanceStats = (startDate?: string, endDate?: string) => {
  return request.get<PerformanceStats>('/performance/stats', {
    params: { startDate, endDate },
  });
};

// 获取时间序列数据
export const getPerformanceTimeSeries = (hours: number = 24) => {
  return request.get<TimeSeriesData[]>('/performance/timeseries', {
    params: { hours },
  });
};

// 清理旧数据
export const cleanupPerformanceData = (days: number = 30) => {
  return request.delete<{ affected: number }>('/performance/cleanup', {
    params: { days },
  });
};

// 健康检查
export const getHealthCheck = () => {
  return request.get('/health');
};
