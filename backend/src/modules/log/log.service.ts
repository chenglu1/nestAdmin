import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OperationLog } from './entities/operation-log.entity';
import { QueryLogDto } from './dto/query-log.dto';

@Injectable()
export class LogService {
  constructor(
    @InjectRepository(OperationLog)
    private operationLogRepository: Repository<OperationLog>,
  ) {}

  /**
   * 创建操作日志
   */
  async create(logData: Partial<OperationLog>): Promise<OperationLog> {
    const log = this.operationLogRepository.create(logData);
    return await this.operationLogRepository.save(log);
  }

  /**
   * 查询操作日志列表
   */
  async findAll(queryDto: QueryLogDto) {
    const { username, module, page = 1, limit = 10 } = queryDto;

    const queryBuilder = this.operationLogRepository.createQueryBuilder('log');

    if (username) {
      queryBuilder.andWhere('log.username LIKE :username', {
        username: `%${username}%`,
      });
    }

    if (module) {
      queryBuilder.andWhere('log.module LIKE :module', {
        module: `%${module}%`,
      });
    }

    queryBuilder
      .orderBy('log.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [list, total] = await queryBuilder.getManyAndCount();

    return {
      list,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 根据ID查询操作日志详情
   */
  async findOne(id: number): Promise<OperationLog | null> {
    return await this.operationLogRepository.findOne({ where: { id } });
  }

  /**
   * 删除操作日志
   */
  async remove(id: number): Promise<void> {
    await this.operationLogRepository.delete(id);
  }

  /**
   * 批量删除操作日志
   */
  async batchRemove(ids: number[]): Promise<void> {
    await this.operationLogRepository.delete(ids);
  }

  /**
   * 清空操作日志
   */
  async clear(): Promise<void> {
    await this.operationLogRepository.clear();
  }
}
