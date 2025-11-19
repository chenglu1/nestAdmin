import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Menu } from './entities/menu.entity';
import { CreateMenuDto, UpdateMenuDto } from './dto/menu.dto';

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(Menu)
    private menuRepository: Repository<Menu>,
  ) {}

  // 获取所有菜单(树形结构)
  async findAll(): Promise<any[]> {
    const menus = await this.menuRepository.find({
      where: { status: 1 },
      order: { sort: 'ASC', id: 'ASC' },
    });
    
    return this.buildMenuTree(menus);
  }

  // 获取菜单列表(扁平)
  async findList(): Promise<Menu[]> {
    return this.menuRepository.find({
      order: { sort: 'ASC', id: 'ASC' },
    });
  }

  // 根据ID获取菜单
  async findOne(id: number): Promise<Menu | null> {
    return this.menuRepository.findOne({ where: { id } });
  }

  // 创建菜单
  async create(createMenuDto: CreateMenuDto): Promise<Menu> {
    const menu = this.menuRepository.create(createMenuDto);
    return this.menuRepository.save(menu);
  }

  // 更新菜单
  async update(id: number, updateMenuDto: UpdateMenuDto): Promise<void> {
    await this.menuRepository.update(id, updateMenuDto);
  }

  // 删除菜单
  async remove(id: number): Promise<void> {
    // 检查是否有子菜单
    const children = await this.menuRepository.find({ where: { parentId: id } });
    if (children.length > 0) {
      throw new Error('请先删除子菜单');
    }
    await this.menuRepository.delete(id);
  }

  // 根据用户ID获取菜单 通过联表查询获取用户的菜单权限:
  async findByUserId(userId: number): Promise<any[]> {
    const query = `
      SELECT DISTINCT m.* FROM menus m
      INNER JOIN role_menus rm ON m.id = rm.menu_id
      INNER JOIN user_roles ur ON rm.role_id = ur.role_id
      WHERE ur.user_id = ? AND m.status = 1 AND m.type = 1
      ORDER BY m.sort ASC, m.id ASC
    `;
    
    const menus = await this.menuRepository.query(query, [userId]);
    return this.buildMenuTree(menus);
  }

  // 构建菜单树
  private buildMenuTree(menus: Menu[], parentId: number | null = null): any[] {
    const tree = [];
    
    for (const menu of menus) {
      // 处理 NULL 值比较
      const menuParentId = menu.parentId === null || menu.parentId === undefined ? null : menu.parentId;
      const compareParentId = parentId === null || parentId === undefined ? null : parentId;
      
      if (menuParentId === compareParentId) {
        const children = this.buildMenuTree(menus, menu.id);
        const node: any = {
          id: menu.id,
          name: menu.name,
          path: menu.path,
          component: menu.component,
          icon: menu.icon,
          sort: menu.sort,
          type: menu.type,
        };
        
        if (children.length > 0) {
          node.children = children;
        }
        
        tree.push(node);
      }
    }
    
    return tree;
  }
}
