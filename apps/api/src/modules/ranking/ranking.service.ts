import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

type RankingFilters = {
  bolaoId: string;
  usuarioIds?: string[];
  rodadaId?: string;
  status?: string;
  data?: string;
};

type RankingRow = {
  usuarioId: string;
  nome: string;
  pontosTotal: number;
  pontosJogos: number;
  pontosCampeao: number;
  pc: number; // placar exato
  pv: number; // vencedor + gols / vencedor simples / empate
  dg: number; // diferença de gols acertada
  pp: number; // placar perdedor / gols time
  em: number; // empates não exatos
  v: number; // vitórias (vencedor correto)
  e: number; // erros (nenhum ponto)
  penaltis: number; // penaltis acertados
};

@Injectable()
export class RankingService {
  constructor(private prisma: PrismaService) { }

  private parseDateOnlyToLocalRange(data?: string) {
    if (!data) return null;
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(data);
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    if (
      !Number.isFinite(year) ||
      !Number.isFinite(month) ||
      !Number.isFinite(day) ||
      month < 1 ||
      month > 12 ||
      day < 1 ||
      day > 31
    ) {
      return null;
    }
    const start = new Date(year, month - 1, day, 0, 0, 0, 0);
    const end = new Date(year, month - 1, day, 23, 59, 59, 999);
    return { start, end };
  }

  private ordenar(rows: RankingRow[]) {
    return rows
      .sort((a, b) => {
        if (b.pontosTotal !== a.pontosTotal) return b.pontosTotal - a.pontosTotal; // 1. Pontos Totais (Critério principal)
        if (b.pontosCampeao !== a.pontosCampeao)
          return b.pontosCampeao - a.pontosCampeao; // 2. Pontos Campeão (Critério desempate)
        if (b.pc !== a.pc) return b.pc - a.pc;
        if (b.em !== a.em) return b.em - a.em;
        if (b.pv !== a.pv) return b.pv - a.pv;
        if (b.dg !== a.dg) return b.dg - a.dg;
        if (b.pp !== a.pp) return b.pp - a.pp;
        return b.v - a.v;
      })
      .map((row, index) => ({
        ...row,
        posicao: index + 1,
      }));
  }

  private mapTipoPontuacao(tipoPontuacao?: string | null) {
    switch (tipoPontuacao) {
      case "placar_exato":
        return { pc: 1, pv: 0, dg: 0, pp: 0, em: 0, v: 1, e: 0 };
      case "placar_vencedor":
        return { pc: 0, pv: 1, dg: 0, pp: 0, em: 0, v: 1, e: 0 };
      case "diferenca_gols":
        return { pc: 0, pv: 0, dg: 1, pp: 0, em: 0, v: 1, e: 0 };
      case "placar_perdedor":
        return { pc: 0, pv: 0, dg: 0, pp: 1, em: 0, v: 1, e: 0 };
      case "vencedor_simples":
        return { pc: 0, pv: 0, dg: 0, pp: 0, em: 0, v: 1, e: 0 };
      case "empate":
        return { pc: 0, pv: 0, dg: 0, pp: 0, em: 1, v: 0, e: 0 };
      case "penaltis":
        return { pc: 0, pv: 0, dg: 0, pp: 0, em: 0, v: 0, e: 0 };
      case "errou":
        return { pc: 0, pv: 0, dg: 0, pp: 0, em: 0, v: 0, e: 1 };
      default:
        return { pc: 0, pv: 0, dg: 0, pp: 0, em: 0, v: 0, e: 0 };
    }
  }

  private async loadBaseData(filters: RankingFilters) {
    const { bolaoId, usuarioIds, rodadaId, status, data } = filters;
    const bolao = await this.prisma.bolao.findUnique({
      where: { id: bolaoId },
      select: { id: true, nome: true },
    });
    if (!bolao) throw new NotFoundException("Bolão não encontrado");

    if (rodadaId) {
      const vinculo = await this.prisma.bolaoRodada.findFirst({
        where: { bolaoId, rodadaId },
        select: { rodadaId: true },
      });
      if (!vinculo) {
        throw new BadRequestException("Rodada não pertence ao bolão");
      }
    }

    const participantes = await this.prisma.bolaoUsuario.findMany({
      where: {
        bolaoId,
        ...(usuarioIds ? { usuarioId: { in: usuarioIds } } : {}),
        usuario: {
          tipo: "USUARIO",
          ativo: true,
        },
      },
      select: {
        usuario: { select: { id: true, nome: true } },
      },
    });
    const usuarios = participantes.map((p) => p.usuario);
    const participantesIds = usuarios.map((u) => u.id);

    const dateRange = this.parseDateOnlyToLocalRange(data);
    const dateFilter = dateRange
      ? {
        dataHora: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
      }
      : {};

    const palpitesJogos = await this.prisma.palpite.findMany({
      where: {
        usuarioId: { in: participantesIds },
        jogo: {
          bolaoId,
          // O usuário pediu para atualizar ranking com status FECHADO e ENCERRADO.
          // Antes estava fixo ENCERRADO. Vamos ajustar para IN [FECHADO, ENCERRADO] se status não for passado.
          status: status ? (status as any) : { in: ["FECHADO", "ENCERRADO"] },
          ...(rodadaId ? { rodadaId } : {}),
          ...(dateFilter as any),
        },
      },
      select: {
        usuarioId: true,
        pontuacao: true,
        pontosJogo: true,
        pontosPenaltis: true,
        tipoPontuacao: true,
        vencedorPenaltis: true,
        jogo: { select: { vencedorPenaltis: true } }
      },
    });

    const palpitesCampeao = await this.prisma.palpiteCampeao.findMany({
      where: {
        campeao: { bolaoId },
        usuarioId: { in: participantesIds },
      },
      select: {
        usuarioId: true,
        pontuacao: true,
      },
    });

    return { bolao, usuarios, palpitesJogos, palpitesCampeao };
  }

  async rankingGeral(filters: RankingFilters) {
    return this.rankingFiltrado(filters);
  }

  async rankingFiltrado(filters: RankingFilters) {
    const { usuarios, palpitesJogos, palpitesCampeao } =
      await this.loadBaseData(filters);

    const base: Record<string, RankingRow> = {};
    for (const user of usuarios) {
      base[user.id] = {
        usuarioId: user.id,
        nome: user.nome,
        pontosTotal: 0,
        pontosJogos: 0,
        pontosCampeao: 0,
        pc: 0,
        pv: 0,
        dg: 0,
        pp: 0,
        em: 0,
        v: 0,
        e: 0,
        penaltis: 0,
      };
    }

    for (const p of palpitesJogos) {
      if (!base[p.usuarioId]) continue;

      const pts = p.pontuacao ?? 0;
      base[p.usuarioId].pontosJogos += pts;
      base[p.usuarioId].pontosTotal += pts;

      const bucket = this.mapTipoPontuacao(p.tipoPontuacao);
      base[p.usuarioId].pc += bucket.pc;
      base[p.usuarioId].pv += bucket.pv;
      base[p.usuarioId].dg += bucket.dg;
      base[p.usuarioId].pp += bucket.pp;
      base[p.usuarioId].em += bucket.em;
      base[p.usuarioId].v += bucket.v;
      base[p.usuarioId].e += bucket.e;

      // Se teve pontos de penaltis, conta como acerto de penalti
      if ((p.pontosPenaltis ?? 0) > 0) {
        base[p.usuarioId].penaltis += 1;
      }
    }

    for (const p of palpitesCampeao) {
      if (!base[p.usuarioId]) continue;
      base[p.usuarioId].pontosCampeao += p.pontuacao ?? 0;
      base[p.usuarioId].pontosTotal += p.pontuacao ?? 0;
    }

    const rows = Object.values(base);
    return this.ordenar(rows);
  }

  async extratoUsuario(bolaoId: string, usuarioId: string, filters?: RankingFilters) {
    const bolao = await this.prisma.bolao.findUnique({
      where: { id: bolaoId },
      select: { id: true, nome: true },
    });
    if (!bolao) throw new NotFoundException("Bolão não encontrado");

    const dateRange = this.parseDateOnlyToLocalRange(filters?.data);
    const dateFilter = dateRange
      ? {
        dataHora: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
      }
      : {};

    const palpitesJogos = await this.prisma.palpite.findMany({
      where: {
        usuarioId,
        jogo: {
          bolaoId,
          ...(filters?.rodadaId ? { rodadaId: filters.rodadaId } : {}),
          ...(filters?.status ? { status: filters.status as any } : {}),
          ...(dateFilter as any),
        }
      },
      select: {
        id: true,
        jogo: {
          select: {
            id: true,
            dataHora: true,
            rodada: { select: { nome: true } },
            status: true,
            mataMata: true,
            timeCasa: { select: { nome: true } },
            timeFora: { select: { nome: true } },
            resultadoCasa: true,
            resultadoFora: true,
            vencedorPenaltis: true,
          },
        },
        golsCasa: true,
        golsFora: true,
        vencedorPenaltis: true,
        pontuacao: true,
        pontosJogo: true,
        pontosPenaltis: true,
        tipoPontuacao: true,
        calculadoEm: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const palpitesCampeao = await this.prisma.palpiteCampeao.findMany({
      where: { usuarioId, campeao: { bolaoId } },
      select: {
        id: true,
        campeao: {
          select: {
            id: true,
            nome: true,
            dataLimite: true,
            resultadoFinal: { select: { nome: true } },
          },
        },
        timeEscolhido: { select: { nome: true } },
        pontuacao: true,
        calculadoEm: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    let resumo = {
      pontosTotal: 0,
      pontosJogos: 0,
      pontosCampeao: 0,
      pc: 0,
      pv: 0,
      dg: 0,
      pp: 0,
      em: 0,
      v: 0,
      e: 0,
      penaltis: 0,
    };

    for (const p of palpitesJogos) {
      resumo.pontosJogos += p.pontuacao ?? 0;
      resumo.pontosTotal += p.pontuacao ?? 0;
      const bucket = this.mapTipoPontuacao(p.tipoPontuacao);
      resumo.pc += bucket.pc;
      resumo.pv += bucket.pv;
      resumo.dg += bucket.dg;
      resumo.pp += bucket.pp;
      resumo.em += bucket.em;
      resumo.v += bucket.v;
      resumo.e += bucket.e;

      if (p.vencedorPenaltis && p.jogo?.vencedorPenaltis && p.vencedorPenaltis === p.jogo.vencedorPenaltis) {
        resumo.penaltis += 1;
      }
    }

    for (const p of palpitesCampeao) {
      resumo.pontosCampeao += p.pontuacao ?? 0;
      resumo.pontosTotal += p.pontuacao ?? 0;
    }

    // Calcular posição no ranking
    const ranking = await this.rankingGeral({ bolaoId, rodadaId: filters?.rodadaId, status: filters?.status, data: filters?.data });
    const userRank = ranking.find(r => r.usuarioId === usuarioId);
    const posicao = userRank?.posicao || '-';

    return {
      bolao: { id: bolao.id, nome: bolao.nome },
      resumo,
      posicao, // Nova prop
      palpitesJogos,
      palpitesCampeao,
    };
  }
}
