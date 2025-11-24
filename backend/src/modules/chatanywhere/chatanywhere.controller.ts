import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ChatanywhereService } from './chatanywhere.service';

@ApiTags('chatanywhere')
@Controller('chatanywhere')
export class ChatanywhereController {
  constructor(private readonly chatanywhereService: ChatanywhereService) {}

  @ApiOperation({ summary: '获取可用的模型列表' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: '成功获取模型列表' })
  @ApiResponse({ status: 500, description: '服务器错误' })
  @Get('models')
  @HttpCode(HttpStatus.OK)
  async getModels() {
    const response = await this.chatanywhereService.getModels();
    return {
      code: 200,
      message: '获取成功',
      data: {
        list: response.data,
        total: response.data.length
      }
    };
  }
}
