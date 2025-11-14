// src/contacts/dto/query-contacts.dto.ts
import { IsOptional, IsInt, Min, IsIn, IsString, IsBooleanString } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryContactsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['name', 'email', 'createdAt'])
  sortBy?: 'name' | 'email' | 'createdAt';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC';

  // Whether to allow full access only for Admin users
  // When the frontend sends all=true, it arrives as the string "true"
  @IsOptional()
  @IsBooleanString()
  all?: string;
}
