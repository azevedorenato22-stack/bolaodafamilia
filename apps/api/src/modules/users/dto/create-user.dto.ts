import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
  IsBoolean,
} from "class-validator";
import { TipoUsuario } from "@prisma/client";

export class CreateUserDto {
  @IsString()
  @IsNotEmpty({ message: "Nome é obrigatório" })
  nome: string;

  @IsOptional()
  @IsString()
  usuario?: string;

  @IsOptional()
  @IsEmail({}, { message: "Email inválido" })
  email?: string;

  @IsString()
  @IsNotEmpty({ message: "Senha é obrigatória" })
  @MinLength(6, { message: "Senha deve ter pelo menos 6 caracteres" })
  senha: string;

  @IsOptional()
  @IsEnum(TipoUsuario, { message: "Tipo deve ser ADMIN ou USUARIO" })
  tipo?: TipoUsuario;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
