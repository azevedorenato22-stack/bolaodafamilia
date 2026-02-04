import { calcularPontuacaoPalpite } from "./pontuacao";
import { VencedorPenaltis } from "@prisma/client";

describe("Calculo de Pontuacao", () => {
  const defaultBolao = {
    ptsResultadoExato: 25,
    ptsVencedorGols: 18, // Vencedor + Gols (ex: 2x1 vs 3x0 - acertou vencedor e gols do vencedor?) No, score winner match.
    ptsVencedor: 15,
    ptsGolsTime: 12, // Placar Perdedor?
    ptsDifGols: 10,
    ptsEmpate: 15,
    ptsVencedorSimples: 10, // Vencedor apenas
    ptsPlacarPerdedor: 12,
    ptsPenaltis: 10,
  };

  it("Bug 1: Jogo 2x1, Palpite Empate (1x1) - Should be 0", () => {
    const result = calcularPontuacaoPalpite({
      bolao: defaultBolao,
      jogo: {
        resultadoCasa: 2,
        resultadoFora: 1,
        mataMata: false,
      },
      palpite: {
        golsCasa: 1,
        golsFora: 1,
      },
    });

    console.log("Bug 1 Result:", result);
    expect(result.pontos).toBe(0);
  });

  it("Bug 2: Jogo 1x1 (Penaltis Fora), Palpite 1x1 (Penaltis Fora)", () => {
    const result = calcularPontuacaoPalpite({
      bolao: defaultBolao,
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
    });

    console.log("Bug 2 Result:", result);
    // User says: Should be 10 (Penaltis only).
    // Current Logic: Placar Exato (25) + Penaltis (10) = 35.
    // Or if Placar Exato checks Winner...
    // Placar Exato logic: golsCasa==resultCasa && golsFora==resultFora && ... (acertouPenaltis).
    // So it returns Placar Exato.
  });

  it("Bug 2b: Jogo 1x1 (Penaltis Fora), Palpite 1x1 (Penaltis Casa) - Wrong Penalty", () => {
    const result = calcularPontuacaoPalpite({
      bolao: defaultBolao,
      jogo: {
        resultadoCasa: 1,
        resultadoFora: 1,
        mataMata: true,
        vencedorPenaltis: "FORA" as VencedorPenaltis,
      },
      palpite: {
        golsCasa: 1,
        golsFora: 1,
        vencedorPenaltis: "CASA" as VencedorPenaltis,
      },
    });

    console.log("Bug 2b Result:", result);
    // Should be 0? Or points for score?
    // acertouVencedor: Real(FORA) vs Palpite(CASA) -> False.
    // acertouPlacarExato: 1==1, 1==1, (false || false || acertouPenaltis=false) -> False.
    // Returns 0.
  });
});
