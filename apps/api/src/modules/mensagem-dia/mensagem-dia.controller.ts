import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Param,
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
  constructor(private readonly mensagemDiaService: MensagemDiaService) { }

  @Get("ativas")
  @Public()
  findAllActive() {
    return this.mensagemDiaService.findAllActive();
  }

  @Post()
  @Roles(TipoUsuario.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateMensagemDiaDto, @CurrentUser() user: any) {
    console.log('[DEBUG] Recebido dto:', JSON.stringify(dto));
    console.log('[DEBUG] User:', user?.id);
    return this.mensagemDiaService.create(dto, user?.id);
  }

  @Get("admin")
  @Roles(TipoUsuario.ADMIN)
  findAll() {
    return this.mensagemDiaService.findAll();
  }

  @Delete(":id")
  @Roles(TipoUsuario.ADMIN)
  @HttpCode(HttpStatus.OK)
  remove(@Param("id") id: string) {
    return this.mensagemDiaService.remove(id);
  }
}

