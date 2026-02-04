import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  IsDateString,
  MaxLength,
  IsArray,
  IsUUID,
} from "class-validator";

export class CreateBolaoDto {
  @IsString()
  @IsNotEmpty({ message: "Nome é obrigatório" })
  @MaxLength(100, { message: "Nome deve ter no máximo 100 caracteres" })
  nome: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: "Descrição deve ter no máximo 500 caracteres" })
  descricao?: string;

  @IsDateString({}, { message: "Data final inválida" })
  @IsNotEmpty({ message: "Data final é obrigatória" })
  dataFim: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  // Configuração de pontuação
  @IsOptional()
  @IsInt({ message: "Pontos para resultado exato deve ser número inteiro" })
  @Min(0, { message: "Pontos não podem ser negativos" })
  pts_resultado_exato?: number;

  @IsOptional()
  @IsInt({ message: "Pontos para vencedor + gols deve ser número inteiro" })
  @Min(0, { message: "Pontos não podem ser negativos" })
  pts_vencedor_gols?: number;

  @IsOptional()
  @IsInt({ message: "Pontos para vencedor deve ser número inteiro" })
  @Min(0, { message: "Pontos não podem ser negativos" })
  pts_vencedor?: number;

  @IsOptional()
  @IsInt({ message: "Pontos para gols de time deve ser número inteiro" })
  @Min(0, { message: "Pontos não podem ser negativos" })
  pts_gols_time?: number;

  @IsOptional()
  @IsInt({ message: "Pontos para campeão deve ser número inteiro" })
  @Min(0, { message: "Pontos não podem ser negativos" })
  pts_campeao?: number;

  @IsOptional()
  @IsInt({ message: "Pontos para pênaltis deve ser número inteiro" })
  @Min(0, { message: "Pontos não podem ser negativos" })
  pts_penaltis?: number;

  // Times associados ao bolão
  @IsOptional()
  @IsArray({ message: "Times deve ser um array" })
  @IsUUID("4", { each: true, message: "ID de time inválido" })
  timeIds?: string[];

  // Rodadas associadas ao bolão
  @IsOptional()
  @IsArray({ message: "Rodadas deve ser um array" })
  @IsUUID("4", { each: true, message: "ID de rodada inválido" })
  rodadaIds?: string[];

  // Participantes (usuários) do bolão
  @IsOptional()
  @IsArray({ message: "Participantes deve ser um array" })
  @IsUUID("4", { each: true, message: "ID de usuário inválido" })
  usuarioIds?: string[];
}
