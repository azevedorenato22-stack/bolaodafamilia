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
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { TipoUsuario } from "@prisma/client";

/**
 * Controller para gerenciamento de usuários
 * Todos os endpoints requerem autenticação e role ADMIN
 */
@Controller("admin/usuarios")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(TipoUsuario.ADMIN)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Criar novo usuário
   * @returns Dados do usuário criado (sem senha)
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  /**
   * Listar todos os usuários (ordenado alfabeticamente)
   * @returns Lista de usuários sem senha
   */
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  /**
   * Buscar usuário por ID
   * @returns Dados do usuário (sem senha)
   */
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.usersService.findById(id);
  }

  /**
   * Atualizar usuário
   * Senha é hasheada automaticamente se fornecida
   * @returns Dados atualizados (sem senha)
   */
  @Patch(":id")
  update(@Param("id") id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  /**
   * Remover usuário (hard delete)
   * @returns Mensagem de confirmação
   */
  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  remove(@Param("id") id: string) {
    return this.usersService.remove(id);
  }

  /**
   * Alternar status ativo/inativo do usuário (soft delete)
   * @returns Dados atualizados com novo status
   */
  @Patch(":id/toggle-active")
  toggleActive(@Param("id") id: string) {
    return this.usersService.toggleActive(id);
  }
}
