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
