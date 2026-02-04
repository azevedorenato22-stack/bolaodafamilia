export interface Usuario {
  id: string;
  nome: string;
  usuario: string;
  email: string;
  tipo: TipoUsuario;
  ativo: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export enum TipoUsuario {
  ADMIN = 'ADMIN',
  USUARIO = 'USUARIO',
}

export interface LoginDto {
  usuario: string;
  senha: string;
}

export interface RegisterDto {
  nome: string;
  usuario: string;
  email: string;
  senha: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
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

export interface JwtPayload {
  sub: string;
  usuario: string;
  email: string;
  tipo: TipoUsuario;
  iat?: number;
  exp?: number;
}
