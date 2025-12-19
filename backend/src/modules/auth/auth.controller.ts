import { Controller, Post, Body, Request, Res, HttpStatus, Logger } from '@nestjs/common';
import { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { OperationLog } from '../log/decorators/operation-log.decorator';
import { ThrottleStrict } from '../../common/decorators/throttle.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ThrottleStrict() // 严格限流：10次请求/60秒，防止暴力破解
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
  async login(@Body() loginDto: LoginDto, @Res() res: ExpressResponse) {
    try {
      const result = await this.authService.login(loginDto);
      
      // 关键修复：显式设置refreshToken到Cookie中
      // 这解决了生产环境中使用相对路径时Cookie无法正确传递的问题
      if (result.data && result.data.refreshToken) {
        res.cookie('refreshToken', result.data.refreshToken, {
          httpOnly: true, // 防止XSS攻击
          secure: process.env.NODE_ENV === 'production', // 生产环境使用HTTPS
          sameSite: 'strict', // 防止CSRF攻击
          path: '/api/auth/refresh', // 只在访问刷新令牌接口时发送
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30天过期，与刷新令牌一致
        });
      }
      
      return res.json(result);
    } catch (error: any) {
      this.logger.error('登录过程中发生错误', error?.stack || 'Unknown error');
      return res.status(HttpStatus.UNAUTHORIZED).json({
        code: 401,
        message: error?.message || '登录失败',
      });
    }
  }

  @Post('refresh')
  @ThrottleStrict() // 严格限流：10次请求/60秒
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
      // 安全地访问req.body
      const bodyRefreshToken = req.body && typeof req.body === 'object' ? req.body.refreshToken : undefined;
      // 安全地访问req.headers
      const headerRefreshToken = req.headers && req.headers['x-refresh-token'] ? String(req.headers['x-refresh-token']) : undefined;
      
      const refreshToken = cookieRefreshToken || bodyRefreshToken || headerRefreshToken;
      
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
    this.logger.debug(`登出请求: ${req?.method} ${req?.originalUrl}`);
    
    // 尝试获取刷新令牌（可选，即使没有也允许登出）
    let refreshToken: string | undefined;
    
    // 从 Cookie 获取
    if (req?.cookies?.refreshToken) {
      refreshToken = String(req.cookies.refreshToken);
      this.logger.debug('从Cookie获取到刷新令牌');
    }
    // 从请求体获取
    else if (req?.body?.refreshToken) {
      refreshToken = String(req.body.refreshToken);
      this.logger.debug('从请求体获取到刷新令牌');
    }
    // 从请求头获取
    else if (req?.headers?.['x-refresh-token']) {
      refreshToken = String(req.headers['x-refresh-token']);
      this.logger.debug('从请求头获取到刷新令牌');
    } else {
      this.logger.debug('未找到刷新令牌，继续登出流程（允许无token登出）');
    }
    
    // 如果有刷新令牌，尝试吊销
    if (refreshToken) {
      try {
        await this.authService.revokeRefreshToken(refreshToken);
        this.logger.debug('成功吊销刷新令牌');
      } catch (e) {
        this.logger.warn('吊销刷新令牌失败，但继续登出流程', (e as any)?.message);
      }
    }
    
    // 尝试从用户信息中吊销所有令牌（如果有用户信息）
    if (req?.user) {
      try {
        const user = req.user as any;
        const userId = user?.userId || user?.id || user?.sub;
        if (userId) {
          await this.authService.revokeAllUserRefreshTokens(userId);
          this.logger.debug(`成功吊销用户ID ${userId} 的所有令牌`);
        }
      } catch (e) {
        this.logger.warn('吊销用户所有令牌失败，但继续登出流程', (e as any)?.message);
      }
    }
    
    // 清除 Cookie（尝试多个路径）
    try {
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/api/auth/refresh'
      });
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
      });
      this.logger.debug('已清除refreshToken Cookie');
    } catch (e) {
      this.logger.warn('清除Cookie失败，但继续登出流程', (e as any)?.message);
    }
    
    // 总是返回成功
    return res.status(200).json({
      code: 200,
      message: '注销成功'
    });
  }
}

