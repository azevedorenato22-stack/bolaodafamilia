import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";
import { TipoUsuario } from "@prisma/client";

export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: "Usuário é obrigatório" })
  @MinLength(3, { message: "Usuário deve ter pelo menos 3 caracteres" })
  usuario: string;

  @IsString()
  @IsNotEmpty({ message: "Senha é obrigatória" })
  @MinLength(6, { message: "Senha deve ter pelo menos 6 caracteres" })
  senha: string;
}

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty({ message: "Refresh token é obrigatório" })
  refreshToken: string;
}

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: "Nome é obrigatório" })
  nome: string;

  @IsString()
  @IsNotEmpty({ message: "Usuário é obrigatório" })
  @MinLength(3, { message: "Usuário deve ter pelo menos 3 caracteres" })
  usuario: string;

  @IsEmail({}, { message: "Email inválido" })
  @IsNotEmpty({ message: "Email é obrigatório" })
  email: string;

  @IsString()
  @IsNotEmpty({ message: "Senha é obrigatória" })
  @MinLength(6, { message: "Senha deve ter pelo menos 6 caracteres" })
  senha: string;
}

// ============================================
// INTERFACES (não DTOs)
// ============================================

export interface JwtPayload {
  sub: string;
  usuario: string;
  email: string;
  tipo: TipoUsuario;
  iat?: number;
  exp?: number;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  usuario: {
    id: string;
    nome: string;
    usuario: string;
    email: string;
    tipo: TipoUsuario;
    ativo: boolean;
  };
}

export interface UserPayload {
  id: string;
  nome: string;
  usuario: string;
  email: string;
  tipo: TipoUsuario;
  ativo: boolean;
}
