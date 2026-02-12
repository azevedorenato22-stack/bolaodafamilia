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
  pontosJogo: number;
  pontosPenaltis: number;
  tipo: string;
  acertouVencedor: boolean;
  acertouPlacarExato: boolean;
  acertouPenaltis: boolean;
};

// ... (omitindo as linhas do meio inalteradas, se possível, mas o range é 27-114, vou reescrever o bloco)

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
    ptsResultadoExato: Number(bolao.ptsResultadoExato ?? 25), // PE
    ptsVencedorGols: Number(bolao.ptsVencedorGols ?? 18), // PV
    ptsDifGols: Number(bolao.ptsDiferencaGols ?? 15), // DG
    ptsPlacarPerdedor: Number(bolao.ptsPlacarPerdedor ?? 12), // PP
    ptsVencedorSimples: Number(bolao.ptsVencedor ?? 10), // VS
    ptsEmpate: Number(bolao.ptsEmpate ?? 15), // EM (Empate Não Exato)
    ptsEmpateExato: Number(bolao.ptsEmpateExato ?? 25), // PE (Empate Exato = Placar Exato)
    ptsPenaltis: Number(bolao.ptsPenaltis ?? 0),
  };

  // Garante number
  const jCasa = Number(jogo.resultadoCasa);
  const jFora = Number(jogo.resultadoFora);
  const pCasa = Number(palpite.golsCasa);
  const pFora = Number(palpite.golsFora);

  // Vencedores (Tempo Normal)
  const getVencedor = (c: number, f: number) => {
    if (c > f) return "CASA";
    if (f > c) return "FORA";
    return "EMPATE";
  };

  const resReal = getVencedor(jCasa, jFora);
  const resPalpite = getVencedor(pCasa, pFora);

  // Lógica Pênaltis
  let acertouPenaltis = false;
  if (jogo.mataMata && jogo.vencedorPenaltis && palpite.vencedorPenaltis) {
    const palVenc = String(palpite.vencedorPenaltis).trim();
    const jogVenc = String(jogo.vencedorPenaltis).trim();
    if (palVenc === jogVenc) {
      acertouPenaltis = true;
    }
  }

  const pontosPenaltis = acertouPenaltis ? cfg.ptsPenaltis : 0;

  // Função helper
  const criarResultado = (pontosJogo: number, tipo: string, acertouVenc: boolean, exato: boolean): ResultadoPontuacao => ({
    pontos: pontosJogo + pontosPenaltis,
    pontosJogo,
    pontosPenaltis,
    tipo,
    acertouVencedor: acertouVenc,
    acertouPlacarExato: exato,
    acertouPenaltis
  });

  // 1. Placar Exato (PE) - 25 pts
  if (pCasa === jCasa && pFora === jFora) {
    const isEmpate = jCasa === jFora;
    // Empate Exato (25) ou Placar Exato (25)
    // Se for Empate Exato, usa regra especifica se houver, senão PE
    const pontos = isEmpate ? cfg.ptsEmpateExato : cfg.ptsResultadoExato;
    return criarResultado(pontos, "placar_exato", true, true);
  }

  // Se não foi exato, verificamos se acertou o vencedor/empate
  if (resReal === resPalpite) {
    // CENÁRIO EMPATE (EM) - 15 pts
    if (resReal === "EMPATE") {
      // Já sabemos que não é exato (caiu no if anterior), então é Empate Não Exato
      return criarResultado(cfg.ptsEmpate, "empate", true, false);
    }

    // CENÁRIO VENCEDOR (CASA ou FORA)
    const golsVencReal = resReal === "CASA" ? jCasa : jFora;
    const golsVencPalpite = resReal === "CASA" ? pCasa : pFora;

    const golsPerdReal = resReal === "CASA" ? jFora : jCasa;
    const golsPerdPalpite = resReal === "CASA" ? pFora : pCasa;

    const diffReal = jCasa - jFora;
    const diffPalpite = pCasa - pFora;

    // 2. Placar Vencedor (PV) - 18 pts
    if (golsVencPalpite === golsVencReal) {
      return criarResultado(cfg.ptsVencedorGols, "placar_vencedor", true, false);
    }

    // 3. Diferença de Gols (DG) - 15 pts
    if (diffReal === diffPalpite) {
      return criarResultado(cfg.ptsDifGols, "diferenca_gols", true, false);
    }

    // 4. Placar Perdedor (PP) - 12 pts
    if (golsPerdPalpite === golsPerdReal) {
      return criarResultado(cfg.ptsPlacarPerdedor, "placar_perdedor", true, false);
    }

    // 5. Vencedor Simples (VS) - 10 pts
    return criarResultado(cfg.ptsVencedorSimples, "vencedor_simples", true, false);
  }

  // Errou tudo (mas pode ter acertado pênaltis)
  if (pontosPenaltis > 0) {
    return criarResultado(0, "penaltis_apenas", false, false);
  }
  return criarResultado(0, "errou", false, false);
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
