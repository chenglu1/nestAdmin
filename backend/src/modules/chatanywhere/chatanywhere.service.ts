import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { ModelListResponse } from './dto/model.dto';

@Injectable()
export class ChatanywhereService {
  private readonly apiKey: string;
  private readonly apiBaseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiKey = this.configService.get<string>('CHATANYWHERE_API_KEY') || '';
    this.apiBaseUrl = this.configService.get<string>('CHATANYWHERE_API_BASE_URL') || 'https://api.chatanywhere.tech/v1';
  }

  async getModels(): Promise<ModelListResponse> {
    try {
      // 检查API密钥是否存在
      if (!this.apiKey || this.apiKey === 'your_chatanywhere_api_key_here') {
        throw new HttpException(
          'ChatAnywhere API密钥未配置，请联系管理员',
          HttpStatus.UNAUTHORIZED,
        );
      }

      const headers = {
        Authorization: `Bearer ${this.apiKey}`,
      };

      const response = await firstValueFrom(
        this.httpService.get<ModelListResponse>(`${this.apiBaseUrl}/models`, { headers }),
      );

      return response.data;
    } catch (error: any) {
      // 如果是我们自己抛出的错误，直接重新抛出
      if (error instanceof HttpException) {
        throw error;
      }

      if (error.response) {
        // 处理API响应错误
        if (error.response.status === 401) {
          throw new HttpException(
            'ChatAnywhere API认证失败，请检查API密钥配置',
            HttpStatus.UNAUTHORIZED,
          );
        }
        throw new HttpException(
          `ChatAnywhere API错误: ${error.response.data?.message || '获取模型列表失败'}`,
          error.response.status || HttpStatus.INTERNAL_SERVER_ERROR,
        );
      } else if (error.request) {
        throw new HttpException(
          '无法连接到ChatAnywhere API，请检查网络连接',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      } else {
        throw new HttpException(
          `错误: ${error.message || '发生未知错误'}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }
}
