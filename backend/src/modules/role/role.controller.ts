import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoleService } from './role.service';
import { CreateRoleDto, UpdateRoleDto, AssignMenusDto } from './dto/role.dto';
import { OperationLog } from '../log/decorators/operation-log.decorator';

@ApiTags('role')
@ApiBearerAuth('JWT-auth')
@Controller('role')
@UseGuards(JwtAuthGuard)
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  // 获取所有角色
  @Get('list')
  @ApiOperation({ summary: '获取角色列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getRoleList() {
    const roles = await this.roleService.findAll();
    return {
      code: 200,
      data: roles,
      message: '获取成功',
    };
  }

  // 创建角色
  @Post()
  @OperationLog('角色管理', '创建角色')
  @ApiOperation({ summary: '创建角色' })
  @ApiResponse({ status: 201, description: '创建成功' })
  async create(@Body() createRoleDto: CreateRoleDto) {
    try {
      const role = await this.roleService.create(createRoleDto);
      return {
        code: 200,
        data: role,
        message: '创建成功',
      };
    } catch (error) {
      return {
        code: 400,
        message: error.message,
      };
    }
  }

  // 更新角色
  @Put(':id')
  @OperationLog('角色管理', '更新角色')
  @ApiOperation({ summary: '更新角色' })
  @ApiParam({ name: 'id', description: '角色ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    await this.roleService.update(+id, updateRoleDto);
    return {
      code: 200,
      message: '更新成功',
    };
  }

  // 删除角色
  @Delete(':id')
  @OperationLog('角色管理', '删除角色')
  @ApiOperation({ summary: '删除角色' })
  @ApiParam({ name: 'id', description: '角色ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async remove(@Param('id') id: string) {
    try {
      await this.roleService.remove(+id);
      return {
        code: 200,
        message: '删除成功',
      };
    } catch (error) {
      return {
        code: 400,
        message: error.message,
      };
    }
  }

  // 给角色分配菜单权限
  @Post(':id/menus')
  @OperationLog('角色管理', '分配角色菜单权限')
  @ApiOperation({ summary: '给角色分配菜单权限' })
  @ApiParam({ name: 'id', description: '角色ID' })
  @ApiResponse({ status: 200, description: '分配成功' })
  async assignMenus(@Param('id') id: string, @Body() assignMenusDto: AssignMenusDto) {
    await this.roleService.assignMenus(+id, assignMenusDto.menuIds);
    return {
      code: 200,
      message: '分配成功',
    };
  }

  // 获取角色的菜单权限
  @Get(':id/menus')
  @ApiOperation({ summary: '获取角色的菜单权限' })
  @ApiParam({ name: 'id', description: '角色ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getRoleMenus(@Param('id') id: string) {
    const menuIds = await this.roleService.getRoleMenuIds(+id);
    return {
      code: 200,
      data: menuIds,
      message: '获取成功',
    };
  }
}
