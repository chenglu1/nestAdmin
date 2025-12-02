import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { ModelListResponse } from './dto/model.dto';
import { ChatRequest, ChatResponse } from './dto/chat.dto';
import { Response } from 'express';

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

  async chat(request: ChatRequest, res: Response): Promise<void> {
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
        'Content-Type': 'application/json',
      };

      // 如果是流式响应
      if (request.stream) {
        // 设置SSE响应头 - 符合SSE标准规范
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no'); // 禁用Nginx缓冲

        // 使用axios的流式响应
        const axiosResponse = await this.httpService.post(
          `${this.apiBaseUrl}/chat/completions`,
          request,
          {
            headers,
            responseType: 'stream',
          },
        ).toPromise();

        if (!axiosResponse) {
          throw new HttpException('获取聊天响应失败', HttpStatus.INTERNAL_SERVER_ERROR);
        }

        const stream = axiosResponse.data;

        // 监听数据流
        stream.on('data', (chunk: Buffer) => {
          // 将数据块转换为字符串
          const chunkStr = chunk.toString('utf-8');
          // 将数据块发送给客户端 - 确保符合SSE标准
          res.write(chunkStr);
          // 确保数据立即发送，不被缓冲
          if (res.flush) {
            res.flush();
          }
          // 注意：不要添加额外的换行符，这会破坏SSE格式
        });

        // 监听流结束
        stream.on('end', () => {
          // 发送结束信号 - 符合SSE标准
          res.write('data: [DONE]\n\n');
          if (res.flush) {
            res.flush();
          }
          res.end();
        });

        // 监听流错误
        stream.on('error', (error: any) => {
          console.error('流式响应错误:', error);
          // 发送错误事件 - 符合SSE标准
          res.write(`event: error\ndata: ${JSON.stringify({ message: '流式响应错误' })}\n\n`);
          if (res.flush) {
            res.flush();
          }
          res.status(HttpStatus.INTERNAL_SERVER_ERROR).end();
        });

        // 监听客户端断开连接
        res.on('close', () => {
          // 关闭流
          stream.destroy();
        });
      } else {
        // 非流式响应
        const response = await firstValueFrom(
          this.httpService.post<ChatResponse>(`${this.apiBaseUrl}/chat/completions`, request, { headers }),
        );

        // 返回JSON响应
        res.json({
          code: 200,
          message: '获取成功',
          data: response.data,
        });
      }
    } catch (error: any) {
      // 如果是我们自己抛出的错误，直接重新抛出
      if (error instanceof HttpException) {
        res.status(error.getStatus()).json({
          code: error.getStatus(),
          message: error.message,
        });
        return;
      }

      if (error.response) {
        // 处理API响应错误
        if (error.response.status === 401) {
          res.status(HttpStatus.UNAUTHORIZED).json({
            code: HttpStatus.UNAUTHORIZED,
            message: 'ChatAnywhere API认证失败，请检查API密钥配置',
          });
        } else {
          res.status(error.response.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
            code: error.response.status || HttpStatus.INTERNAL_SERVER_ERROR,
            message: `ChatAnywhere API错误: ${error.response.data?.message || '获取聊天响应失败'}`,
          });
        }
      } else if (error.request) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          code: HttpStatus.INTERNAL_SERVER_ERROR,
          message: '无法连接到ChatAnywhere API，请检查网络连接',
        });
      } else {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          code: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `错误: ${error.message || '发生未知错误'}`,
        });
      }
    }
  }
}
