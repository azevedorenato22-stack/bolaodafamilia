import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import { UsersService } from "../users/users.service";
import {
  LoginDto,
  RefreshTokenDto,
  RegisterDto,
  JwtPayload,
  AuthResponse,
  UserPayload,
} from "./dto/login.dto";
import { TipoUsuario } from "@prisma/client";

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.usersService.findByUsuario(loginDto.usuario);

    if (!user) {
      throw new UnauthorizedException("Credenciais inválidas");
    }

    if (!user.ativo) {
      throw new UnauthorizedException("Usuário desativado");
    }

    const isPasswordValid = await bcrypt.compare(loginDto.senha, user.senha);

    if (!isPasswordValid) {
      throw new UnauthorizedException("Credenciais inválidas");
    }

    return this.generateTokens(user);
  }

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    // Verificar se email já existe
    const existingEmail = await this.usersService.findByEmail(
      registerDto.email,
    );
    if (existingEmail) {
      throw new BadRequestException("Email já cadastrado");
    }

    // Verificar se usuário já existe
    const existingUsuario = await this.usersService.findByUsuario(
      registerDto.usuario,
    );
    if (existingUsuario) {
      throw new BadRequestException("Usuário já cadastrado");
    }

    // Criar usuário
    const user = await this.usersService.create({
      ...registerDto,
      tipo: TipoUsuario.USUARIO,
      ativo: true,
    });

    // Buscar usuário completo para gerar tokens
    const fullUser = await this.usersService.findById(user.id);

    return this.generateTokens(fullUser);
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<AuthResponse> {
    try {
      // Verificar refresh token
      const payload = this.jwtService.verify<JwtPayload>(
        refreshTokenDto.refreshToken,
        {
          secret:
            this.configService.get<string>("JWT_REFRESH_SECRET") ||
            this.configService.get<string>("JWT_SECRET"),
        },
      );

      // Buscar usuário
      const user = await this.usersService.findById(payload.sub);

      if (!user || !user.ativo) {
        throw new UnauthorizedException("Usuário não autorizado");
      }

      // Gerar novos tokens
      return this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException("Refresh token inválido ou expirado");
    }
  }

  private generateTokens(user: any): AuthResponse {
    const payload: JwtPayload = {
      sub: user.id,
      usuario: user.usuario,
      email: user.email,
      tipo: user.tipo,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>("JWT_SECRET"),
      expiresIn: this.configService.get<string>("JWT_EXPIRES_IN") || "7d",
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret:
        this.configService.get<string>("JWT_REFRESH_SECRET") ||
        this.configService.get<string>("JWT_SECRET"),
      expiresIn:
        this.configService.get<string>("JWT_REFRESH_EXPIRES_IN") || "30d",
    });

    return {
      accessToken,
      refreshToken,
      usuario: {
        id: user.id,
        nome: user.nome,
        usuario: user.usuario,
        email: user.email,
        tipo: user.tipo,
        ativo: user.ativo,
      },
    };
  }

  async validateUser(userId: string): Promise<UserPayload> {
    const user = await this.usersService.findById(userId);

    if (!user || !user.ativo) {
      throw new UnauthorizedException("Usuário não autorizado");
    }

    return {
      id: user.id,
      nome: user.nome,
      usuario: user.usuario,
      email: user.email,
      tipo: user.tipo,
      ativo: user.ativo,
    };
  }
}
