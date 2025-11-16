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
import { UserService } from '../user/user.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private userService: UserService,
    private jwtService: JwtService,
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

    // 生成 JWT token
    const payload = {
      sub: user.id,
      username: user.username,
    };
    const token = this.jwtService.sign(payload);
    
    this.logger.log(`登录成功: username=${username}, userId=${user.id}`);

    return {
      code: 200,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          email: user.email,
        },
      },
    };
  }

  async validateUser(userId: number) {
    const user = await this.userService.findById(userId);
    if (!user || user.status !== 1) {
      throw new UnauthorizedException('用户不存在或已被禁用');
    }
    return user;
  }
}
