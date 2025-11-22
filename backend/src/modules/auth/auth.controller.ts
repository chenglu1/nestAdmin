import { Controller, Post, Body, Request, Res, HttpStatus, Logger } from '@nestjs/common';
import { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { OperationLog } from '../log/decorators/operation-log.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @OperationLog('认证', '用户登录')
  @ApiOperation({ summary: '用户登录', description: '使用用户名和密码登录系统' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: '登录成功',
    schema: {
      example: {
        code: 200,
        message: '登录成功',
        data: {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          refreshToken: 'a1b2c3d4e5f6...',
          user: {
            id: 1,
            username: 'admin',
            nickname: '管理员',
            email: 'admin@example.com'
          }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: '用户名或密码错误' })
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }

  @Post('refresh')
  @ApiOperation({ summary: '刷新访问令牌', description: '使用刷新令牌获取新的访问令牌' })
  @ApiResponse({
    status: 200,
    description: '刷新成功',
    schema: {
      example: {
        code: 200,
        message: '刷新成功',
        data: {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          refreshToken: 'new-refresh-token...'
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: '刷新令牌无效或已过期' })
  @OperationLog('auth', '刷新令牌')
  async refresh(@Request() req: ExpressRequest, @Res() res: ExpressResponse) {
    try {
      // 从请求头或请求体中获取刷新令牌
      const refreshToken = req.body.refreshToken || req.headers['x-refresh-token'];
      
      if (!refreshToken) {
        return res.status(HttpStatus.UNAUTHORIZED).json({
          code: 401,
          message: '缺少刷新令牌',
        });
      }

      const tokens = await this.authService.refreshToken(refreshToken);
      
      return res.json({
        code: 200,
        message: '刷新成功',
        data: tokens,
      });
    } catch (error: any) {
      this.logger.error('刷新令牌失败', error?.stack || 'Unknown error');
      return res.status(HttpStatus.UNAUTHORIZED).json({
        code: 401,
        message: error?.message || '刷新令牌无效',
      });
    }
  }

  @Post('logout')
  @ApiOperation({ summary: '用户登出', description: '用户退出登录并吊销刷新令牌' })
  @ApiResponse({ status: 200, description: '登出成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @OperationLog('auth', '用户登出')
  async logout(@Request() req: ExpressRequest, @Res() res: ExpressResponse) {
    try {
      // 安全地获取刷新令牌，先检查req.body是否存在
      const refreshToken = req.body?.refreshToken || req.headers['x-refresh-token'];
      
      if (refreshToken) {
        // 吊销刷新令牌
        await this.authService.revokeRefreshToken(refreshToken);
      }
      
      // 如果用户已认证，吊销该用户的所有刷新令牌
      if (req.user && 'sub' in req.user) {
        const sub = req.user.sub;
        const userId = typeof sub === 'number' ? sub : 
                      typeof sub === 'string' ? parseInt(sub, 10) : 0;
        if (userId > 0) {
          await this.authService.revokeAllUserRefreshTokens(userId);
        }
      }
      
      return res.json({
        code: 200,
        message: '注销成功',
      });
    } catch (error: any) {
      this.logger.error('登出失败', error?.stack || 'Unknown error');
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        code: 500,
        message: '登出失败',
      });
    }
  }
}

