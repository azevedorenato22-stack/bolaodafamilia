import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from "class-validator";
import { StatusJogo, VencedorPenaltis } from "@prisma/client";
import { Type } from "class-transformer";

export class UpdateJogoDto {
  @IsOptional()
  @IsUUID()
  bolaoId?: string;

  @IsOptional()
  @IsUUID()
  rodadaId?: string;

  @IsOptional()
  @IsUUID()
  timeCasaId?: string;

  @IsOptional()
  @IsUUID()
  timeForaId?: string;

  @IsOptional()
  @IsDateString()
  dataHora?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  local?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  mataMata?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  resultadoCasa?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  resultadoFora?: number;

  @IsOptional()
  @IsEnum(VencedorPenaltis)
  vencedorPenaltis?: VencedorPenaltis;

  @IsOptional()
  @IsEnum(StatusJogo)
  status?: StatusJogo;
}
