import {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
  IsBoolean,
} from "class-validator";
import { TipoUsuario } from "@prisma/client";

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsString()
  @MinLength(3, { message: "Usuário deve ter pelo menos 3 caracteres" })
  usuario?: string;

  @IsOptional()
  @IsEmail({}, { message: "Email inválido" })
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6, { message: "Senha deve ter pelo menos 6 caracteres" })
  senha?: string;

  @IsOptional()
  @IsEnum(TipoUsuario, { message: "Tipo deve ser ADMIN ou USUARIO" })
  tipo?: TipoUsuario;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
