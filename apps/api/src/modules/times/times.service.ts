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
    let rawCats: string[] = [];

    if (createTimeDto.categorias && createTimeDto.categorias.length > 0) {
      rawCats = createTimeDto.categorias;
    } else if (createTimeDto.categoria) {
      rawCats = [createTimeDto.categoria];
    }

    // Split por vírgula e trim em cada item, removendo vazios e duplicados
    const categoriasList = Array.from(new Set(
      rawCats
        .flatMap(c => c.split(','))
        .map(c => c.trim())
        .filter(c => !!c)
    ));

    // Garantir que categorias existem
    if (categoriasList.length === 0) {
      throw new BadRequestException("Categoria é obrigatória");
    }

    await Promise.all(
      categoriasList.map(async (nomeCat) => {
        const cat = await this.prisma.categoria.findUnique({ where: { nome: nomeCat } });
        if (!cat) {
          await this.prisma.categoria.create({ data: { nome: nomeCat } });
        }
      })
    );

    // Verificar duplicidade de nome (se for único globalmente) se necessário
    // Aqui assumimos que o banco cuidará da constraint unique([nome]) se houver.

    // Criar time
    const time = await this.prisma.time.create({
      data: {
        nome: createTimeDto.nome,
        categoria: categoriasList[0], // Campo legado obrigatório
        sigla: createTimeDto.sigla,
        escudoUrl: createTimeDto.escudoUrl,
        categorias: {
          create: categoriasList.map(c => ({
            categoria: { connect: { nome: c } }
          }))
        }
      },
      include: {
        categorias: { include: { categoria: true } }
      }
    });

    return time;
  }

  async findAll(categoria?: string, ativo?: boolean) {
    const where: any = {};
    if (categoria) {
      where.categorias = {
        some: {
          categoria: {
            nome: categoria
          }
        }
      };
    }
    if (ativo !== undefined) where.ativo = ativo;

    const times = await this.prisma.time.findMany({
      where,
      orderBy: { nome: "asc" },
      include: {
        categorias: { include: { categoria: true } },
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
      categoria: time.categorias.map(c => c.categoria.nome).join(', ') || time.categoria, // Exibição
      totalBoloes: time._count.boloes,
      totalJogos: time._count.jogosCasa + time._count.jogosFora,
    }));
  }

  async findById(id: string) {
    const time = await this.prisma.time.findUnique({
      where: { id },
      include: {
        categorias: { include: { categoria: true } },
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
      categoriasNome: time.categorias.map(c => c.categoria.nome),
      totalBoloes: time._count.boloes,
      totalJogos: time._count.jogosCasa + time._count.jogosFora,
    };
  }

  async findByCategorias() {
    const times = await this.prisma.time.findMany({
      orderBy: { nome: "asc" },
      include: {
        categorias: {
          include: { categoria: true }
        }
      }
    });

    // Agrupar times por categoria (um time pode estar em várias)
    const timesPorCategoria: Record<string, any[]> = {};

    times.forEach(time => {
      // Se não tiver categorias relacionadas, usa a legada
      if (time.categorias.length === 0) {
        if (!timesPorCategoria[time.categoria]) {
          timesPorCategoria[time.categoria] = [];
        }
        timesPorCategoria[time.categoria].push(time);
      } else {
        // Adiciona nas listas de todas as categorias que participa
        time.categorias.forEach(ct => {
          const nomeCat = ct.categoria.nome;
          if (!timesPorCategoria[nomeCat]) {
            timesPorCategoria[nomeCat] = [];
          }
          timesPorCategoria[nomeCat].push(time);
        });
      }
    });

    // Ordenar chaves
    const sortedKeys = Object.keys(timesPorCategoria).sort();
    const sortedResult: Record<string, any[]> = {};
    sortedKeys.forEach(k => {
      sortedResult[k] = timesPorCategoria[k];
    });

    return sortedResult;
  }

  async getCategorias() {
    const categorias = await this.prisma.categoria.findMany({
      orderBy: { nome: 'asc' }
    });
    return categorias.map(c => c.nome);
  }

  async update(id: string, updateTimeDto: UpdateTimeDto) {
    const time = await this.prisma.time.findUnique({
      where: { id },
      include: { categorias: { include: { categoria: true } } }
    });

    if (!time) {
      throw new NotFoundException("Time não encontrado");
    }

    let rawCats: string[] | undefined = undefined;
    if (updateTimeDto.categorias && updateTimeDto.categorias.length > 0) {
      rawCats = updateTimeDto.categorias;
    } else if (updateTimeDto.categoria) {
      rawCats = [updateTimeDto.categoria];
    }

    let categoriasList: string[] | undefined = undefined;

    // Se houve atualização de categorias
    if (rawCats) {
      categoriasList = Array.from(new Set(
        rawCats
          .flatMap(c => c.split(','))
          .map(c => c.trim())
          .filter(c => !!c)
      ));
      // Garantir que categorias existem
      await Promise.all(
        categoriasList.map(async (nomeCat) => {
          const cat = await this.prisma.categoria.findUnique({ where: { nome: nomeCat } });
          if (!cat) {
            await this.prisma.categoria.create({ data: { nome: nomeCat } });
          }
        })
      );
    }

    const updatedTime = await this.prisma.time.update({
      where: { id },
      data: {
        nome: updateTimeDto.nome,
        sigla: updateTimeDto.sigla,
        escudoUrl: updateTimeDto.escudoUrl,
        // Atualiza campo legado se categorias mudar
        categoria: categoriasList ? categoriasList[0] : undefined,
        // Atualiza relações
        categorias: categoriasList ? {
          deleteMany: {}, // Remove todas atuais
          create: categoriasList.map(c => ({
            categoria: { connect: { nome: c } }
          }))
        } : undefined
      },
      include: { categorias: { include: { categoria: true } } }
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

  async removeCategoria(nome: string) {
    const cat = await this.prisma.categoria.findUnique({
      where: { nome },
      include: { _count: { select: { times: true } } }
    });

    if (!cat) {
      throw new NotFoundException("Categoria não encontrada");
    }

    if (cat._count.times > 0) {
      throw new BadRequestException(
        `Não é possível excluir a categoria "${nome}" pois ela possui ${cat._count.times} time(s) vinculado(s)`
      );
    }

    await this.prisma.categoria.delete({
      where: { nome },
    });

    return { message: `Categoria "${nome}" removida com sucesso` };
  }
}
