import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from "@nestjs/common";
import { BoloesService } from "./boloes.service";
import { CreateBolaoDto } from "./dto/create-bolao.dto";
import { UpdateBolaoDto } from "./dto/update-bolao.dto";
import { AddTimesBolaoDto } from "./dto/add-times-bolao.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { Public } from "../auth/decorators/public.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { TipoUsuario } from "@prisma/client";

/**
 * Controller para gerenciamento de bolões
 * Endpoints públicos: listar bolões ativos
 * Endpoints admin: CRUD completo
 */
@Controller("boloes")
@UseGuards(JwtAuthGuard, RolesGuard)
export class BoloesController {
  constructor(private readonly boloesService: BoloesService) {}

  /**
   * Criar novo bolão (ADMIN apenas)
   * @returns Dados do bolão criado com times associados
   */
  @Post()
  @Roles(TipoUsuario.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createBolaoDto: CreateBolaoDto) {
    return this.boloesService.create(createBolaoDto);
  }

  /**
   * Listar todos os bolões (ADMIN apenas)
   * @returns Lista completa de bolões com times e estatísticas
   */
  @Get("admin/all")
  @Roles(TipoUsuario.ADMIN)
  findAll() {
    return this.boloesService.findAll();
  }

  /**
   * Listar bolões do usuário autenticado (USUARIO)
   * @returns Lista de bolões ativos onde o usuário participa
   */
  @Get("me")
  @Roles(TipoUsuario.USUARIO)
  findMine(@CurrentUser() user: any) {
    return this.boloesService.findMine(user.id);
  }

  /**
   * Listar bolões disponíveis para o usuário autenticado (USUARIO)
   * Retorna bolões ativos onde o usuário ainda não participa
   */
  @Get("disponiveis")
  @Roles(TipoUsuario.USUARIO)
  findDisponiveis(@CurrentUser() user: any) {
    return this.boloesService.findDisponiveis(user.id);
  }

  /**
   * Entrar em um bolão (USUARIO)
   * Idempotente: se já participa, retorna o vínculo existente
   */
  @Post(":id/entrar")
  @Roles(TipoUsuario.USUARIO)
  @HttpCode(HttpStatus.OK)
  entrar(@Param("id") bolaoId: string, @CurrentUser() user: any) {
    return this.boloesService.entrarNoBolao(bolaoId, user.id);
  }

  /**
   * Sair de um bolão (USUARIO)
   * Remove o vínculo do usuário com o bolão
   */
  @Delete(":id/sair")
  @Roles(TipoUsuario.USUARIO)
  @HttpCode(HttpStatus.OK)
  sair(@Param("id") bolaoId: string, @CurrentUser() user: any) {
    return this.boloesService.sairDoBolao(bolaoId, user.id);
  }

  /**
   * Listar bolões ativos (PÚBLICO)
   * @returns Lista de bolões ativos com times
   */
  @Get()
  @Public()
  findAllActive() {
    return this.boloesService.findAllActive();
  }

  /**
   * Buscar bolão por ID (PÚBLICO)
   * @returns Dados completos do bolão com times e rodadas
   */
  @Get(":id")
  @Public()
  findOne(@Param("id") id: string) {
    return this.boloesService.findById(id);
  }

  /**
   * Obter configuração de pontuação do bolão (PÚBLICO)
   * @returns Regras de pontuação do bolão
   */
  @Get(":id/configuracao")
  @Public()
  getConfiguracao(@Param("id") id: string) {
    return this.boloesService.getConfiguracao(id);
  }

  /**
   * Atualizar bolão (ADMIN apenas)
   * @returns Dados atualizados do bolão
   */
  @Patch(":id")
  @Roles(TipoUsuario.ADMIN)
  update(@Param("id") id: string, @Body() updateBolaoDto: UpdateBolaoDto) {
    return this.boloesService.update(id, updateBolaoDto);
  }

  /**
   * Alternar status ativo/inativo (ADMIN apenas)
   * @returns Dados do bolão com novo status
   */
  @Patch(":id/toggle-active")
  @Roles(TipoUsuario.ADMIN)
  toggleActive(@Param("id") id: string) {
    return this.boloesService.toggleActive(id);
  }

  /**
   * Adicionar times ao bolão (ADMIN apenas)
   * @returns Bolão atualizado com novos times
   */
  @Post(":id/times")
  @Roles(TipoUsuario.ADMIN)
  addTimes(@Param("id") id: string, @Body() addTimesDto: AddTimesBolaoDto) {
    return this.boloesService.addTimes(id, addTimesDto);
  }

  /**
   * Remover times do bolão (ADMIN apenas)
   * @returns Bolão atualizado sem os times removidos
   */
  @Delete(":id/times")
  @Roles(TipoUsuario.ADMIN)
  @HttpCode(HttpStatus.OK)
  removeTimes(@Param("id") id: string, @Body() body: { timeIds: string[] }) {
    return this.boloesService.removeTimes(id, body.timeIds);
  }

  /**
   * Remover bolão (ADMIN apenas)
   * Apenas bolões sem palpites podem ser removidos
   * @returns Mensagem de confirmação
   */
  @Delete(":id")
  @Roles(TipoUsuario.ADMIN)
  @HttpCode(HttpStatus.OK)
  remove(@Param("id") id: string, @Query("senha") senha?: string) {
    return this.boloesService.remove(id, senha);
  }
}
