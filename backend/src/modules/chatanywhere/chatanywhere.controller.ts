import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ChatanywhereService } from './chatanywhere.service';

@Controller('chatanywhere')
export class ChatanywhereController {
  constructor(private readonly chatanywhereService: ChatanywhereService) {}

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
