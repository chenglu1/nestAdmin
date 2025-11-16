import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: '用户名',
    example: 'admin',
    required: true,
  })
  @IsString()
  @IsNotEmpty({ message: '用户名不能为空' })
  username: string;

  @ApiProperty({
    description: '密码',
    example: 'admin123',
    required: true,
  })
  @IsString()
  @IsNotEmpty({ message: '密码不能为空' })
  password: string;
}
