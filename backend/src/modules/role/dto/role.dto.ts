import { IsString, IsInt, IsOptional, IsArray, Min, Max } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  name: string;

  @IsString()
  code: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @Min(0)
  @Max(1)
  @IsOptional()
  status?: number;
}

export class UpdateRoleDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @Min(0)
  @Max(1)
  @IsOptional()
  status?: number;
}

export class AssignMenusDto {
  @IsArray()
  @IsInt({ each: true })
  menuIds: number[];
}
