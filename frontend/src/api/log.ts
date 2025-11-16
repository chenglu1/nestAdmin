import request from '@/utils/request';

export interface OperationLog {
  id: number;
  userId: number;
  username: string;
  module: string;
  description: string;
  method: string;
  path: string;
  params: string;
  ip: string;
  userAgent: string;
  statusCode: number;
  response: string;
  duration: number;
  createdAt: string;
}

export interface LogListParams {
  username?: string;
  module?: string;
  page?: number;
  limit?: number;
}

export interface LogListResponse {
  list: OperationLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * 获取操作日志列表
 */
export const getLogList = (params: LogListParams) => {
  return request.get<LogListResponse>('/log/list', { params });
};

/**
 * 获取单条日志详情
 */
export const getLogDetail = (id: number) => {
  return request.get<OperationLog>(`/log/${id}`);
};

/**
 * 删除操作日志
 */
export const deleteLog = (id: number) => {
  return request.delete(`/log/${id}`);
};

/**
 * 清空所有日志
 */
export const clearAllLogs = () => {
  return request.delete('/log/clear/all');
};
