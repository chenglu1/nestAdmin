import request from '@/utils/request';

// 模型相关类型定义
export interface ModelPermission {
  object: string;
}

export interface Model {
  id: string;
  object: string;
  owned_by: string;
  permission: ModelPermission[];
}

export interface ModelListResponse {
  data: Model[];
  object: string;
}

/**
 * 获取模型列表
 * @returns 模型列表响应
 */
export const getModels = async (): Promise<any> => {
  return request({
    url: '/chatanywhere/models',
    method: 'get',
  });
};
