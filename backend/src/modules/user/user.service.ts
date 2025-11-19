import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // 检查用户名是否已存在
    const existUser = await this.userRepository.findOne({
      where: { username: createUserDto.username },
    });

    if (existUser) {
      throw new ConflictException('用户名已存在');
    }

    // 密码加密
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(createUserDto.password, salt);

    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    return await this.userRepository.save(user);
  }

  async findByUsername(username: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { username },
    });
  }

  async findById(id: number): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { id },
    });
  }

  async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // 获取用户列表(支持分页和查询)
  async findAll(
    page: number = 1,
    limit: number = 10,
    query?: { username?: string; email?: string; nickname?: string; status?: number }
  ): Promise<{ users: User[]; total: number }> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');

    // 添加查询条件
    if (query?.username) {
      queryBuilder.andWhere('user.username LIKE :username', { username: `%${query.username}%` });
    }
    if (query?.email) {
      queryBuilder.andWhere('user.email LIKE :email', { email: `%${query.email}%` });
    }
    if (query?.nickname) {
      queryBuilder.andWhere('user.nickname LIKE :nickname', { nickname: `%${query.nickname}%` });
    }
    if (query?.status !== undefined) {
      queryBuilder.andWhere('user.status = :status', { status: query.status });
    }

    const [users, total] = await queryBuilder
      .select(['user.id', 'user.username', 'user.email', 'user.nickname', 'user.status', 'user.createdAt', 'user.updatedAt'])
      .orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { users, total };
  }

  // 删除用户
  async remove(id: number): Promise<void> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 不允许删除管理员账户
    if (user.username === 'admin') {
      throw new ConflictException('不能删除管理员账户');
    }

    await this.userRepository.delete(id);
  }

  // 更新用户状态(启用/禁用)
  async updateStatus(id: number, status: number): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 不允许禁用管理员账户
    if (user.username === 'admin' && status === 0) {
      throw new ConflictException('不能禁用管理员账户');
    }

    user.status = status;
    return await this.userRepository.save(user);
  }

  // 更新用户信息
  async update(id: number, updateData: Partial<CreateUserDto>): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 如果更新密码,需要加密
    if (updateData.password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(updateData.password, salt);
    }

    Object.assign(user, updateData);
    return await this.userRepository.save(user);
  }

  // 给用户分配角色
  async assignRoles(userId: number, roleIds: number[]): Promise<void> {
    // 先删除旧的关联
    await this.userRepository.query('DELETE FROM user_roles WHERE user_id = ?', [userId]);
    
    // 批量插入新的关联
    if (roleIds.length > 0) {
      const values = roleIds.map(roleId => `(${userId}, ${roleId})`).join(',');
      await this.userRepository.query(
        `INSERT INTO user_roles (user_id, role_id) VALUES ${values}`
      );
    }
  }

  // 获取用户的角色ID列表
  async getUserRoles(userId: number): Promise<number[]> {
    const result = await this.userRepository.query(
      'SELECT role_id FROM user_roles WHERE user_id = ?',
      [userId]
    );
    return result.map((item: any) => item.role_id);
  }
}
