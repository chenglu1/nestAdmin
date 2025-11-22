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
      // 从Cookie中获取刷新令牌，这是优先方式
      const cookieRefreshToken = req.cookies?.refreshToken;
      
      // 如果Cookie中没有，则尝试从请求头或请求体中获取作为备选
      const refreshToken = cookieRefreshToken || req.body.refreshToken || req.headers['x-refresh-token'];
      
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
      // 安全地获取刷新令牌，增加更多安全检查 (端口已完全释放)
      let refreshToken: string | undefined;
      
      // 从请求体获取
      if (req.body && typeof req.body === 'object' && 'refreshToken' in req.body) {
        refreshToken = req.body.refreshToken;
      }
      
      // 从请求头获取
      if (!refreshToken && req.headers && typeof req.headers === 'object' && 'x-refresh-token' in req.headers) {
        refreshToken = typeof req.headers['x-refresh-token'] === 'string' ? req.headers['x-refresh-token'] : undefined;
      }
      
      // 从Cookie获取作为备选
      if (!refreshToken && req.cookies && typeof req.cookies === 'object' && 'refreshToken' in req.cookies) {
        refreshToken = req.cookies.refreshToken;
      }
      
      // 如果找到了刷新令牌，尝试吊销它
      if (refreshToken && typeof refreshToken === 'string') {
        try {
          await this.authService.revokeRefreshToken(refreshToken);
        } catch (tokenError: any) {
          // 如果吊销单个令牌失败，继续执行，不影响整体登出流程
          this.logger.warn('吊销单个刷新令牌失败', tokenError?.stack || 'Unknown error');
        }
      }
      
      // 如果用户已认证，尝试吊销该用户的所有刷新令牌
      try {
        if (req.user && typeof req.user === 'object') {
          let userId: number | undefined;
          
          // 支持多种用户ID来源
          if ('id' in req.user && typeof req.user.id === 'number') {
            userId = req.user.id;
          } else if ('userId' in req.user && typeof req.user.userId === 'number') {
            userId = req.user.userId;
          } else if ('sub' in req.user) {
            const sub = req.user.sub;
            if (typeof sub === 'number') {
              userId = sub;
            } else if (typeof sub === 'string') {
              const parsedId = parseInt(sub, 10);
              userId = !isNaN(parsedId) ? parsedId : undefined;
            }
          }
          
          if (userId && userId > 0) {
            await this.authService.revokeAllUserRefreshTokens(userId);
          }
        }
      } catch (userError: any) {
        // 如果吊销用户所有令牌失败，继续执行
        this.logger.warn('吊销用户所有刷新令牌失败', userError?.stack || 'Unknown error');
      }
      
      // 无论如何都返回成功，确保用户体验
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

