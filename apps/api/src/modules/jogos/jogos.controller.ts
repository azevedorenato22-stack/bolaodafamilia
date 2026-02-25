import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import { JogosService } from "./jogos.service";
import { CreateJogoDto } from "./dto/create-jogo.dto";
import { UpdateJogoDto } from "./dto/update-jogo.dto";
import { UpdateStatusJogoDto } from "./dto/update-status-jogo.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { Public } from "../auth/decorators/public.decorator";
import { StatusJogo, TipoUsuario } from "@prisma/client";

@Controller("jogos")
@UseGuards(JwtAuthGuard, RolesGuard)
export class JogosController {
  constructor(private readonly jogosService: JogosService) { }

  /**
   * Criar jogo vinculado a bolão e rodada (ADMIN)
   */
  @Post()
  @Roles(TipoUsuario.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createJogoDto: CreateJogoDto) {
    return this.jogosService.create(createJogoDto);
  }

  /**
   * Listar jogos (público) com filtros opcionais
   */
  @Get()
  @Public()
  findAll(
    @Query("bolaoId") bolaoId?: string,
    @Query("rodadaId") rodadaId?: string,
    @Query("status") status?: StatusJogo,
    @Query("data") data?: string,
    @Query("periodo") periodo?: "HOJE" | "FUTURO",
    @Query("tzOffset") tzOffset?: string,
  ) {
    const parsedTzOffset =
      tzOffset === undefined ? undefined : Number.parseInt(tzOffset, 10);
    return this.jogosService.findAll({
      bolaoId,
      rodadaId,
      status,
      data,
      periodo,
      tzOffset: Number.isNaN(parsedTzOffset as number)
        ? undefined
        : parsedTzOffset,
    });
  }

  /**
   * Buscar jogo por ID (público)
   */
  @Get(":id")
  @Public()
  findOne(@Param("id") id: string) {
    return this.jogosService.findById(id);
  }

  /**
   * Listar palpites de um jogo (Somente se FECHADO/ENCERRADO)
   */
  @Get(":id/palpites")
  @Get(":id/palpites")
  // Removido Public para garantir que recebemos o usuário logado
  findPalpites(@Param("id") id: string, @Query("userId") userId?: string, @Body() body?: any, @Request() req?: any) {
    // Em REST puro no NestJS com Guard, o user vem no request object
    // Mas preciso injetar o REQUEST context... ou usar decorator @Req() ou @User()
    // Vou usar o decorator @User() customizado ou @Request() req
    return this.jogosService.listarPalpitesDoJogo(id, req?.user);
  }

  /**
   * Atualizar jogo (ADMIN) — permite editar todos os campos
   */
  @Patch(":id")
  @Roles(TipoUsuario.ADMIN)
  update(@Param("id") id: string, @Body() updateJogoDto: UpdateJogoDto) {
    return this.jogosService.update(id, updateJogoDto);
  }

  /**
   * Atualizar apenas o status do jogo (ADMIN) com validação de transições
   */
  @Patch(":id/status")
  @Roles(TipoUsuario.ADMIN)
  updateStatus(
    @Param("id") id: string,
    @Body() updateStatusDto: UpdateStatusJogoDto,
  ) {
    return this.jogosService.updateStatus(id, updateStatusDto);
  }

  /**
   * Remover jogo (ADMIN) — exige confirmação via query `?confirm=true`
   */
  @Delete(":id")
  @Roles(TipoUsuario.ADMIN)
  @HttpCode(HttpStatus.OK)
  remove(
    @Param("id") id: string,
    @Query("confirm") confirm?: string,
    @Query("senha") senha?: string,
  ) {
    return this.jogosService.remove(id, confirm === "true", senha);
  }
}
