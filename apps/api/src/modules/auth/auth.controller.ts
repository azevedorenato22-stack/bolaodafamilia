import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto, RefreshTokenDto, RegisterDto } from "./dto/login.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { CurrentUser } from "./decorators/current-user.decorator";
import { Public } from "./decorators/public.decorator";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Login de usuário
   * @returns Access token + Refresh token + dados do usuário
   */
  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  /**
   * Registro de novo usuário
   * @returns Access token + Refresh token + dados do usuário
   */
  @Public()
  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  /**
   * Renovar access token usando refresh token
   * @returns Novos access token + refresh token
   */
  @Public()
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto);
  }

  /**
   * Obter dados do usuário autenticado
   * @returns Dados do usuário do token JWT
   */
  @Get("me")
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: any) {
    return {
      id: user.id,
      nome: user.nome,
      usuario: user.usuario,
      email: user.email,
      tipo: user.tipo,
      ativo: user.ativo,
    };
  }

  /**
   * Logout (invalidação de token do lado do cliente)
   * @returns Mensagem de sucesso
   */
  @Post("logout")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout() {
    // Token é invalidado no cliente removendo do localStorage
    return {
      message: "Logout realizado com sucesso",
    };
  }
}
