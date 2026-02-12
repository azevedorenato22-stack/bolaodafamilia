import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateBolaoDto } from "./dto/create-bolao.dto";
import { UpdateBolaoDto } from "./dto/update-bolao.dto";
import { AddTimesBolaoDto } from "./dto/add-times-bolao.dto";
import { Prisma, TipoUsuario } from "@prisma/client";
import { JogosService } from "../jogos/jogos.service";

@Injectable()
export class BoloesService {
  constructor(
    private prisma: PrismaService,
    private jogosService: JogosService,
  ) { }

  private getBolaoInclude(options?: {
    includeParticipantes?: boolean;
  }): Prisma.BolaoInclude {
    const includeParticipantes = Boolean(options?.includeParticipantes);
    return {
      times: {
        include: {
          time: {
            select: {
              id: true,
              nome: true,
              escudoUrl: true,
            },
          },
        },
      },
      rodadas: {
        include: {
          rodada: {
            select: {
              id: true,
              nome: true,
              numeroOrdem: true,
              ativo: true,
            },
          },
        },
      },
      ...(includeParticipantes
        ? {
          participantes: {
            include: {
              usuario: {
                select: {
                  id: true,
                  nome: true,
                  usuario: true,
                  email: true,
                  tipo: true,
                  ativo: true,
                },
              },
            },
          },
        }
        : {}),
      _count: {
        select: {
          jogos: true,
          ...(includeParticipantes ? { participantes: true } : {}),
        },
      },
    };
  }

  private async syncTimes(
    prismaTx: PrismaService | any,
    bolaoId: string,
    timeIds: string[],
  ) {
    const validCount = await prismaTx.time.count({
      where: { id: { in: timeIds } },
    });
    if (validCount !== timeIds.length) {
      throw new BadRequestException("Há time(s) inválido(s) na seleção");
    }

    const current = await prismaTx.bolaoTime.findMany({
      where: { bolaoId },
      select: { timeId: true },
    });
    const currentIds = new Set(
      current.map((c: { timeId: string }) => c.timeId),
    );
    const nextIds = new Set(timeIds);

    const toRemove = current
      .filter((c: { timeId: string }) => !nextIds.has(c.timeId))
      .map((c: { timeId: string }) => c.timeId);
    const toAdd = timeIds.filter((t) => !currentIds.has(t));

    if (toRemove.length) {
      await prismaTx.bolaoTime.deleteMany({
        where: { bolaoId, timeId: { in: toRemove } },
      });
    }

    if (toAdd.length) {
      await prismaTx.bolaoTime.createMany({
        data: toAdd.map((timeId) => ({ bolaoId, timeId })),
        skipDuplicates: true,
      });
    }
  }

  private async syncRodadas(
    prismaTx: PrismaService | any,
    bolaoId: string,
    rodadaIds: string[],
  ) {
    const validCount = await prismaTx.rodada.count({
      where: { id: { in: rodadaIds } },
    });
    if (validCount !== rodadaIds.length) {
      throw new BadRequestException("Há rodada(s) inválida(s) na seleção");
    }

    const current = await prismaTx.bolaoRodada.findMany({
      where: { bolaoId },
      select: { rodadaId: true },
    });
    const currentIds = new Set(
      current.map((c: { rodadaId: string }) => c.rodadaId),
    );
    const nextIds = new Set(rodadaIds);

    const toRemove = current
      .filter((c: { rodadaId: string }) => !nextIds.has(c.rodadaId))
      .map((c: { rodadaId: string }) => c.rodadaId);
    const toAdd = rodadaIds.filter((r) => !currentIds.has(r));

    if (toRemove.length) {
      const jogosComRodada = await prismaTx.jogo.count({
        where: { bolaoId, rodadaId: { in: toRemove } },
      });

      if (jogosComRodada > 0) {
        throw new BadRequestException(
          "Não é possível remover rodadas que possuem jogos cadastrados no bolão",
        );
      }

      await prismaTx.bolaoRodada.deleteMany({
        where: { bolaoId, rodadaId: { in: toRemove } },
      });
    }

    if (toAdd.length) {
      await prismaTx.bolaoRodada.createMany({
        data: toAdd.map((rodadaId) => ({ bolaoId, rodadaId })),
        skipDuplicates: true,
      });
    }
  }

  private async syncParticipantes(
    prismaTx: PrismaService | any,
    bolaoId: string,
    usuarioIds: string[],
  ) {
    const uniqueIds = Array.from(new Set(usuarioIds));
    const validCount = await prismaTx.usuario.count({
      where: {
        id: { in: uniqueIds },
        tipo: TipoUsuario.USUARIO,
        ativo: true,
      },
    });
    if (validCount !== uniqueIds.length) {
      throw new BadRequestException("Há usuário(s) inválido(s) na seleção");
    }

    const current = await prismaTx.bolaoUsuario.findMany({
      where: { bolaoId },
      select: { usuarioId: true },
    });
    const currentIds = new Set(
      current.map((c: { usuarioId: string }) => c.usuarioId),
    );
    const nextIds = new Set(uniqueIds);

    const toRemove = current
      .filter((c: { usuarioId: string }) => !nextIds.has(c.usuarioId))
      .map((c: { usuarioId: string }) => c.usuarioId);
    const toAdd = uniqueIds.filter((u) => !currentIds.has(u));

    if (toRemove.length) {
      await prismaTx.bolaoUsuario.deleteMany({
        where: { bolaoId, usuarioId: { in: toRemove } },
      });
    }

    if (toAdd.length) {
      await prismaTx.bolaoUsuario.createMany({
        data: toAdd.map((usuarioId) => ({ bolaoId, usuarioId })),
        skipDuplicates: true,
      });
    }
  }

  private mapBolaoResponse(bolao: any) {
    return {
      ...bolao,
      times: bolao.times?.map((bt: any) => bt.time) || [],
      rodadas: bolao.rodadas?.map((br: any) => br.rodada) || [],
      participantes: bolao.participantes?.map((bu: any) => bu.usuario) || [],
    };
  }

  async create(createBolaoDto: CreateBolaoDto) {
    const { timeIds, rodadaIds, usuarioIds, ...bolaoData } = createBolaoDto;

    // Validar data final (considerar fim do dia para evitar bloqueio por timezone)
    let dataFinal: Date | null = null;
    if (createBolaoDto.dataFim) {
      dataFinal = new Date(createBolaoDto.dataFim);
      if (Number.isNaN(dataFinal.getTime())) {
        throw new BadRequestException("Data final inválida");
      }
      dataFinal.setHours(23, 59, 59, 999);
    }

    // Verificar se já existe bolão com mesmo nome
    const existingBolao = await this.prisma.bolao.findUnique({
      where: { nome: createBolaoDto.nome },
    });

    if (existingBolao) {
      throw new ConflictException("Já existe um bolão com este nome");
    }

    // Criar bolão com valores padrão de pontuação
    const bolao = await this.prisma.bolao.create({
      data: {
        nome: bolaoData.nome,
        descricao: bolaoData.descricao,
        dataFinal,
        ativo: bolaoData.ativo ?? true,
        ptsResultadoExato: bolaoData.pts_resultado_exato ?? 25,
        ptsVencedorGols: bolaoData.pts_vencedor_gols ?? 18,
        ptsDiferencaGols: bolaoData.pts_diferenca_gols ?? 15,
        ptsEmpateExato: bolaoData.pts_empate_exato ?? 25,
        ptsEmpate: bolaoData.pts_empate ?? 15,
        ptsVencedor: bolaoData.pts_vencedor ?? 10,
        ptsPlacarPerdedor: bolaoData.pts_placar_perdedor ?? 12,
        ptsCampeao: bolaoData.pts_campeao ?? 20,
        ptsPenaltis: bolaoData.pts_penaltis ?? 1,
      },
      include: this.getBolaoInclude({ includeParticipantes: true }),
    });

    const hasRelations =
      (timeIds && timeIds.length > 0) ||
      (rodadaIds && rodadaIds.length > 0) ||
      (usuarioIds && usuarioIds.length > 0);

    if (hasRelations) {
      await this.prisma.$transaction(async (prismaTx) => {
        if (timeIds && timeIds.length > 0) {
          await this.syncTimes(prismaTx, bolao.id, timeIds);
        }
        if (rodadaIds && rodadaIds.length > 0) {
          await this.syncRodadas(prismaTx, bolao.id, rodadaIds);
        }
        if (usuarioIds && usuarioIds.length > 0) {
          await this.syncParticipantes(prismaTx, bolao.id, usuarioIds);
        }
      });
      return this.findByIdAdmin(bolao.id);
    }

    return this.mapBolaoResponse(bolao);
  }

  async findAll() {
    const boloes = await this.prisma.bolao.findMany({
      orderBy: { createdAt: "desc" },
      include: this.getBolaoInclude({ includeParticipantes: true }),
    });

    return boloes.map((bolao) => ({
      ...this.mapBolaoResponse(bolao),
      totalJogos: bolao._count?.jogos ?? 0,
    }));
  }

  async findAllActive() {
    const boloes = await this.prisma.bolao.findMany({
      where: { ativo: true },
      orderBy: { createdAt: "desc" },
      include: this.getBolaoInclude(),
    });

    return boloes.map((bolao) => ({
      ...this.mapBolaoResponse(bolao),
      totalJogos: bolao._count?.jogos ?? 0,
    }));
  }

  async findById(id: string) {
    const bolao = await this.prisma.bolao.findUnique({
      where: { id },
      include: this.getBolaoInclude(),
    });

    if (!bolao) {
      throw new NotFoundException("Bolão não encontrado");
    }

    return {
      ...this.mapBolaoResponse(bolao),
      totalJogos: bolao._count?.jogos ?? 0,
    };
  }

  async findByIdAdmin(id: string) {
    const bolao = await this.prisma.bolao.findUnique({
      where: { id },
      include: this.getBolaoInclude({ includeParticipantes: true }),
    });

    if (!bolao) {
      throw new NotFoundException("Bolão não encontrado");
    }

    return {
      ...this.mapBolaoResponse(bolao),
      totalJogos: bolao._count?.jogos ?? 0,
      totalParticipantes: bolao._count?.participantes ?? 0,
    };
  }

  async findMine(usuarioId: string) {
    const boloes = await this.prisma.bolao.findMany({
      where: {
        ativo: true,
        participantes: {
          some: { usuarioId },
        },
      },
      orderBy: { createdAt: "desc" },
      include: this.getBolaoInclude(),
    });

    return boloes.map((bolao) => ({
      ...this.mapBolaoResponse(bolao),
      totalJogos: bolao._count?.jogos ?? 0,
    }));
  }

  async findDisponiveis(usuarioId: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { id: true, tipo: true, ativo: true },
    });

    if (!usuario || !usuario.ativo || usuario.tipo !== TipoUsuario.USUARIO) {
      throw new UnauthorizedException("Usuário inválido");
    }

    const boloes = await this.prisma.bolao.findMany({
      where: {
        ativo: true,
        participantes: {
          none: { usuarioId },
        },
      },
      orderBy: { createdAt: "desc" },
      include: this.getBolaoInclude(),
    });

    return boloes.map((bolao) => ({
      ...this.mapBolaoResponse(bolao),
      totalJogos: bolao._count?.jogos ?? 0,
    }));
  }

  async entrarNoBolao(bolaoId: string, usuarioId: string) {
    const [usuario, bolao] = await Promise.all([
      this.prisma.usuario.findUnique({
        where: { id: usuarioId },
        select: { id: true, tipo: true, ativo: true },
      }),
      this.prisma.bolao.findUnique({
        where: { id: bolaoId },
        select: { id: true, ativo: true },
      }),
    ]);

    if (!usuario || !usuario.ativo || usuario.tipo !== TipoUsuario.USUARIO) {
      throw new UnauthorizedException("Usuário inválido");
    }

    if (!bolao) {
      throw new NotFoundException("Bolão não encontrado");
    }
    if (!bolao.ativo) {
      throw new BadRequestException("Bolão não está ativo");
    }

    await this.prisma.bolaoUsuario.createMany({
      data: [{ bolaoId, usuarioId }],
      skipDuplicates: true,
    });

    const vinculo = await this.prisma.bolaoUsuario.findFirst({
      where: { bolaoId, usuarioId },
      select: { bolaoId: true, usuarioId: true, createdAt: true },
    });

    return vinculo ?? { bolaoId, usuarioId };
  }

  async sairDoBolao(bolaoId: string, usuarioId: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { id: true, tipo: true, ativo: true },
    });

    if (!usuario || !usuario.ativo || usuario.tipo !== TipoUsuario.USUARIO) {
      throw new UnauthorizedException("Usuário inválido");
    }

    const result = await this.prisma.bolaoUsuario.deleteMany({
      where: { bolaoId, usuarioId },
    });

    return {
      removed: result.count,
      message: result.count
        ? "Você saiu do bolão"
        : "Você não participa deste bolão",
    };
  }

  async update(id: string, updateBolaoDto: UpdateBolaoDto) {
    const bolao = await this.prisma.bolao.findUnique({
      where: { id },
    });

    if (!bolao) {
      throw new NotFoundException("Bolão não encontrado");
    }

    // Validar data final se fornecida
    if (updateBolaoDto.dataFim) {
      const dataFinal = new Date(updateBolaoDto.dataFim);
      if (Number.isNaN(dataFinal.getTime())) {
        throw new BadRequestException("Data final inválida");
      }
      dataFinal.setHours(23, 59, 59, 999);
    }

    // Verificar nome duplicado se estiver sendo alterado
    if (updateBolaoDto.nome && updateBolaoDto.nome !== bolao.nome) {
      const existingBolao = await this.prisma.bolao.findUnique({
        where: { nome: updateBolaoDto.nome },
      });

      if (existingBolao) {
        throw new ConflictException("Já existe um bolão com este nome");
      }
    }

    const updatedBolao = await this.prisma.$transaction(async (prismaTx) => {
      if (updateBolaoDto.timeIds) {
        await this.syncTimes(prismaTx, id, updateBolaoDto.timeIds);
      }

      if (updateBolaoDto.rodadaIds) {
        await this.syncRodadas(prismaTx, id, updateBolaoDto.rodadaIds);
      }

      if (updateBolaoDto.usuarioIds !== undefined) {
        await this.syncParticipantes(prismaTx, id, updateBolaoDto.usuarioIds);
      }

      return prismaTx.bolao.update({
        where: { id },
        data: {
          nome: updateBolaoDto.nome,
          descricao: updateBolaoDto.descricao,
          dataFinal: updateBolaoDto.dataFim
            ? (() => {
              const df = new Date(updateBolaoDto.dataFim as string);
              df.setHours(23, 59, 59, 999);
              return df;
            })()
            : undefined,
          ativo: updateBolaoDto.ativo,
          ptsResultadoExato: updateBolaoDto.pts_resultado_exato,
          ptsVencedorGols: updateBolaoDto.pts_vencedor_gols,
          ptsDiferencaGols: updateBolaoDto.pts_diferenca_gols,
          ptsEmpateExato: updateBolaoDto.pts_empate_exato,
          ptsEmpate: updateBolaoDto.pts_empate,
          ptsVencedor: updateBolaoDto.pts_vencedor,
          ptsPlacarPerdedor: updateBolaoDto.pts_placar_perdedor,
          ptsCampeao: updateBolaoDto.pts_campeao,
          ptsPenaltis: updateBolaoDto.pts_penaltis,
        },
        include: this.getBolaoInclude({ includeParticipantes: true }),
      });
    });

    // Se houve mudança em pontuação, recalcula todos os jogos encerrados desse bolão
    const pontuacaoMudou =
      updateBolaoDto.pts_resultado_exato !== undefined ||
      updateBolaoDto.pts_vencedor_gols !== undefined ||
      updateBolaoDto.pts_diferenca_gols !== undefined ||
      updateBolaoDto.pts_empate_exato !== undefined ||
      updateBolaoDto.pts_empate !== undefined ||
      updateBolaoDto.pts_vencedor !== undefined ||
      updateBolaoDto.pts_placar_perdedor !== undefined ||
      updateBolaoDto.pts_campeao !== undefined ||
      updateBolaoDto.pts_penaltis !== undefined;

    if (pontuacaoMudou) {
      const jogosEncerrados = await this.prisma.jogo.findMany({
        where: { bolaoId: id, status: "ENCERRADO" },
        select: { id: true },
      });

      // Recalcula em paralelo (Promise.all)
      await Promise.all(
        jogosEncerrados.map(jogo => this.jogosService.recalcularPontuacao(jogo.id))
      );
    }

    return this.mapBolaoResponse(updatedBolao);
  }

  async remove(id: string, senha?: string) {
    if (!senha) {
      throw new UnauthorizedException("Senha de confirmação é obrigatória");
    }

    const bolao = await this.prisma.bolao.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            jogos: true,
          },
        },
      },
    });

    if (!bolao) {
      throw new NotFoundException("Bolão não encontrado");
    }

    // Verificar se tem jogos (impedir exclusão)
    if (bolao._count.jogos > 0) {
      throw new BadRequestException(
        "Não é possível excluir bolão com jogos cadastrados. Desative o bolão ao invés de excluí-lo.",
      );
    }

    await this.prisma.bolao.delete({
      where: { id },
    });

    return { message: "Bolão removido com sucesso" };
  }

  async toggleActive(id: string) {
    const bolao = await this.prisma.bolao.findUnique({
      where: { id },
    });

    if (!bolao) {
      throw new NotFoundException("Bolão não encontrado");
    }

    const updatedBolao = await this.prisma.bolao.update({
      where: { id },
      data: { ativo: !bolao.ativo },
      include: this.getBolaoInclude(),
    });

    return this.mapBolaoResponse(updatedBolao);
  }

  async addTimes(id: string, addTimesDto: AddTimesBolaoDto) {
    const bolao = await this.prisma.bolao.findUnique({
      where: { id },
    });

    if (!bolao) {
      throw new NotFoundException("Bolão não encontrado");
    }

    // Verificar se todos os times existem
    const times = await this.prisma.time.findMany({
      where: {
        id: { in: addTimesDto.timeIds },
      },
    });

    if (times.length !== addTimesDto.timeIds.length) {
      throw new BadRequestException("Um ou mais times não foram encontrados");
    }

    // Verificar quais times já estão associados
    const existingAssociations = await this.prisma.bolaoTime.findMany({
      where: {
        bolaoId: id,
        timeId: { in: addTimesDto.timeIds },
      },
    });

    const existingTimeIds = existingAssociations.map((a) => a.timeId);
    const newTimeIds = addTimesDto.timeIds.filter(
      (timeId) => !existingTimeIds.includes(timeId),
    );

    // Adicionar apenas novos times
    if (newTimeIds.length > 0) {
      await this.prisma.bolaoTime.createMany({
        data: newTimeIds.map((timeId) => ({
          bolaoId: id,
          timeId,
        })),
      });
    }

    return this.findById(id);
  }

  async removeTimes(id: string, timeIds: string[]) {
    const bolao = await this.prisma.bolao.findUnique({
      where: { id },
    });

    if (!bolao) {
      throw new NotFoundException("Bolão não encontrado");
    }

    // Verificar se há jogos usando esses times
    const jogos = await this.prisma.jogo.findMany({
      where: {
        bolaoId: id,
        OR: [{ timeCasaId: { in: timeIds } }, { timeForaId: { in: timeIds } }],
      },
    });

    if (jogos.length > 0) {
      throw new BadRequestException(
        "Não é possível remover times que possuem jogos cadastrados no bolão",
      );
    }

    await this.prisma.bolaoTime.deleteMany({
      where: {
        bolaoId: id,
        timeId: { in: timeIds },
      },
    });

    return this.findById(id);
  }

  async getConfiguracao(id: string) {
    const bolao = await this.prisma.bolao.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        ptsResultadoExato: true,
        ptsVencedorGols: true,
        ptsDiferencaGols: true,
        ptsEmpateExato: true,
        ptsEmpate: true,
        ptsVencedor: true,
        ptsPlacarPerdedor: true,
        ptsCampeao: true,
        ptsPenaltis: true,
      },
    });

    if (!bolao) {
      throw new NotFoundException("Bolão não encontrado");
    }

    return {
      id: bolao.id,
      nome: bolao.nome,
      pts_resultado_exato: bolao.ptsResultadoExato,
      pts_vencedor_gols: bolao.ptsVencedorGols,
      pts_diferenca_gols: bolao.ptsDiferencaGols,
      pts_empate_exato: bolao.ptsEmpateExato,
      pts_empate: bolao.ptsEmpate,
      pts_vencedor: bolao.ptsVencedor,
      pts_placar_perdedor: bolao.ptsPlacarPerdedor,
      pts_campeao: bolao.ptsCampeao,
      pts_penaltis: bolao.ptsPenaltis,
    };
  }
}
