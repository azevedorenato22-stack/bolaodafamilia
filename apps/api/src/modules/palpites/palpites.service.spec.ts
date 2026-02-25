import { BadRequestException } from "@nestjs/common";
import { StatusJogo, TipoUsuario } from "@prisma/client";
import { PalpitesService } from "./palpites.service";

const future = new Date("2030-01-01T12:00:00Z");
const past = new Date("2020-01-01T12:00:00Z");

function createMockPrisma(overrides: any = {}) {
  return {
    jogo: {
      findUnique: jest.fn().mockResolvedValue({
        id: "j1",
        dataHora: future,
        status: StatusJogo.PALPITES,
        mataMata: false,
        bolaoId: "b1",
        ...overrides.jogo,
      }),
    },
    palpite: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: "p1" }),
      update: jest.fn().mockResolvedValue({ id: "p1" }),
    },
  } as any;
}

function createMockJogosService() {
  return {
    recalcularPontuacao: jest.fn().mockResolvedValue(undefined),
  } as any;
}

describe("PalpitesService - horario e permissoes", () => {
  it("bloqueia palpite de usuario comum dentro da janela de 15 minutos", async () => {
    const prisma = createMockPrisma({
      jogo: { dataHora: new Date(Date.now() + 5 * 60 * 1000) },
    });
    const service = new PalpitesService(prisma, createMockJogosService());

    await expect(
      service.create(
        { id: "u1", tipo: TipoUsuario.USUARIO },
        { jogoId: "j1", golsCasa: 1, golsFora: 1 },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("permite palpite quando jogo antigo foi reaberto para PALPITES", async () => {
    const prisma = createMockPrisma({
      jogo: { dataHora: past, status: StatusJogo.PALPITES },
    });
    const service = new PalpitesService(prisma, createMockJogosService());

    await expect(
      service.create(
        { id: "u1", tipo: TipoUsuario.USUARIO },
        { jogoId: "j1", golsCasa: 1, golsFora: 1 },
      ),
    ).resolves.toEqual({ id: "p1" });
  });

  it("bloqueia palpite de admin", async () => {
    const prisma = createMockPrisma({
      jogo: { dataHora: past, status: StatusJogo.PALPITES },
    });
    const service = new PalpitesService(prisma, createMockJogosService());

    await expect(
      service.create(
        { id: "admin", tipo: TipoUsuario.ADMIN },
        { jogoId: "j1", golsCasa: 2, golsFora: 0 },
      ),
    ).rejects.toThrow("Administradores não participam de bolões");
  });

  it("permite palpite em mata-mata sem vencedor nos penaltis", async () => {
    const prisma = createMockPrisma({
      jogo: { mataMata: true },
    });
    const service = new PalpitesService(prisma, createMockJogosService());

    await expect(
      service.create(
        { id: "u1", tipo: TipoUsuario.USUARIO },
        { jogoId: "j1", golsCasa: 1, golsFora: 0 },
      ),
    ).resolves.toEqual({ id: "p1" });
  });

  it("rejeita vencedor nos penaltis em jogo que nao e mata-mata", async () => {
    const prisma = createMockPrisma({
      jogo: { mataMata: false },
    });
    const service = new PalpitesService(prisma, createMockJogosService());

    await expect(
      service.create(
        { id: "u1", tipo: TipoUsuario.USUARIO },
        {
          jogoId: "j1",
          golsCasa: 1,
          golsFora: 0,
          vencedorPenaltis: "CASA" as any,
        },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
