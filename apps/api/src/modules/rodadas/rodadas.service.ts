import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateRodadaDto } from "./dto/create-rodada.dto";
import { UpdateRodadaDto } from "./dto/update-rodada.dto";

@Injectable()
export class RodadasService {
  constructor(private prisma: PrismaService) {}

  async create(createRodadaDto: CreateRodadaDto) {
    // Verificar se já existe rodada com mesmo nome (nome é único global)
    const existingRodada = await this.prisma.rodada.findUnique({
      where: { nome: createRodadaDto.nome },
    });

    if (existingRodada) {
      throw new ConflictException(
        `Já existe uma rodada com o nome "${createRodadaDto.nome}"`,
      );
    }

    const rodada = await this.prisma.rodada.create({
      data: createRodadaDto,
    });

    return rodada;
  }

  async findAll(ativo?: boolean) {
    const where: any = {};
    if (ativo !== undefined) {
      where.ativo = ativo;
    }

    const rodadas = await this.prisma.rodada.findMany({
      where,
      orderBy: [{ numeroOrdem: "asc" }, { nome: "asc" }],
      include: {
        _count: {
          select: {
            jogos: true,
          },
        },
      },
    });

    return rodadas.map((rodada) => ({
      ...rodada,
      totalJogos: rodada._count.jogos,
    }));
  }

  async findById(id: string) {
    const rodada = await this.prisma.rodada.findUnique({
      where: { id },
      include: {
        jogos: {
          select: {
            id: true,
            dataHora: true,
            status: true,
            bolao: {
              select: {
                id: true,
                nome: true,
              },
            },
            timeCasa: {
              select: {
                id: true,
                nome: true,
                escudoUrl: true,
              },
            },
            timeFora: {
              select: {
                id: true,
                nome: true,
                escudoUrl: true,
              },
            },
          },
          orderBy: { dataHora: "asc" },
        },
        _count: {
          select: {
            jogos: true,
          },
        },
      },
    });

    if (!rodada) {
      throw new NotFoundException("Rodada não encontrada");
    }

    return {
      ...rodada,
      totalJogos: rodada._count.jogos,
    };
  }

  async update(id: string, updateRodadaDto: UpdateRodadaDto) {
    const rodada = await this.prisma.rodada.findUnique({
      where: { id },
    });

    if (!rodada) {
      throw new NotFoundException("Rodada não encontrada");
    }

    // Verificar duplicidade de nome se estiver sendo alterado
    if (updateRodadaDto.nome && updateRodadaDto.nome !== rodada.nome) {
      const existingRodada = await this.prisma.rodada.findUnique({
        where: { nome: updateRodadaDto.nome },
      });

      if (existingRodada) {
        throw new ConflictException(
          `Já existe uma rodada com o nome "${updateRodadaDto.nome}"`,
        );
      }
    }

    const updatedRodada = await this.prisma.rodada.update({
      where: { id },
      data: updateRodadaDto,
    });

    return updatedRodada;
  }

  async remove(id: string, senha?: string) {
    if (!senha) {
      throw new UnauthorizedException("Senha de confirmação é obrigatória");
    }
    const rodada = await this.prisma.rodada.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            jogos: true,
          },
        },
      },
    });

    if (!rodada) {
      throw new NotFoundException("Rodada não encontrada");
    }

    // Verificar se há jogos cadastrados
    if (rodada._count.jogos > 0) {
      throw new BadRequestException(
        `Não é possível excluir a rodada "${rodada.nome}" pois ela possui ${rodada._count.jogos} jogo(s) cadastrado(s)`,
      );
    }

    await this.prisma.rodada.delete({
      where: { id },
    });

    return { message: `Rodada "${rodada.nome}" removida com sucesso` };
  }

  async count() {
    return this.prisma.rodada.count();
  }

  async search(termo: string) {
    const rodadas = await this.prisma.rodada.findMany({
      where: {
        OR: [
          { nome: { contains: termo, mode: "insensitive" } },
          { descricao: { contains: termo, mode: "insensitive" } },
        ],
      },
      orderBy: [{ numeroOrdem: "asc" }, { nome: "asc" }],
      include: {
        _count: {
          select: {
            jogos: true,
          },
        },
      },
    });

    return rodadas.map((rodada) => ({
      ...rodada,
      totalJogos: rodada._count.jogos,
    }));
  }
}
