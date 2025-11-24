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
      const headers = {
        Authorization: `Bearer ${this.apiKey}`,
      };

      const response = await firstValueFrom(
        this.httpService.get<ModelListResponse>(`${this.apiBaseUrl}/models`, { headers }),
      );

      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new HttpException(
          `ChatAnywhere API Error: ${error.response.data?.message || 'Failed to fetch models'}`,
          error.response.status || HttpStatus.INTERNAL_SERVER_ERROR,
        );
      } else if (error.request) {
        throw new HttpException(
          'No response received from ChatAnywhere API',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      } else {
        throw new HttpException(
          `Error: ${error.message || 'Unknown error occurred'}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }
}
