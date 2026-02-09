import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";
import { TipoUsuario } from "@prisma/client";

export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: "Nome é obrigatório" })
  @MinLength(3, { message: "Nome deve ter pelo menos 3 caracteres" })
  nome: string;

  @IsString()
  @IsNotEmpty({ message: "Senha é obrigatória" })
  @MinLength(4, { message: "Senha deve ter pelo menos 4 caracteres" }) // Reduced min length for simplicity if needed
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
  @MinLength(3, { message: "Nome deve ter pelo menos 3 caracteres" })
  nome: string;

  @IsString()
  @IsNotEmpty({ message: "Senha é obrigatória" })
  @MinLength(4, { message: "Senha deve ter pelo menos 4 caracteres" })
  senha: string;
}

// ============================================
// INTERFACES (não DTOs)
// ============================================

export interface JwtPayload {
  sub: string;
  nome: string;
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
    tipo: TipoUsuario;
    ativo: boolean;
  };
}

export interface UserPayload {
  id: string;
  nome: string;
  tipo: TipoUsuario;
  ativo: boolean;
}
