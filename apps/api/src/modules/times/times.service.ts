import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateTimeDto } from "./dto/create-time.dto";
import { UpdateTimeDto } from "./dto/update-time.dto";

@Injectable()
export class TimesService {
  constructor(private prisma: PrismaService) { }

  async create(createTimeDto: CreateTimeDto) {
    // Verificar se já existe time com mesmo nome e categoria
    const existingTime = await this.prisma.time.findFirst({
      where: {
        nome: createTimeDto.nome,
        categoria: createTimeDto.categoria,
      },
    });

    if (existingTime) {
      throw new ConflictException(
        `Já existe um time com o nome "${createTimeDto.nome}" na categoria "${createTimeDto.categoria}"`,
      );
    }

    const time = await this.prisma.time.create({
      data: createTimeDto,
    });

    return time;
  }

  async findAll(categoria?: string, ativo?: boolean) {
    const where: any = {};
    if (categoria) where.categoria = categoria;
    if (ativo !== undefined) where.ativo = ativo;

    const times = await this.prisma.time.findMany({
      where,
      orderBy: { nome: "asc" },
      include: {
        _count: {
          select: {
            boloes: true,
            jogosCasa: true,
            jogosFora: true,
          },
        },
      },
    });

    return times.map((time) => ({
      ...time,
      totalBoloes: time._count.boloes,
      totalJogos: time._count.jogosCasa + time._count.jogosFora,
    }));
  }

  async findById(id: string) {
    const time = await this.prisma.time.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            boloes: true,
            jogosCasa: true,
            jogosFora: true,
          },
        },
      },
    });

    if (!time) {
      throw new NotFoundException("Time não encontrado");
    }

    return {
      ...time,
      totalBoloes: time._count.boloes,
      totalJogos: time._count.jogosCasa + time._count.jogosFora,
    };
  }

  async findByCategorias() {
    const times = await this.prisma.time.findMany({
      orderBy: [{ categoria: "asc" }, { nome: "asc" }],
    });

    // Agrupar times por categoria
    const timesPorCategoria = times.reduce(
      (acc, time) => {
        if (!acc[time.categoria]) {
          acc[time.categoria] = [];
        }
        acc[time.categoria].push(time);
        return acc;
      },
      {} as Record<string, typeof times>,
    );

    return timesPorCategoria;
  }

  async getCategorias() {
    const categorias = await this.prisma.time.findMany({
      select: {
        categoria: true,
      },
      distinct: ["categoria"],
      orderBy: {
        categoria: "asc",
      },
    });

    return categorias.map((c) => c.categoria);
  }

  async update(id: string, updateTimeDto: UpdateTimeDto) {
    const time = await this.prisma.time.findUnique({
      where: { id },
    });

    if (!time) {
      throw new NotFoundException("Time não encontrado");
    }

    // Verificar duplicidade se nome ou categoria foram alterados
    if (updateTimeDto.nome || updateTimeDto.categoria) {
      const nome = updateTimeDto.nome || time.nome;
      const categoria = updateTimeDto.categoria || time.categoria;

      // Se mudou nome ou categoria, verificar se não existe outro time com essa combinação
      if (nome !== time.nome || categoria !== time.categoria) {
        const existingTime = await this.prisma.time.findFirst({
          where: {
            nome,
            categoria,
            NOT: { id },
          },
        });

        if (existingTime) {
          throw new ConflictException(
            `Já existe um time com o nome "${nome}" na categoria "${categoria}"`,
          );
        }
      }
    }

    const updatedTime = await this.prisma.time.update({
      where: { id },
      data: updateTimeDto,
    });

    return updatedTime;
  }

  async remove(id: string, senha?: string) {
    if (!senha) {
      throw new UnauthorizedException("Senha de confirmação é obrigatória");
    }
    const time = await this.prisma.time.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            boloes: true,
            jogosCasa: true,
            jogosFora: true,
          },
        },
      },
    });

    if (!time) {
      throw new NotFoundException("Time não encontrado");
    }

    // Verificar se o time está vinculado a algum bolão
    if (time._count.boloes > 0) {
      throw new BadRequestException(
        `Não é possível excluir o time "${time.nome}" pois ele está vinculado a ${time._count.boloes} bolão(ões)`,
      );
    }

    // Verificar se o time tem jogos cadastrados
    const totalJogos = time._count.jogosCasa + time._count.jogosFora;
    if (totalJogos > 0) {
      throw new BadRequestException(
        `Não é possível excluir o time "${time.nome}" pois ele possui ${totalJogos} jogo(s) cadastrado(s)`,
      );
    }

    await this.prisma.time.delete({
      where: { id },
    });

    return { message: `Time "${time.nome}" removido com sucesso` };
  }

  async count(categoria?: string) {
    return this.prisma.time.count({
      where: categoria ? { categoria } : undefined,
    });
  }

  async search(termo: string) {
    const times = await this.prisma.time.findMany({
      where: {
        OR: [
          { nome: { contains: termo, mode: "insensitive" } },
          { sigla: { contains: termo, mode: "insensitive" } },
          { categoria: { contains: termo, mode: "insensitive" } },
        ],
      },
      orderBy: { nome: "asc" },
    });

    return times;
  }
}
