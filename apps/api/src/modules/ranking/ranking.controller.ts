import { Controller, Get, Param, Query } from "@nestjs/common";
import { RankingService } from "./ranking.service";

@Controller("ranking")
export class RankingController {
  constructor(private readonly rankingService: RankingService) {}

  @Get("bolao/:bolaoId")
  rankingGeral(
    @Param("bolaoId") bolaoId: string,
    @Query("rodadaId") rodadaId?: string,
    @Query("status") status?: string,
    @Query("data") data?: string,
  ) {
    return this.rankingService.rankingGeral({
      bolaoId,
      rodadaId,
      status,
      data,
    });
  }

  @Get("bolao/:bolaoId/filtrado")
  rankingFiltrado(
    @Param("bolaoId") bolaoId: string,
    @Query("usuarios") usuarios?: string,
    @Query("rodadaId") rodadaId?: string,
    @Query("status") status?: string,
    @Query("data") data?: string,
  ) {
    const usuarioIds = usuarios ? usuarios.split(",") : undefined;
    return this.rankingService.rankingFiltrado({
      bolaoId,
      usuarioIds,
      rodadaId,
      status,
      data,
    });
  }

  @Get("bolao/:bolaoId/usuario/:usuarioId")
  extrato(
    @Param("bolaoId") bolaoId: string,
    @Param("usuarioId") usuarioId: string,
  ) {
    return this.rankingService.extratoUsuario(bolaoId, usuarioId);
  }
}
