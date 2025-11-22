/*
 * @Author: chenglu chenglud@digitalchina.com
 * @Date: 2025-11-14 13:54:34
 * @LastEditors: chenglu chenglud@digitalchina.com
 * @LastEditTime: 2025-11-14 16:07:40
 * @FilePath: \nestAdmin\backend\src\modules\auth\auth.service.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserService } from '../user/user.service';
import { LoginDto } from './dto/login.dto';
import { RefreshToken } from './entities/refresh-token.entity';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  async login(loginDto: LoginDto) {
    const { username, password } = loginDto;
    
    this.logger.log(`登录请求: username=${username}`);
    
    // 查找用户
    const user = await this.userService.findByUsername(username);
    
    if (!user) {
      this.logger.warn(`登录失败: 用户不存在 username=${username}`);
      throw new UnauthorizedException('用户名或密码错误');
    }
    
    this.logger.debug(`找到用户: id=${user.id}, username=${user.username}`);

    // 验证密码
    const isPasswordValid = await this.userService.validatePassword(password, user.password);
    
    if (!isPasswordValid) {
      this.logger.warn(`登录失败: 密码错误 username=${username}`);
      throw new UnauthorizedException('用户名或密码错误');
    }

    // 检查用户状态
    if (user.status !== 1) {
      this.logger.warn(`登录失败: 账号已禁用 username=${username}`);
      throw new UnauthorizedException('账号已被禁用');
    }

    // 生成访问令牌和刷新令牌
    const accessToken = this.generateAccessToken(user.id, user.username);
    const refreshToken = await this.generateAndSaveRefreshToken(user.id);
    
    this.logger.log(`登录成功: username=${username}, userId=${user.id}`);

    return {
      code: 200,
      message: '登录成功',
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          email: user.email,
        },
      },
    };
  }

  // 生成访问令牌
  private generateAccessToken(userId: number, username: string): string {
    const payload = {
      sub: userId,
      username: username,
    };
    
    const expiresIn = this.configService.get('JWT_EXPIRES_IN') || '15m';
    return this.jwtService.sign(payload, { expiresIn });
  }

  // 生成并保存刷新令牌
  private async generateAndSaveRefreshToken(userId: number): Promise<string> {
    // 生成随机的刷新令牌
    const token = crypto.randomBytes(40).toString('hex');
    
    // 设置过期时间（默认30天）
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (this.configService.get('REFRESH_TOKEN_EXPIRES_IN_DAYS') || 30));
    
    // 创建刷新令牌记录
    const refreshToken = this.refreshTokenRepository.create({
      token,
      userId,
      expiresAt,
      isRevoked: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    await this.refreshTokenRepository.save(refreshToken);
    return token;
  }

  // 刷新令牌
  async refreshToken(oldRefreshToken: string) {
    const refreshToken = await this.validateRefreshToken(oldRefreshToken);
    
    // 查找用户
    const user = await this.validateUser(refreshToken.userId);
    
    // 吊销旧的刷新令牌
    await this.revokeRefreshToken(oldRefreshToken);
    
    // 生成新的访问令牌和刷新令牌
    const newAccessToken = this.generateAccessToken(user.id, user.username);
    const newRefreshToken = await this.generateAndSaveRefreshToken(user.id);
    
    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  // 验证刷新令牌
  private async validateRefreshToken(token: string): Promise<RefreshToken> {
    const refreshToken = await this.refreshTokenRepository.findOne({
      where: { token },
    });
    
    if (!refreshToken) {
      throw new UnauthorizedException('无效的刷新令牌');
    }
    
    if (refreshToken.isExpired()) {
      await this.refreshTokenRepository.remove(refreshToken);
      throw new UnauthorizedException('刷新令牌已过期');
    }
    
    if (refreshToken.isRevoked) {
      throw new UnauthorizedException('刷新令牌已被吊销');
    }
    
    return refreshToken;
  }

  // 吊销刷新令牌
  async revokeRefreshToken(token: string): Promise<void> {
    const refreshToken = await this.refreshTokenRepository.findOne({
      where: { token },
    });
    
    if (refreshToken) {
      refreshToken.isRevoked = true;
      refreshToken.updatedAt = new Date();
      await this.refreshTokenRepository.save(refreshToken);
    }
  }

  // 吊销用户的所有刷新令牌
  async revokeAllUserRefreshTokens(userId: number): Promise<void> {
    await this.refreshTokenRepository.update(
      { userId, isRevoked: false },
      { isRevoked: true, updatedAt: new Date() }
    );
  }

  async validateUser(userId: number) {
    const user = await this.userService.findById(userId);
    if (!user || user.status !== 1) {
      throw new UnauthorizedException('用户不存在或已被禁用');
    }
    return user;
  }
}
