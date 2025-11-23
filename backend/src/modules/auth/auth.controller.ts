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
    // 添加详细的请求上下文日志，便于问题排查
    const requestContext = {
      method: req?.method,
      url: req?.originalUrl,
      hasBody: !!req?.body,
      hasHeaders: !!req?.headers,
      hasCookies: !!req?.cookies,
      hasUser: !!req?.user,
    };
    
    this.logger.debug(`登出请求开始: ${JSON.stringify(requestContext)}`);
    
    try {
      // 尝试获取刷新令牌 - 增加更详细的日志
      let refreshToken: string | undefined;
      try {
        // 详细记录每个可能的令牌来源
        const cookieTokenExists = req && req.cookies && typeof req.cookies === 'object' && req.cookies.refreshToken !== undefined;
        const bodyTokenExists = req && req.body && typeof req.body === 'object' && req.body.refreshToken !== undefined;
        const headerTokenExists = req && req.headers && typeof req.headers === 'object' && req.headers['x-refresh-token'] !== undefined;
        
        this.logger.debug(`令牌来源检查 - Cookie: ${cookieTokenExists}, Body: ${bodyTokenExists}, Header: ${headerTokenExists}`);
        
        // 更严格的安全检查，确保每个属性都存在
        if (cookieTokenExists) {
          refreshToken = String(req.cookies.refreshToken);
          this.logger.debug('从Cookie获取到刷新令牌');
        } else if (bodyTokenExists) {
          refreshToken = String(req.body.refreshToken);
          this.logger.debug('从请求体获取到刷新令牌');
        } else if (headerTokenExists) {
          refreshToken = String(req.headers['x-refresh-token']);
          this.logger.debug('从请求头获取到刷新令牌');
        } else {
          this.logger.debug('未找到刷新令牌');
        }
        
        // 尝试验证和吊销单个令牌
        if (refreshToken) {
          try {
            await this.authService.revokeRefreshToken(refreshToken);
            this.logger.debug('成功吊销单个刷新令牌');
          } catch (e) {
            this.logger.debug('吊销单个令牌失败，但继续登出流程', (e as any)?.message || 'Unknown error');
          }
        }
      } catch (e) {
        this.logger.error('处理令牌时出错', {
          errorType: e?.constructor?.name,
          errorMessage: (e as any)?.message,
          stack: (e as any)?.stack
        });
      }
      
      // 尝试从用户信息中吊销所有令牌
      try {
        if (req?.user) {
          const user = req.user as any;
          this.logger.debug(`用户信息存在: ${user?.username || '未知用户'}`);
          
          const possibleIds = [
            user.id,
            user.userId,
            user.sub,
            user?.user?.id,
            user?.data?.id
          ];
          
          // 查找有效的用户ID
          let userId: number | undefined;
          for (const id of possibleIds) {
            if (id !== undefined && id !== null) {
              const numId = typeof id === 'string' ? parseInt(id, 10) : id;
              if (typeof numId === 'number' && !isNaN(numId) && numId > 0) {
                userId = numId;
                this.logger.debug(`找到有效的用户ID: ${userId}`);
                break;
              }
            }
          }
          
          // 吊销用户所有令牌
          if (userId) {
            try {
              await this.authService.revokeAllUserRefreshTokens(userId);
              this.logger.debug(`成功吊销用户ID ${userId} 的所有令牌`);
            } catch (e) {
              this.logger.warn(`吊销用户ID ${userId} 的所有令牌失败，但继续登出流程`, (e as any)?.message || 'Unknown error');
            }
          } else {
            this.logger.warn('无法从用户信息中获取有效的用户ID');
          }
        } else {
          this.logger.warn('请求中没有用户信息');
        }
      } catch (e) {
        this.logger.error('处理用户信息时出错', {
          errorType: e?.constructor?.name,
          errorMessage: (e as any)?.message,
          stack: (e as any)?.stack
        });
      }
      
      // 清除响应Cookie
      try {
        res.clearCookie('refreshToken', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/api/auth/refresh'
        });
        this.logger.debug('已清除响应中的refreshToken Cookie');
      } catch (e) {
        this.logger.debug('清除Cookie失败，但继续登出流程', (e as any)?.message || 'Unknown error');
      }
      
      // 总是返回成功，无论内部操作是否成功
      this.logger.debug('登出请求完成');
      return res.status(200).json({
        code: 200,
        message: '注销成功'
      });
    } catch (error: any) {
      // 捕获所有未预期的错误，但仍然返回成功
      this.logger.error('登出过程中发生错误', {
        errorType: error?.constructor?.name,
        errorMessage: error?.message,
        stack: error?.stack
      });
      return res.status(200).json({
        code: 200,
        message: '注销成功'
      });
    }
  }
}

