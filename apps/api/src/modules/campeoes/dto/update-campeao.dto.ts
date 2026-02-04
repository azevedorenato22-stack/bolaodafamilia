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

export class UpdateCampeaoDto {
  @IsOptional()
  @IsUUID()
  bolaoId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  nome?: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsDateString()
  dataLimite?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pontuacao?: number;

  @IsOptional()
  @IsUUID()
  resultadoFinalId?: string | null;
}
