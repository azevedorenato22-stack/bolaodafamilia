import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateJogoDto } from "./dto/create-jogo.dto";
import { UpdateJogoDto } from "./dto/update-jogo.dto";
import { UpdateStatusJogoDto } from "./dto/update-status-jogo.dto";
import { StatusJogo, VencedorPenaltis } from "@prisma/client";
import { calcularPontuacaoPalpite } from "../../lib/pontuacao";

@Injectable()
export class JogosService {
  constructor(private prisma: PrismaService) { }

  private readonly allowedTransitions: Record<StatusJogo, StatusJogo[]> = {
    // Permite encerrar direto sem passar por FECHADO (ex.: placar já conhecido).
    [StatusJogo.PALPITES]: [StatusJogo.FECHADO, StatusJogo.ENCERRADO],
    [StatusJogo.FECHADO]: [StatusJogo.ENCERRADO],
    [StatusJogo.ENCERRADO]: [StatusJogo.PALPITES, StatusJogo.FECHADO],
  };

  private readonly jogoInclude = {
    bolao: { select: { id: true, nome: true } },
    rodada: { select: { id: true, nome: true } },
    timeCasa: { select: { id: true, nome: true, escudoUrl: true } },
    timeFora: { select: { id: true, nome: true, escudoUrl: true } },
  };

  private mapJogo(jogo: any) {
    let status = jogo.status;

    // Virtualmente fecha o jogo se estiver em PALPITES mas já passou do tempo limite (15 min)
    if (status === StatusJogo.PALPITES) {
      const now = new Date();
      const dataHora = new Date(jogo.dataHora);
      const diffMinutes = (dataHora.getTime() - now.getTime()) / 60000;

      // 15 minutos de tolerância antes do jogo. 
      // Apenas fecha visualmente se estiver no intervalo crítico (15 min antes até 4h depois).
      // Isso permite que o Admin reabra jogos muito antigos ou futuros distantes sem ser barrado.
      if (diffMinutes < 15 && diffMinutes > -240) {
        status = StatusJogo.FECHADO;
      }
    }

    return {
      ...jogo,
      status,
    };
  }

  private parseDate(date: string | Date | undefined): Date | undefined {
    if (!date) return undefined;
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException("Data/hora inválida");
    }
    return parsed;
  }

  private buildDayRange(date: string) {
    const inicio = this.parseDate(`${date}T00:00:00`);
    const fim = this.parseDate(`${date}T23:59:59.999`);

    return {
      gte: inicio as Date,
      lte: fim as Date,
    };
  }

  private getTodayInputDate() {
    const now = new Date();
    const offsetMs = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
  }

  private async ensureBolaoAndRodada(bolaoId: string, rodadaId: string) {
    const [bolao, rodada, vinculo] = await Promise.all([
      this.prisma.bolao.findUnique({ where: { id: bolaoId } }),
      this.prisma.rodada.findUnique({ where: { id: rodadaId } }),
      this.prisma.bolaoRodada.findFirst({
        where: { bolaoId, rodadaId },
      }),
    ]);

    if (!bolao) {
      throw new NotFoundException("Bolão não encontrado");
    }

    if (!rodada) {
      throw new NotFoundException("Rodada não encontrada");
    }

    if (!vinculo) {
      throw new ConflictException(
        "Rodada não está vinculada ao bolão selecionado",
      );
    }
  }

  private async ensureTimesBelongToBolao(
    bolaoId: string,
    timeCasaId: string,
    timeForaId: string,
  ) {
    if (timeCasaId === timeForaId) {
      throw new BadRequestException(
        "Time da casa e visitante não podem ser iguais",
      );
    }

    const [timeCasa, timeFora] = await Promise.all([
      this.prisma.time.findUnique({ where: { id: timeCasaId } }),
      this.prisma.time.findUnique({ where: { id: timeForaId } }),
    ]);

    if (!timeCasa || !timeFora) {
      throw new NotFoundException("Time(s) não encontrado(s)");
    }

    const countTimes = await this.prisma.bolaoTime.count({
      where: {
        bolaoId,
        timeId: { in: [timeCasaId, timeForaId] },
      },
    });

    if (countTimes < 2) {
      throw new ConflictException(
        "Ambos os times precisam estar vinculados ao bolão para cadastrar o jogo",
      );
    }
  }

  private async ensureNoDuplicateJogo(params: {
    bolaoId: string;
    rodadaId: string;
    timeCasaId: string;
    timeForaId: string;
    dataHora: Date;
    excludeId?: string;
  }) {
    const duplicate = await this.prisma.jogo.findFirst({
      where: {
        bolaoId: params.bolaoId,
        rodadaId: params.rodadaId,
        timeCasaId: params.timeCasaId,
        timeForaId: params.timeForaId,
        dataHora: params.dataHora,
        ...(params.excludeId ? { NOT: { id: params.excludeId } } : {}),
      },
      select: { id: true },
    });

    if (duplicate) {
      throw new ConflictException(
        "Já existe um jogo cadastrado com os mesmos times e data/hora para este bolão/rodada",
      );
    }
  }

  private ensureValidTransition(
    currentStatus: StatusJogo,
    nextStatus: StatusJogo,
  ) {
    if (currentStatus === nextStatus) return;

    const allowed = this.allowedTransitions[currentStatus] ?? [];
    if (!allowed.includes(nextStatus)) {
      throw new BadRequestException(
        `Transição de estado de ${currentStatus} para ${nextStatus} não é permitida`,
      );
    }
  }

  private validateEncerramentoPayload(
    status: StatusJogo,
    {
      resultadoCasa,
      resultadoFora,
      vencedorPenaltis,
      mataMata,
    }: {
      resultadoCasa?: number | null;
      resultadoFora?: number | null;
      vencedorPenaltis?: VencedorPenaltis | null;
      mataMata: boolean;
    },
  ) {
    if (status !== StatusJogo.ENCERRADO) {
      return;
    }

    if (
      resultadoCasa === undefined ||
      resultadoCasa === null ||
      resultadoFora === undefined ||
      resultadoFora === null
    ) {
      throw new BadRequestException(
        "Para encerrar o jogo é necessário informar o resultado de casa e fora",
      );
    }

    if (resultadoCasa < 0 || resultadoFora < 0) {
      throw new BadRequestException("Gols não podem ser negativos");
    }

    if (!mataMata) {
      if (vencedorPenaltis) {
        throw new BadRequestException(
          "Vencedor nos pênaltis só pode ser informado em jogos mata-mata",
        );
      }
      return;
    }

    const empate = resultadoCasa === resultadoFora;

    if (empate) {
      if (!vencedorPenaltis) {
        throw new BadRequestException(
          "Em caso de empate no mata-mata, informe o vencedor nos pênaltis",
        );
      }
    }
  }

  private async getJogoOrThrow(id: string) {
    const jogo = await this.prisma.jogo.findUnique({
      where: { id },
      include: {
        ...this.jogoInclude,
        bolao: true,
      },
    });

    if (!jogo) {
      throw new NotFoundException("Jogo não encontrado");
    }

    return jogo;
  }

  async recalcularPontuacao(jogoId: string) {
    const jogo = await this.prisma.jogo.findUnique({
      where: { id: jogoId },
      include: {
        bolao: true,
        palpites: true,
      },
    });

    if (!jogo || jogo.status !== StatusJogo.ENCERRADO) return;

    if (jogo.resultadoCasa === null || jogo.resultadoFora === null) {
      throw new BadRequestException(
        "Não é possível calcular pontuação sem resultado do jogo",
      );
    }

    await Promise.all(
      jogo.palpites.map(async (palpite) => {
        const resultado = calcularPontuacaoPalpite({
          bolao: {
            ptsResultadoExato: jogo.bolao.ptsResultadoExato,
            ptsVencedorGols: jogo.bolao.ptsVencedorGols,
            ptsVencedor: jogo.bolao.ptsVencedor,
            ptsDiferencaGols: jogo.bolao.ptsDiferencaGols,
            ptsPlacarPerdedor: jogo.bolao.ptsPlacarPerdedor,
            ptsEmpate: jogo.bolao.ptsEmpate,
            ptsEmpateExato: jogo.bolao.ptsEmpateExato,
            ptsPenaltis: jogo.bolao.ptsPenaltis ?? 10,
          },
          jogo: {
            resultadoCasa: jogo.resultadoCasa ?? 0,
            resultadoFora: jogo.resultadoFora ?? 0,
            mataMata: jogo.mataMata,
            vencedorPenaltis: jogo.vencedorPenaltis,
          },
          palpite: {
            golsCasa: palpite.golsCasa,
            golsFora: palpite.golsFora,
            vencedorPenaltis: palpite.vencedorPenaltis,
          },
        });

        await this.prisma.palpite.update({
          where: { id: palpite.id },
          data: {
            pontuacao: resultado.pontos,
            pontosJogo: resultado.pontosJogo,
            pontosPenaltis: resultado.pontosPenaltis,
            tipoPontuacao: resultado.tipo,
            calculadoEm: new Date(),
          },
        });
      }),
    );
  }

  private async resetPontuacaoPalpites(jogoId: string) {
    await this.prisma.palpite.updateMany({
      where: { jogoId },
      data: {
        pontuacao: 0,
        tipoPontuacao: null,
        calculadoEm: null,
      },
    });
  }

  async create(createJogoDto: CreateJogoDto) {
    const {
      bolaoId,
      rodadaId,
      timeCasaId,
      timeForaId,
      dataHora,
      mataMata,
      resultadoCasa,
      resultadoFora,
      vencedorPenaltis,
    } = createJogoDto;

    const targetStatus = createJogoDto.status ?? StatusJogo.PALPITES;
    if (targetStatus !== StatusJogo.PALPITES) {
      this.ensureValidTransition(StatusJogo.PALPITES, targetStatus);
    }

    await this.ensureBolaoAndRodada(bolaoId, rodadaId);
    await this.ensureTimesBelongToBolao(bolaoId, timeCasaId, timeForaId);

    const parsedDate = this.parseDate(dataHora);
    const mataMataFlag = mataMata ?? false;

    await this.ensureNoDuplicateJogo({
      bolaoId,
      rodadaId,
      timeCasaId,
      timeForaId,
      dataHora: parsedDate!,
    });

    // Regra de consistência: só persiste placar/pênaltis se o jogo estiver ENCERRADO.
    const shouldPersistResultado = targetStatus === StatusJogo.ENCERRADO;
    const resultadoCasaFinal = shouldPersistResultado ? resultadoCasa : null;
    const resultadoForaFinal = shouldPersistResultado ? resultadoFora : null;
    const empatePersistido =
      shouldPersistResultado &&
      resultadoCasaFinal !== null &&
      resultadoForaFinal !== null &&
      resultadoCasaFinal === resultadoForaFinal;
    const vencedorPenaltisFinal =
      shouldPersistResultado && mataMataFlag && empatePersistido
        ? vencedorPenaltis
        : null;

    this.validateEncerramentoPayload(targetStatus, {
      resultadoCasa: resultadoCasaFinal,
      resultadoFora: resultadoForaFinal,
      vencedorPenaltis: vencedorPenaltisFinal,
      mataMata: mataMataFlag,
    });

    const jogo = await this.prisma.jogo.create({
      data: {
        bolaoId,
        rodadaId,
        timeCasaId,
        timeForaId,
        dataHora: parsedDate!,
        local: createJogoDto.local,
        mataMata: mataMataFlag,
        status: targetStatus,
        resultadoCasa: resultadoCasaFinal,
        resultadoFora: resultadoForaFinal,
        vencedorPenaltis: vencedorPenaltisFinal,
      },
      include: this.jogoInclude,
    });

    return this.mapJogo(jogo);
  }

  async findAll(filters: {
    bolaoId?: string;
    rodadaId?: string;
    status?: StatusJogo;
    data?: string;
    periodo?: "HOJE" | "FUTURO";
  }) {
    const where: any = {};

    if (filters.bolaoId) {
      where.bolaoId = filters.bolaoId;
    }

    if (filters.rodadaId) {
      where.rodadaId = filters.rodadaId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.periodo === "FUTURO") {
      where.status = { in: [StatusJogo.PALPITES, StatusJogo.FECHADO] };
    } else if (filters.data) {
      where.dataHora = this.buildDayRange(filters.data);
    } else if (filters.periodo === "HOJE") {
      const hoje = this.getTodayInputDate();
      where.dataHora = this.buildDayRange(hoje);
    }

    const jogos = await this.prisma.jogo.findMany({
      where,
      orderBy: { dataHora: "asc" },
      include: this.jogoInclude,
    });

    return jogos.map((jogo) => this.mapJogo(jogo));
  }

  async findById(id: string) {
    const jogo = await this.getJogoOrThrow(id);
    return this.mapJogo(jogo);
  }

  async update(id: string, updateJogoDto: UpdateJogoDto) {
    const existing = await this.prisma.jogo.findUnique({
      where: { id },
      include: this.jogoInclude,
    });

    if (!existing) {
      throw new NotFoundException("Jogo não encontrado");
    }

    const bolaoId = updateJogoDto.bolaoId ?? existing.bolaoId;
    const rodadaId = updateJogoDto.rodadaId ?? existing.rodadaId;
    const timeCasaId = updateJogoDto.timeCasaId ?? existing.timeCasaId;
    const timeForaId = updateJogoDto.timeForaId ?? existing.timeForaId;
    const mataMataFlag = updateJogoDto.mataMata ?? existing.mataMata;

    await this.ensureBolaoAndRodada(bolaoId, rodadaId);
    await this.ensureTimesBelongToBolao(bolaoId, timeCasaId, timeForaId);

    const nextStatus = updateJogoDto.status ?? existing.status;
    this.ensureValidTransition(existing.status, nextStatus);
    const reabrindo =
      existing.status === StatusJogo.ENCERRADO &&
      nextStatus !== StatusJogo.ENCERRADO;

    const resultadoCasaCandidate =
      updateJogoDto.resultadoCasa !== undefined
        ? updateJogoDto.resultadoCasa
        : existing.resultadoCasa;
    const resultadoForaCandidate =
      updateJogoDto.resultadoFora !== undefined
        ? updateJogoDto.resultadoFora
        : existing.resultadoFora;
    const vencedorPenaltisCandidate =
      updateJogoDto.vencedorPenaltis !== undefined
        ? updateJogoDto.vencedorPenaltis
        : existing.vencedorPenaltis;

    // Regra de consistência: jogo fora de ENCERRADO não pode ter placar/pênaltis persistidos.
    const shouldPersistResultado = nextStatus === StatusJogo.ENCERRADO;
    const resultadoCasaFinal = shouldPersistResultado
      ? resultadoCasaCandidate
      : null;
    const resultadoForaFinal = shouldPersistResultado
      ? resultadoForaCandidate
      : null;
    const empatePersistido =
      shouldPersistResultado &&
      resultadoCasaFinal !== null &&
      resultadoForaFinal !== null &&
      resultadoCasaFinal === resultadoForaFinal;
    const vencedorPenaltisFinal =
      mataMataFlag && vencedorPenaltisCandidate
        ? vencedorPenaltisCandidate
        : null;

    this.validateEncerramentoPayload(nextStatus, {
      resultadoCasa: resultadoCasaFinal,
      resultadoFora: resultadoForaFinal,
      vencedorPenaltis: vencedorPenaltisFinal,
      mataMata: mataMataFlag,
    });

    const parsedDate = this.parseDate(
      updateJogoDto.dataHora ?? existing.dataHora,
    );

    const identityChanged =
      bolaoId !== existing.bolaoId ||
      rodadaId !== existing.rodadaId ||
      timeCasaId !== existing.timeCasaId ||
      timeForaId !== existing.timeForaId ||
      parsedDate!.getTime() !== existing.dataHora.getTime();

    if (identityChanged) {
      await this.ensureNoDuplicateJogo({
        bolaoId,
        rodadaId,
        timeCasaId,
        timeForaId,
        dataHora: parsedDate!,
        excludeId: id,
      });
    }

    const jogo = await this.prisma.jogo.update({
      where: { id },
      data: {
        bolaoId,
        rodadaId,
        timeCasaId,
        timeForaId,
        dataHora: parsedDate!,
        local: updateJogoDto.local ?? existing.local,
        mataMata: mataMataFlag,
        resultadoCasa: resultadoCasaFinal,
        resultadoFora: resultadoForaFinal,
        vencedorPenaltis: vencedorPenaltisFinal,
        status: nextStatus,
      },
      include: this.jogoInclude,
    });

    const mapped = this.mapJogo(jogo);
    if (nextStatus === StatusJogo.ENCERRADO) {
      await this.recalcularPontuacao(id);
    } else if (reabrindo) {
      await this.resetPontuacaoPalpites(id);
    }
    return mapped;
  }

  async updateStatus(id: string, { status }: UpdateStatusJogoDto) {
    const jogo = await this.prisma.jogo.findUnique({
      where: { id },
      include: {
        ...this.jogoInclude,
        bolao: true,
      },
    });

    if (!jogo) {
      throw new NotFoundException("Jogo não encontrado");
    }

    this.ensureValidTransition(jogo.status, status);
    const reabrindo =
      jogo.status === StatusJogo.ENCERRADO && status !== StatusJogo.ENCERRADO;

    this.validateEncerramentoPayload(status, {
      resultadoCasa: jogo.resultadoCasa ?? undefined,
      resultadoFora: jogo.resultadoFora ?? undefined,
      vencedorPenaltis: jogo.vencedorPenaltis,
      mataMata: jogo.mataMata,
    });

    const updated = await this.prisma.jogo.update({
      where: { id },
      // Regra de consistência: se não estiver encerrado, não deve manter placar/pênaltis.
      data:
        status === StatusJogo.ENCERRADO
          ? { status }
          : {
            status,
            resultadoCasa: null,
            resultadoFora: null,
            vencedorPenaltis: null,
          },
      include: this.jogoInclude,
    });

    if (status === StatusJogo.ENCERRADO) {
      await this.recalcularPontuacao(id);
    } else if (reabrindo) {
      await this.resetPontuacaoPalpites(id);
    }

    return this.mapJogo(updated);
  }

  async remove(id: string, confirm: boolean, senha?: string) {
    if (!confirm) {
      throw new BadRequestException(
        "Confirme a exclusão adicionando ?confirm=true à requisição",
      );
    }

    if (!senha) {
      throw new UnauthorizedException("Senha de confirmação é obrigatória");
    }

    await this.getJogoOrThrow(id);

    await this.prisma.jogo.delete({
      where: { id },
    });

    return { message: "Jogo removido com sucesso" };
  }

  async listarPalpitesDoJogo(id: string, user: any) {
    const jogo = await this.prisma.jogo.findUnique({
      where: { id },
    });

    if (!jogo) {
      throw new NotFoundException("Jogo não encontrado");
    }

    const isAdmin = user?.tipo === "ADMIN";

    if (!isAdmin && jogo.status === StatusJogo.PALPITES) {
      throw new BadRequestException("Os palpites só estarão visíveis após o fechamento do jogo.");
    }

    const palpites = await this.prisma.palpite.findMany({
      where: { jogoId: id },
      include: {
        usuario: { select: { id: true, nome: true, usuario: true } },
      },
      orderBy: { pontuacao: "desc" }, // Mostra quem fez mais pontos primeiro
    });

    return palpites.map(p => ({
      id: p.id,
      golsCasa: p.golsCasa,
      golsFora: p.golsFora,
      vencedorPenaltis: p.vencedorPenaltis,
      pontuacao: p.pontuacao,
      pontosJogo: p.pontosJogo,
      pontosPenaltis: p.pontosPenaltis,
      usuario: {
        id: p.usuario.id,
        nome: p.usuario.nome || p.usuario.usuario,
      },
    }));
  }
}
