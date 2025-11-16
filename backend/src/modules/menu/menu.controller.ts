import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MenuService } from './menu.service';
import { CreateMenuDto, UpdateMenuDto } from './dto/menu.dto';
import { OperationLog } from '../log/decorators/operation-log.decorator';

@ApiTags('menu')
@ApiBearerAuth('JWT-auth')
@Controller('menu')
@UseGuards(JwtAuthGuard)
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  // 获取所有菜单(树形)
  @Get('tree')
  @ApiOperation({ summary: '获取菜单树' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getMenuTree() {
    const menus = await this.menuService.findAll();
    return {
      code: 200,
      data: menus,
      message: '获取成功',
    };
  }

  // 获取菜单列表(扁平)
  @Get('list')
  @ApiOperation({ summary: '获取菜单列表(扁平结构)' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getMenuList() {
    const menus = await this.menuService.findList();
    return {
      code: 200,
      data: menus,
      message: '获取成功',
    };
  }

  // 获取当前用户的菜单
  @Get('user')
  @ApiOperation({ summary: '获取当前用户的菜单权限' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getUserMenus(@Request() req) {
    const menus = await this.menuService.findByUserId(req.user.userId);
    return {
      code: 200,
      data: menus,
      message: '获取成功',
    };
  }

  // 创建菜单
  @Post()
  @OperationLog('菜单管理', '创建菜单')
  @ApiOperation({ summary: '创建菜单' })
  @ApiResponse({ status: 201, description: '创建成功' })
  async create(@Body() createMenuDto: CreateMenuDto) {
    const menu = await this.menuService.create(createMenuDto);
    return {
      code: 200,
      data: menu,
      message: '创建成功',
    };
  }

  // 更新菜单
  @Put(':id')
  @OperationLog('菜单管理', '更新菜单')
  @ApiOperation({ summary: '更新菜单' })
  @ApiParam({ name: 'id', description: '菜单ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async update(@Param('id') id: string, @Body() updateMenuDto: UpdateMenuDto) {
    await this.menuService.update(+id, updateMenuDto);
    return {
      code: 200,
      message: '更新成功',
    };
  }

  // 删除菜单
  @Delete(':id')
  @OperationLog('菜单管理', '删除菜单')
  @ApiOperation({ summary: '删除菜单' })
  @ApiParam({ name: 'id', description: '菜单ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async remove(@Param('id') id: string) {
    try {
      await this.menuService.remove(+id);
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
}
