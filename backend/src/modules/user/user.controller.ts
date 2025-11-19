import { Controller, Post, Body, Get, UseGuards, Request, Query, Delete, Param, Patch, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OperationLog } from '../log/decorators/operation-log.decorator';

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  @OperationLog('用户管理', '注册新用户')
  @ApiOperation({ summary: '注册新用户' })
  @ApiResponse({ status: 200, description: '注册成功' })
  @ApiResponse({ status: 409, description: '用户名已存在' })
  async register(@Body() createUserDto: CreateUserDto) {
    const user = await this.userService.create(createUserDto);
    // 不返回密码
    const { password, ...result } = user as any;
    return {
      code: 200,
      message: '注册成功',
      data: result,
    };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '获取当前用户信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  async getProfile(@Request() req: any) {
    const user = await this.userService.findById(req.user.userId);
    if (!user) {
      return { code: 404, message: '用户不存在' };
    }
    const { password, ...result } = user;
    return {
      code: 200,
      data: result,
    };
  }

  // 获取用户列表(需要登录，支持查询和分页)
  @Get('list')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '获取用户列表(支持查询和分页)' })
  @ApiQuery({ name: 'page', required: false, description: '页码', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: '每页数量', example: 10 })
  @ApiQuery({ name: 'username', required: false, description: '用户名搜索' })
  @ApiQuery({ name: 'email', required: false, description: '邮箱搜索' })
  @ApiQuery({ name: 'nickname', required: false, description: '昵称搜索' })
  @ApiQuery({ name: 'status', required: false, description: '用户状态 (1: 启用, 0: 禁用)', enum: [0, 1] })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getUserList(@Query() queryUserDto: QueryUserDto) {
    const page = queryUserDto.page || 1;
    const limit = queryUserDto.limit || 10;
    
    // 构建查询条件
    const query: any = {};
    if (queryUserDto.username) query.username = queryUserDto.username;
    if (queryUserDto.email) query.email = queryUserDto.email;
    if (queryUserDto.nickname) query.nickname = queryUserDto.nickname;
    if (queryUserDto.status !== undefined) query.status = queryUserDto.status;

    const { users, total } = await this.userService.findAll(page, limit, query);
    
    return {
      code: 200,
      data: {
        list: users,
        total,
        page,
        limit,
      },
    };
  }

  // 删除用户(需要登录)
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @OperationLog('用户管理', '删除用户')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '删除用户' })
  @ApiParam({ name: 'id', description: '用户ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async deleteUser(@Param('id', ParseIntPipe) id: number) {
    await this.userService.remove(id);
    return {
      code: 200,
      message: '删除成功',
    };
  }

  // 更新用户状态(需要登录)
  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @OperationLog('用户管理', '更新用户状态')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '更新用户状态' })
  @ApiParam({ name: 'id', description: '用户ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateUserStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: number,
  ) {
    const user = await this.userService.updateStatus(id, status);
    const { password, ...result } = user;
    return {
      code: 200,
      message: '状态更新成功',
      data: result,
    };
  }

  // 更新用户信息(需要登录)
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @OperationLog('用户管理', '更新用户信息')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '更新用户信息' })
  @ApiParam({ name: 'id', description: '用户ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateData: Partial<CreateUserDto>,
  ) {
    const user = await this.userService.update(id, updateData);
    const { password, ...result } = user;
    return {
      code: 200,
      message: '更新成功',
      data: result,
    };
  }

  // 给用户分配角色
  @Post(':id/roles')
  @UseGuards(JwtAuthGuard)
  @OperationLog('用户管理', '分配用户角色')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '给用户分配角色' })
  @ApiParam({ name: 'id', description: '用户ID' })
  @ApiBody({ schema: { example: { roleIds: [1, 2] } } })
  @ApiResponse({ status: 200, description: '分配成功' })
  async assignRoles(
    @Param('id', ParseIntPipe) id: number,
    @Body('roleIds') roleIds: number[],
  ) {
    await this.userService.assignRoles(id, roleIds);
    return {
      code: 200,
      message: '分配角色成功',
    };
  }

  // 获取用户的角色列表
  @Get(':id/roles')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '获取用户的角色列表' })
  @ApiParam({ name: 'id', description: '用户ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getUserRoles(@Param('id', ParseIntPipe) id: number) {
    const roleIds = await this.userService.getUserRoles(id);
    return {
      code: 200,
      data: roleIds,
    };
  }
}
