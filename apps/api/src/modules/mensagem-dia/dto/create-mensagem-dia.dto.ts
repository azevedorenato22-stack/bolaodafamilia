import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";
import { Type } from "class-transformer";

export class CreateMensagemDiaDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  titulo?: string;

  @IsString()
  conteudo: string;

  @IsOptional()
  @IsIn(["info", "alerta", "aviso", "urgente"])
  tipo?: string;

  @IsOptional()
  @IsDateString()
  dataInicio?: string;

  @IsOptional()
  @IsDateString()
  dataFim?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  ativo?: boolean;
}
