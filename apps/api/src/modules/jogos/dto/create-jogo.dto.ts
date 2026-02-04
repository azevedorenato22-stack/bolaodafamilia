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

export class CreateJogoDto {
  @IsUUID()
  bolaoId: string;

  @IsUUID()
  rodadaId: string;

  @IsUUID()
  timeCasaId: string;

  @IsUUID()
  timeForaId: string;

  @IsDateString()
  dataHora: string;

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
