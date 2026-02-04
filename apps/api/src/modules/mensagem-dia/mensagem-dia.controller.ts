import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from "@nestjs/common";
import { MensagemDiaService } from "./mensagem-dia.service";
import { CreateMensagemDiaDto } from "./dto/create-mensagem-dia.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { TipoUsuario } from "@prisma/client";
import { Public } from "../auth/decorators/public.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@Controller("mensagem-dia")
@UseGuards(JwtAuthGuard, RolesGuard)
export class MensagemDiaController {
  constructor(private readonly mensagemDiaService: MensagemDiaService) {}

  @Post()
  @Roles(TipoUsuario.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateMensagemDiaDto, @CurrentUser() user: any) {
    return this.mensagemDiaService.upsert(dto, user?.id);
  }

  @Delete()
  @Roles(TipoUsuario.ADMIN)
  @HttpCode(HttpStatus.OK)
  remove() {
    return this.mensagemDiaService.remove();
  }

  @Get()
  @Public()
  getAtual() {
    return this.mensagemDiaService.getAtual();
  }
}
