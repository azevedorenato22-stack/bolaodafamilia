import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsOptional,
  Min,
  MaxLength,
  IsBoolean,
  IsArray,
  IsUUID,
} from "class-validator";

export class CreateRodadaDto {
  @IsString()
  @IsNotEmpty({ message: "Nome da rodada é obrigatório" })
  @MaxLength(100, { message: "Nome deve ter no máximo 100 caracteres" })
  nome: string;

  @IsOptional()
  @IsInt({ message: "Número de ordem deve ser um número inteiro" })
  @Min(1, { message: "Número de ordem deve ser maior que zero" })
  numeroOrdem?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: "Descrição deve ter no máximo 500 caracteres" })
  descricao?: string;

  @IsOptional()
  @IsBoolean({ message: "Ativo deve ser um booleano" })
  ativo?: boolean;

  @IsOptional()
  @IsArray({ message: "bolaoIds deve ser um array" })
  @IsUUID("4", { each: true, message: "Cada ID de bolão deve ser um UUID válido" })
  bolaoIds?: string[];
}
