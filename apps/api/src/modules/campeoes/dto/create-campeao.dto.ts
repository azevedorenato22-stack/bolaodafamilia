import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from "class-validator";
import { Type } from "class-transformer";

export class CreateCampeaoDto {
  @IsUUID()
  bolaoId: string;

  @IsString()
  @MaxLength(255)
  nome: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsDateString()
  dataLimite: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pontuacao?: number;
}
