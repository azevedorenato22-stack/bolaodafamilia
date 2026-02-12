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
import { RodadasService } from "./rodadas.service";
import { CreateRodadaDto } from "./dto/create-rodada.dto";
import { UpdateRodadaDto } from "./dto/update-rodada.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { Public } from "../auth/decorators/public.decorator";
import { TipoUsuario } from "@prisma/client";

/**
 * Controller para gerenciamento de rodadas
 * Rodadas são agrupamentos globais de jogos (ex: "Rodada 1", "Quartas de Final")
 * Nome único global - reutilizável em múltiplos bolões
 * Endpoints públicos: listar, buscar
 * Endpoints admin: CRUD completo
 */
@Controller("rodadas")
@UseGuards(JwtAuthGuard, RolesGuard)
export class RodadasController {
  constructor(private readonly rodadasService: RodadasService) { }

  /**
   * Criar nova rodada (ADMIN apenas)
   * Nome deve ser único no sistema
   * @returns Dados da rodada criada
   */
  @Post()
  @Roles(TipoUsuario.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createRodadaDto: CreateRodadaDto) {
    return this.rodadasService.create(createRodadaDto);
  }

  /**
   * Listar todas as rodadas (PÚBLICO)
   * @returns Lista de rodadas ordenadas por número de ordem e nome
   */
  @Get()
  @Public()

  findAll(
    @Query("ativo") ativo?: string,
    @Query("bolaoId") bolaoId?: string,
  ) {
    const ativoBool = ativo === undefined ? undefined : ativo === "true";
    return this.rodadasService.findAll(ativoBool, bolaoId);
  }

  /**
   * Buscar rodadas por termo (PÚBLICO)
   * @query termo - Termo de busca (nome ou descrição)
   * @returns Rodadas que correspondem ao termo
   */
  @Get("buscar")
  @Public()
  search(@Query("termo") termo: string) {
    return this.rodadasService.search(termo);
  }

  /**
   * Contar rodadas (PÚBLICO)
   * @returns Total de rodadas cadastradas
   */
  @Get("count")
  @Public()
  count() {
    return this.rodadasService.count();
  }

  /**
   * Buscar rodada por ID (PÚBLICO)
   * @returns Dados completos da rodada com jogos associados
   */
  @Get(":id")
  @Public()
  findOne(@Param("id") id: string) {
    return this.rodadasService.findById(id);
  }

  /**
   * Atualizar rodada (ADMIN apenas)
   * @returns Dados atualizados da rodada
   */
  @Patch(":id")
  @Roles(TipoUsuario.ADMIN)
  update(@Param("id") id: string, @Body() updateRodadaDto: UpdateRodadaDto) {
    return this.rodadasService.update(id, updateRodadaDto);
  }

  /**
   * Remover rodada (ADMIN apenas)
   * Bloqueado se houver jogos cadastrados
   * @returns Mensagem de confirmação
   */
  @Delete(":id")
  @Roles(TipoUsuario.ADMIN)
  @HttpCode(HttpStatus.OK)
  remove(@Param("id") id: string, @Query("senha") senha?: string) {
    return this.rodadasService.remove(id, senha);
  }
}
