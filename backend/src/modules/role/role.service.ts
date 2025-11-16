import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Role } from './entities/role.entity';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  // 获取所有角色
  async findAll(): Promise<Role[]> {
    return this.roleRepository.find({
      order: { id: 'ASC' },
    });
  }

  // 根据ID获取角色
  async findOne(id: number): Promise<Role> {
    return this.roleRepository.findOne({ where: { id } });
  }

  // 创建角色
  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    const role = this.roleRepository.create(createRoleDto);
    return this.roleRepository.save(role);
  }

  // 更新角色
  async update(id: number, updateRoleDto: UpdateRoleDto): Promise<void> {
    await this.roleRepository.update(id, updateRoleDto);
  }

  // 删除角色
  async remove(id: number): Promise<void> {
    // 检查是否是系统角色
    const role = await this.findOne(id);
    if (role.code === 'admin') {
      throw new Error('系统角色不能删除');
    }
    
    // 删除角色菜单关联
    await this.roleRepository.query('DELETE FROM role_menus WHERE role_id = ?', [id]);
    
    // 删除用户角色关联
    await this.roleRepository.query('DELETE FROM user_roles WHERE role_id = ?', [id]);
    
    // 删除角色
    await this.roleRepository.delete(id);
  }

  // 分配菜单权限
  async assignMenus(roleId: number, menuIds: number[]): Promise<void> {
    // 先删除旧的关联
    await this.roleRepository.query('DELETE FROM role_menus WHERE role_id = ?', [roleId]);
    
    // 批量插入新的关联
    if (menuIds.length > 0) {
      const values = menuIds.map(menuId => `(${roleId}, ${menuId})`).join(',');
      await this.roleRepository.query(
        `INSERT INTO role_menus (role_id, menu_id) VALUES ${values}`
      );
    }
  }

  // 获取角色的菜单ID列表
  async getRoleMenuIds(roleId: number): Promise<number[]> {
    const result = await this.roleRepository.query(
      'SELECT menu_id FROM role_menus WHERE role_id = ?',
      [roleId]
    );
    return result.map(item => item.menu_id);
  }

  // 给用户分配角色
  async assignRoleToUser(userId: number, roleIds: number[]): Promise<void> {
    // 先删除旧的关联
    await this.roleRepository.query('DELETE FROM user_roles WHERE user_id = ?', [userId]);
    
    // 批量插入新的关联
    if (roleIds.length > 0) {
      const values = roleIds.map(roleId => `(${userId}, ${roleId})`).join(',');
      await this.roleRepository.query(
        `INSERT INTO user_roles (user_id, role_id) VALUES ${values}`
      );
    }
  }

  // 获取用户的角色ID列表
  async getUserRoleIds(userId: number): Promise<number[]> {
    const result = await this.roleRepository.query(
      'SELECT role_id FROM user_roles WHERE user_id = ?',
      [userId]
    );
    return result.map(item => item.role_id);
  }
}
