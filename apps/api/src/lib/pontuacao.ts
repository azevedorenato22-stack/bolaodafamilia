import { VencedorPenaltis } from "@prisma/client";

export type PontuacaoContext = {
  bolao: {
    ptsResultadoExato: number;
    ptsVencedorGols: number;
    ptsVencedor: number; // usado como fallback
    ptsGolsTime: number; // usado como fallback
    ptsDifGols?: number;
    ptsPlacarPerdedor?: number;
    ptsVencedorSimples?: number;
    ptsEmpate?: number;
    ptsPenaltis?: number;
  };
  jogo: {
    resultadoCasa: number;
    resultadoFora: number;
    mataMata: boolean;
    vencedorPenaltis?: VencedorPenaltis | null;
  };
  palpite: {
    golsCasa: number;
    golsFora: number;
    vencedorPenaltis?: VencedorPenaltis | null;
  };
};

export type ResultadoPontuacao = {
  pontos: number;
  tipo: string;
  acertouVencedor: boolean;
  acertouPlacarExato: boolean;
  acertouPenaltis: boolean;
};

type ResultadoJogo = "CASA" | "FORA" | "EMPATE";

function vencedor(
  golsCasa: number,
  golsFora: number,
  mataMata: boolean,
  vencedorPenaltis?: VencedorPenaltis | null,
): ResultadoJogo {
  if (golsCasa > golsFora) return "CASA";
  if (golsFora > golsCasa) return "FORA";
  if (mataMata && vencedorPenaltis) return vencedorPenaltis;
  return "EMPATE";
}

export function calcularPontuacaoPalpite({
  bolao,
  jogo,
  palpite,
}: PontuacaoContext): ResultadoPontuacao {
  const cfg = {
    ptsResultadoExato: Number(bolao.ptsResultadoExato),
    ptsVencedorGols: Number(bolao.ptsVencedorGols),
    ptsDifGols: Number(bolao.ptsDifGols ?? bolao.ptsVencedor),
    ptsPlacarPerdedor: Number(bolao.ptsPlacarPerdedor ?? bolao.ptsGolsTime),
    ptsVencedorSimples: Number(bolao.ptsVencedorSimples ?? bolao.ptsVencedor),
    ptsEmpate: Number(bolao.ptsEmpate ?? bolao.ptsVencedor),
    ptsPenaltis: Number(bolao.ptsPenaltis ?? 0),
  };

  // Garante que os inputs são números para evitar erros de comparação de strings
  const jogoResultadoCasa = Number(jogo.resultadoCasa);
  const jogoResultadoFora = Number(jogo.resultadoFora);
  const palpiteGolsCasa = Number(palpite.golsCasa);
  const palpiteGolsFora = Number(palpite.golsFora);

  const resultadoReal = vencedor(
    jogoResultadoCasa,
    jogoResultadoFora,
    jogo.mataMata,
    jogo.vencedorPenaltis,
  );
  const resultadoPalpite = vencedor(
    palpiteGolsCasa,
    palpiteGolsFora,
    jogo.mataMata,
    palpite.vencedorPenaltis,
  );

  const acertouPenaltis =
    jogo.mataMata &&
    jogoResultadoCasa === jogoResultadoFora &&
    !!jogo.vencedorPenaltis &&
    palpite.vencedorPenaltis === jogo.vencedorPenaltis;

  const acertouPlacarExato =
    palpiteGolsCasa === jogoResultadoCasa &&
    palpiteGolsFora === jogoResultadoFora &&
    (!jogo.mataMata ||
      jogoResultadoCasa !== jogoResultadoFora ||
      acertouPenaltis);

  const finalize = (
    pontosBase: number,
    tipo: string,
    acertouVencedor: boolean,
  ) => {
    // Se decidiu nos pênaltis, e o usuário acertou os pênaltis,
    // a regra solicitada é que receba APENAS os pontos de pênaltis ("só 10 pontos"),
    // ignorando pontos de placar exato ou outros.

    const pontos = pontosBase + (acertouPenaltis ? cfg.ptsPenaltis : 0);
    return {
      pontos,
      tipo,
      acertouVencedor,
      acertouPlacarExato,
      acertouPenaltis,
    };
  };

  // REGRA ESPECÍFICA: Decisão por pênaltis
  // Se acertou os penaltis, o usuário recebe APENAS a pontuação de pênaltis.
  // Isso evita somar com Placar Exato ou Empate.
  if (acertouPenaltis) {
    return {
      pontos: cfg.ptsPenaltis,
      tipo: "penaltis_apenas",
      acertouVencedor: true,
      acertouPlacarExato: acertouPlacarExato,
      acertouPenaltis: true,
    };
  }

  if (acertouPlacarExato) {
    return finalize(cfg.ptsResultadoExato, "placar_exato", true);
  }

  const acertouVencedor =
    resultadoPalpite === resultadoReal && resultadoReal !== "EMPATE";

  const golsVencedorReal =
    resultadoReal === "CASA" ? jogoResultadoCasa : jogoResultadoFora;
  const golsVencedorPalpite =
    resultadoPalpite === "CASA" ? palpiteGolsCasa : palpiteGolsFora;

  if (acertouVencedor && golsVencedorPalpite === golsVencedorReal) {
    return finalize(cfg.ptsVencedorGols, "placar_vencedor", true);
  }

  const diffReal = jogoResultadoCasa - jogoResultadoFora;
  const diffPalpite = palpiteGolsCasa - palpiteGolsFora;
  if (acertouVencedor && diffReal === diffPalpite) {
    return finalize(cfg.ptsDifGols, "diferenca_gols", true);
  }

  const golsPerdedorReal =
    resultadoReal === "CASA" ? jogoResultadoFora : jogoResultadoCasa;
  const golsPerdedorPalpite =
    resultadoPalpite === "CASA" ? palpiteGolsFora : palpiteGolsCasa;
  if (acertouVencedor && golsPerdedorPalpite === golsPerdedorReal) {
    return finalize(cfg.ptsPlacarPerdedor, "placar_perdedor", true);
  }

  if (resultadoReal === "EMPATE" && resultadoPalpite === "EMPATE") {
    return finalize(cfg.ptsEmpate, "empate", true);
  }

  if (acertouVencedor) {
    return finalize(cfg.ptsVencedorSimples, "vencedor_simples", true);
  }

  return finalize(0, "errou", false);
}

export const EXEMPLOS_PONTUACAO = [
  {
    descricao: "Placar exato",
    entrada: {
      bolao: {
        ptsResultadoExato: 10,
        ptsVencedorGols: 6,
        ptsVencedor: 3,
        ptsGolsTime: 2,
      },
      jogo: { resultadoCasa: 2, resultadoFora: 1, mataMata: false },
      palpite: { golsCasa: 2, golsFora: 1 },
    },
    esperado: "placar_exato",
  },
  {
    descricao: "Vencedor + gols do vencedor",
    entrada: {
      bolao: {
        ptsResultadoExato: 10,
        ptsVencedorGols: 6,
        ptsVencedor: 3,
        ptsGolsTime: 2,
      },
      jogo: { resultadoCasa: 3, resultadoFora: 1, mataMata: false },
      palpite: { golsCasa: 3, golsFora: 0 },
    },
    esperado: "placar_vencedor",
  },
  {
    descricao: "Empate acertado",
    entrada: {
      bolao: {
        ptsResultadoExato: 10,
        ptsVencedorGols: 6,
        ptsVencedor: 3,
        ptsGolsTime: 2,
      },
      jogo: { resultadoCasa: 1, resultadoFora: 1, mataMata: false },
      palpite: { golsCasa: 0, golsFora: 0 },
    },
    esperado: "empate",
  },
  {
    descricao: "Mata-mata com pênaltis corretos",
    entrada: {
      bolao: {
        ptsResultadoExato: 10,
        ptsVencedorGols: 6,
        ptsVencedor: 3,
        ptsGolsTime: 2,
      },
      jogo: {
        resultadoCasa: 1,
        resultadoFora: 1,
        mataMata: true,
        vencedorPenaltis: "FORA" as VencedorPenaltis,
      },
      palpite: {
        golsCasa: 1,
        golsFora: 1,
        vencedorPenaltis: "FORA" as VencedorPenaltis,
      },
    },
    esperado: "penaltis_apenas",
  },
];
