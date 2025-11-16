import { IsString, IsInt, IsOptional, Min, Max } from 'class-validator';

export class CreateMenuDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  path?: string;

  @IsString()
  @IsOptional()
  component?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsInt()
  @IsOptional()
  parentId?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  sort?: number;

  @IsInt()
  @Min(1)
  @Max(2)
  @IsOptional()
  type?: number;

  @IsInt()
  @Min(0)
  @Max(1)
  @IsOptional()
  status?: number;
}

export class UpdateMenuDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  path?: string;

  @IsString()
  @IsOptional()
  component?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsInt()
  @IsOptional()
  parentId?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  sort?: number;

  @IsInt()
  @Min(1)
  @Max(2)
  @IsOptional()
  type?: number;

  @IsInt()
  @Min(0)
  @Max(1)
  @IsOptional()
  status?: number;
}
