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
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    // Verificar se email já existe
    const existingEmail = await this.prisma.usuario.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingEmail) {
      throw new ConflictException("Email já cadastrado");
    }

    // Verificar se usuário já existe
    const existingUsuario = await this.prisma.usuario.findUnique({
      where: { usuario: createUserDto.usuario },
    });

    if (existingUsuario) {
      throw new ConflictException("Usuário já cadastrado");
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(createUserDto.senha, 10);

    const user = await this.prisma.usuario.create({
      data: {
        ...createUserDto,
        senha: hashedPassword,
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

  async findByEmail(email: string) {
    const user = await this.prisma.usuario.findUnique({
      where: { email },
    });

    return user;
  }

  async findByUsuario(usuario: string) {
    const user = await this.prisma.usuario.findUnique({
      where: { usuario },
    });

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.findByIdWithPassword(id);

    if (!user) {
      throw new NotFoundException("Usuário não encontrado");
    }

    // Se está atualizando email, verificar duplicidade
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.findByEmail(updateUserDto.email);
      if (existingUser) {
        throw new ConflictException("Email já cadastrado");
      }
    }

    // Se está atualizando usuário, verificar duplicidade
    if (updateUserDto.usuario && updateUserDto.usuario !== user.usuario) {
      const existingUsuario = await this.findByUsuario(updateUserDto.usuario);
      if (existingUsuario) {
        throw new ConflictException("Usuário já cadastrado");
      }
    }

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
