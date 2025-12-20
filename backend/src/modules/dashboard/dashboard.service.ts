import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { Role } from '../role/entities/role.entity';
import { Menu } from '../menu/entities/menu.entity';
import { OperationLog } from '../log/entities/operation-log.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Menu)
    private menuRepository: Repository<Menu>,
    @InjectRepository(OperationLog)
    private operationLogRepository: Repository<OperationLog>,
  ) {}

  /**
   * 获取仪表板统计数据
   */
  async getStatistics() {
    const [userCount, roleCount, menuCount, logCount] = await Promise.all([
      this.userRepository.count(),
      this.roleRepository.count(),
      this.menuRepository.count(),
      this.operationLogRepository.count(),
    ]);

    return {
      userCount,
      roleCount,
      menuCount,
      logCount,
    };
  }
}

