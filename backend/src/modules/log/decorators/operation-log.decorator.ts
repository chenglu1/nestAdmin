import { SetMetadata } from '@nestjs/common';

export const OPERATION_LOG_KEY = 'operation_log';

export interface OperationLogMetadata {
  module: string;
  description: string;
}

export const OperationLog = (module: string, description: string) =>
  SetMetadata(OPERATION_LOG_KEY, { module, description } as OperationLogMetadata);
