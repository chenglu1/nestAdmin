import request from '@/utils/request';

export interface DashboardStatistics {
  userCount: number;
  roleCount: number;
  menuCount: number;
  logCount: number;
}

/**
 * 获取仪表板统计数据
 */
export const getDashboardStatistics = () => {
  return request.get<DashboardStatistics>('/dashboard/statistics');
};

