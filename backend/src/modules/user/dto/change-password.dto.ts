import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({
    description: '当前密码',
    example: 'oldPassword123',
  })
  @IsString()
  @IsNotEmpty({ message: '当前密码不能为空' })
  oldPassword: string;

  @ApiProperty({
    description: '新密码',
    example: 'newPassword123',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty({ message: '新密码不能为空' })
  @MinLength(6, { message: '新密码至少6个字符' })
  newPassword: string;
}

