import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { PalpitesService } from "./palpites.service";
import { CreatePalpiteDto } from "./dto/create-palpite.dto";
import { UpdatePalpiteDto } from "./dto/update-palpite.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { TipoUsuario } from "@prisma/client";

@Controller("palpites")
@UseGuards(JwtAuthGuard, RolesGuard)
export class PalpitesController {
  constructor(private readonly palpitesService: PalpitesService) {}

  /**
   * Criar palpite (usuário ou admin)
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createPalpiteDto: CreatePalpiteDto, @CurrentUser() user: any) {
    return this.palpitesService.create(user, createPalpiteDto);
  }

  /**
   * Atualizar palpite (dono) ou admin a qualquer momento
   */
  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() updatePalpiteDto: UpdatePalpiteDto,
    @CurrentUser() user: any,
  ) {
    return this.palpitesService.update(id, user, updatePalpiteDto);
  }

  /**
   * Listar palpites de um jogo
   * - Antes do jogo: retorna apenas o palpite do solicitante
   * - Após o jogo: retorna todos os palpites
   * - Admin sempre vê todos
   */
  @Get("jogo/:jogoId")
  findByJogo(@Param("jogoId") jogoId: string, @CurrentUser() user: any) {
    return this.palpitesService.findByJogo(jogoId, user);
  }

  /**
   * Admin pode atualizar palpite de qualquer usuário a qualquer momento
   */
  @Patch(":id/admin")
  @Roles(TipoUsuario.ADMIN)
  updateAsAdmin(
    @Param("id") id: string,
    @Body() updatePalpiteDto: UpdatePalpiteDto,
    @CurrentUser() user: any,
  ) {
    return this.palpitesService.update(id, user, updatePalpiteDto, true);
  }

  /**
   * Palpites do usuário autenticado para um bolão
   */
  @Get("me")
  findMine(@CurrentUser() user: any, @Query("bolaoId") bolaoId?: string) {
    return this.palpitesService.findMine(user, bolaoId);
  }
}
