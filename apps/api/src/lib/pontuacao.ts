import { VencedorPenaltis } from "@prisma/client";

export type PontuacaoContext = {
  bolao: {
    ptsResultadoExato: number;
    ptsVencedorGols: number;
    ptsVencedor: number;
    ptsDiferencaGols?: number;
    ptsPlacarPerdedor?: number;
    ptsEmpate?: number;
    ptsEmpateExato?: number;
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
    ptsDifGols: Number(bolao.ptsDiferencaGols ?? bolao.ptsVencedor),
    ptsPlacarPerdedor: Number(bolao.ptsPlacarPerdedor ?? 12),
    ptsVencedorSimples: Number(bolao.ptsVencedor ?? 10),
    ptsEmpate: Number(bolao.ptsEmpate ?? bolao.ptsVencedor),
    ptsEmpateExato: Number(bolao.ptsEmpateExato ?? bolao.ptsResultadoExato),
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

  // Pontuação de Pênaltis (Adicional)
  const pontosPenaltis = acertouPenaltis ? cfg.ptsPenaltis : 0;

  // Função auxiliar para retornar resultado somando pênaltis
  const resultado = (
    ptsBase: number,
    tipoBase: string,
    vencedor: boolean,
    placarExato: boolean,
  ): ResultadoPontuacao => {
    return {
      pontos: ptsBase + pontosPenaltis,
      tipo: tipoBase, // O tipo de pontuação principal (ex: PLACAR_EXATO)
      acertouVencedor: vencedor,
      acertouPlacarExato: placarExato,
      acertouPenaltis,
    };
  };

  // 1. Placar Exato (PE) - Inclui Empate Exato (25 pts)
  if (acertouPlacarExato) {
    const isEmpate = jogoResultadoCasa === jogoResultadoFora;
    const pontos = isEmpate ? cfg.ptsEmpateExato : cfg.ptsResultadoExato;
    return resultado(pontos, "placar_exato", true, true);
  }

  const acertouVencedor =
    resultadoPalpite === resultadoReal && resultadoReal !== "EMPATE";

  const golsVencedorReal =
    resultadoReal === "CASA" ? jogoResultadoCasa : jogoResultadoFora;
  const golsVencedorPalpite =
    resultadoPalpite === "CASA" ? palpiteGolsCasa : palpiteGolsFora;

  const golsPerdedorReal =
    resultadoReal === "CASA" ? jogoResultadoFora : jogoResultadoCasa;
  const golsPerdedorPalpite =
    resultadoPalpite === "CASA" ? palpiteGolsFora : palpiteGolsCasa;

  const diffReal = jogoResultadoCasa - jogoResultadoFora;
  const diffPalpite = palpiteGolsCasa - palpiteGolsFora;

  // 2. Vencedor + Placar Vencedor (PV) - 18 pts
  if (acertouVencedor && golsVencedorPalpite === golsVencedorReal) {
    return resultado(cfg.ptsVencedorGols, "placar_vencedor", true, false);
  }

  // 3. Vencedor + Diferença de Gols (DG) - 15 pts
  if (acertouVencedor && diffReal === diffPalpite) {
    return resultado(cfg.ptsDifGols, "diferenca_gols", true, false);
  }

  // 4. Empate Não Exato (EM) - 15 pts
  if (resultadoReal === "EMPATE" && resultadoPalpite === "EMPATE") {
    // Se chegou aqui, não foi exato, então é empate não exato
    return resultado(cfg.ptsEmpate, "empate", true, false);
  }

  // 5. Vencedor + Placar Perdedor (PP) - 12 pts
  if (acertouVencedor && golsPerdedorPalpite === golsPerdedorReal) {
    return resultado(cfg.ptsPlacarPerdedor, "placar_perdedor", true, false);
  }

  // 6. Vencedor Simples (VS) - 10 pts
  if (acertouVencedor) {
    return resultado(cfg.ptsVencedorSimples, "vencedor_simples", true, false);
  }

  // 7. Errou tudo, mas pode ter acertado pênaltis
  return resultado(0, "errou", false, false);
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
