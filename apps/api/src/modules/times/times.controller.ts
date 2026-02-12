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
import { TimesService } from "./times.service";
import { CreateTimeDto } from "./dto/create-time.dto";
import { UpdateTimeDto } from "./dto/update-time.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { Public } from "../auth/decorators/public.decorator";
import { TipoUsuario } from "@prisma/client";

/**
 * Controller para gerenciamento de times
 * Cadastro único global reutilizável em múltiplos bolões
 * Endpoints públicos: listar, buscar, categorias
 * Endpoints admin: CRUD completo
 */
@Controller("times")
@UseGuards(JwtAuthGuard, RolesGuard)
export class TimesController {
  constructor(private readonly timesService: TimesService) { }

  /**
   * Criar novo time (ADMIN apenas)
   * @returns Dados do time criado
   */
  @Post()
  @Roles(TipoUsuario.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createTimeDto: CreateTimeDto) {
    return this.timesService.create(createTimeDto);
  }

  /**
   * Listar todos os times com ordenação alfabética (PÚBLICO)
   * @query categoria - Filtrar por categoria específica
   * @returns Lista de times ordenada por nome
   */
  @Get()
  @Public()
  findAll(@Query("categoria") categoria?: string, @Query("ativo") ativo?: string) {
    const ativoBool = ativo === undefined ? undefined : ativo === "true";
    return this.timesService.findAll(categoria, ativoBool);
  }

  /**
   * Buscar times agrupados por categoria (PÚBLICO)
   * @returns Times organizados por categoria
   */
  @Get("por-categoria")
  @Public()
  findByCategorias() {
    return this.timesService.findByCategorias();
  }

  /**
   * Listar categorias disponíveis (PÚBLICO)
   * @returns Lista de categorias únicas
   */
  @Get("categorias")
  @Public()
  getCategorias() {
    return this.timesService.getCategorias();
  }

  /**
   * Buscar times por termo (PÚBLICO)
   * @query termo - Termo de busca (nome, sigla ou categoria)
   * @returns Times que correspondem ao termo
   */
  @Get("buscar")
  @Public()
  search(@Query("termo") termo: string) {
    return this.timesService.search(termo);
  }

  /**
   * Contar times (PÚBLICO)
   * @query categoria - Filtrar contagem por categoria
   * @returns Total de times
   */
  @Get("count")
  @Public()
  count(@Query("categoria") categoria?: string) {
    return this.timesService.count(categoria);
  }

  /**
   * Buscar time por ID (PÚBLICO)
   * @returns Dados completos do time
   */
  @Get(":id")
  @Public()
  findOne(@Param("id") id: string) {
    return this.timesService.findById(id);
  }

  /**
   * Atualizar time (ADMIN apenas)
   * @returns Dados atualizados do time
   */
  @Patch(":id")
  @Roles(TipoUsuario.ADMIN)
  update(@Param("id") id: string, @Body() updateTimeDto: UpdateTimeDto) {
    return this.timesService.update(id, updateTimeDto);
  }

  /**
   * Remover time (ADMIN apenas)
   * Bloqueado se time estiver vinculado a bolões ou jogos
   * @returns Mensagem de confirmação
   */
  @Delete(":id")
  @Roles(TipoUsuario.ADMIN)
  @HttpCode(HttpStatus.OK)
  remove(@Param("id") id: string, @Query("senha") senha?: string) {
    return this.timesService.remove(id, senha);
  }

  /**
   * Remover categoria (ADMIN apenas)
   * @returns Mensagem de confirmação
   */
  @Delete("categorias/:nome")
  @Roles(TipoUsuario.ADMIN)
  @HttpCode(HttpStatus.OK)
  removeCategoria(@Param("nome") nome: string) {
    return this.timesService.removeCategoria(nome);
  }
}
