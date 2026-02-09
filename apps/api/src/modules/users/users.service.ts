import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import * as bcrypt from "bcrypt";
import { TipoUsuario } from "@prisma/client";

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) { }

  async create(createUserDto: CreateUserDto) {
    // Verificar se nome já existe (como login será por nome, precisa ser único)
    const existingUser = await this.prisma.usuario.findFirst({
      where: { nome: { equals: createUserDto.nome, mode: 'insensitive' } },
    });

    if (existingUser) {
      throw new ConflictException("Nome de usuário já cadastrado. Por favor, escolha outro.");
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(createUserDto.senha, 10);

    const user = await this.prisma.usuario.create({
      data: {
        nome: createUserDto.nome,
        senha: hashedPassword,
        usuario: createUserDto.usuario || null as any,
        email: createUserDto.email || null as any,
        tipo: createUserDto.tipo ?? TipoUsuario.USUARIO,
        ativo: createUserDto.ativo ?? true,
      },
    });

    // Retornar sem a senha
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { senha, ...result } = user;
    return result;
  }

  async findAll() {
    const users = await this.prisma.usuario.findMany({
      orderBy: { nome: "asc" },
      select: {
        id: true,
        nome: true,
        usuario: true,
        email: true,
        tipo: true,
        ativo: true,
        createdAt: true,
      },
    });

    return users;
  }

  async findById(id: string) {
    const user = await this.prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        usuario: true,
        email: true,
        tipo: true,
        ativo: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException("Usuário não encontrado");
    }

    return user;
  }

  /**
   * Buscar usuário por ID incluindo senha (uso interno apenas)
   */
  async findByIdWithPassword(id: string) {
    const user = await this.prisma.usuario.findUnique({
      where: { id },
    });

    return user;
  }

  async findByNome(nome: string) {
    // Busca insensível a maiúsculas/minúsculas
    const user = await this.prisma.usuario.findFirst({
      where: { nome: { equals: nome, mode: "insensitive" } },
    });

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.findByIdWithPassword(id);

    if (!user) {
      throw new NotFoundException("Usuário não encontrado");
    }

    // Verificações de email e usuário removidas pois são campos opcionais agora
    // e não usados para login principal. Se necessário, adicionar verificação única via Prisma.

    // Se está atualizando senha, fazer hash
    if (updateUserDto.senha) {
      updateUserDto.senha = await bcrypt.hash(updateUserDto.senha, 10);
    }

    const updatedUser = await this.prisma.usuario.update({
      where: { id },
      data: updateUserDto,
      select: {
        id: true,
        nome: true,
        usuario: true,
        email: true,
        tipo: true,
        ativo: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  async remove(id: string) {
    const user = await this.findByIdWithPassword(id);

    if (!user) {
      throw new NotFoundException("Usuário não encontrado");
    }

    // Prevenir exclusão do último admin
    if (user.tipo === TipoUsuario.ADMIN) {
      const adminCount = await this.prisma.usuario.count({
        where: { tipo: TipoUsuario.ADMIN, ativo: true },
      });

      if (adminCount <= 1) {
        throw new BadRequestException(
          "Não é possível remover o último administrador ativo do sistema",
        );
      }
    }

    await this.prisma.usuario.delete({
      where: { id },
    });

    return { message: "Usuário removido com sucesso" };
  }

  async toggleActive(id: string) {
    const user = await this.findByIdWithPassword(id);

    if (!user) {
      throw new NotFoundException("Usuário não encontrado");
    }

    // Prevenir desativação do último admin
    if (user.tipo === TipoUsuario.ADMIN && user.ativo) {
      const adminCount = await this.prisma.usuario.count({
        where: { tipo: TipoUsuario.ADMIN, ativo: true },
      });

      if (adminCount <= 1) {
        throw new BadRequestException(
          "Não é possível desativar o último administrador ativo do sistema",
        );
      }
    }

    const updatedUser = await this.prisma.usuario.update({
      where: { id },
      data: { ativo: !user.ativo },
      select: {
        id: true,
        nome: true,
        usuario: true,
        email: true,
        tipo: true,
        ativo: true,
      },
    });

    return updatedUser;
  }

  /**
   * Contar total de usuários
   */
  async count() {
    return this.prisma.usuario.count();
  }

  /**
   * Contar usuários por tipo
   */
  async countByTipo(tipo: TipoUsuario) {
    return this.prisma.usuario.count({
      where: { tipo },
    });
  }

  /**
   * Listar apenas usuários ativos
   */
  async findAllActive() {
    const users = await this.prisma.usuario.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
      select: {
        id: true,
        nome: true,
        usuario: true,
        email: true,
        tipo: true,
        ativo: true,
        createdAt: true,
      },
    });

    return users;
  }
}
