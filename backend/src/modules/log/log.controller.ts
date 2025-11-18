import {
  Controller,
  Get,
  Delete,
  Query,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { LogService } from './log.service';
import { QueryLogDto } from './dto/query-log.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('log')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('log')
export class LogController {
  constructor(private readonly logService: LogService) {}

  @Get('list')
  @ApiOperation({ summary: '获取操作日志列表' })
  @ApiQuery({ name: 'username', required: false, description: '用户名' })
  @ApiQuery({ name: 'module', required: false, description: '操作模块' })
  @ApiQuery({ name: 'page', required: false, description: '页码', example: 1 })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: '每页数量',
    example: 10,
  })
  @ApiResponse({ status: 200, description: '查询成功' })
  async findAll(@Query() queryDto: QueryLogDto) {
    const result = await this.logService.findAll(queryDto);
    return {
      code: 200,
      data: {
        list: result.list,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
      message: '获取成功',
    };
  }

  @Get(':id')
  @ApiOperation({ summary: '获取操作日志详情' })
  @ApiParam({ name: 'id', description: '日志ID' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async findOne(@Param('id') id: string) {
    return await this.logService.findOne(+id);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除操作日志' })
  @ApiParam({ name: 'id', description: '日志ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async remove(@Param('id') id: string) {
    await this.logService.remove(+id);
    return { message: '删除成功' };
  }

  @Delete('clear/all')
  @ApiOperation({ summary: '清空所有操作日志' })
  @ApiResponse({ status: 200, description: '清空成功' })
  async clear() {
    await this.logService.clear();
    return { message: '清空成功' };
  }
}
