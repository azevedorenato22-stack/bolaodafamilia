import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateCampeaoDto } from "./dto/create-campeao.dto";
import { UpdateCampeaoDto } from "./dto/update-campeao.dto";
import { CreatePalpiteCampeaoDto } from "./dto/create-palpite-campeao.dto";
import { UpdatePalpiteCampeaoDto } from "./dto/update-palpite-campeao.dto";
import { TipoUsuario } from "@prisma/client";

@Injectable()
export class CampeoesService {
  constructor(private prisma: PrismaService) {}

  private computeCampeaoStatus(campeao: {
    dataLimite: Date;
    resultadoFinalId?: string | null;
  }) {
    if (campeao.resultadoFinalId) {
      return { status: "RESULTADO_DEFINIDO" as const, bloqueado: true };
    }

    const now = new Date();
    if (now > campeao.dataLimite) {
      return { status: "PRAZO_ENCERRADO" as const, bloqueado: true };
    }

    return { status: "ABERTO" as const, bloqueado: false };
  }

  private async ensureBolao(bolaoId: string) {
    const bolao = await this.prisma.bolao.findUnique({
      where: { id: bolaoId },
    });
    if (!bolao) throw new NotFoundException("Bolão não encontrado");
    return bolao;
  }

  private parseDate(date: string | Date | undefined) {
    if (!date) return undefined;
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException("Data inválida");
    }
    return parsed;
  }

  private async recalcPontuacaoCampeao(campeaoId: string) {
    const campeao = await this.prisma.campeao.findUnique({
      where: { id: campeaoId },
      include: {
        bolao: true,
        resultadoFinal: true,
        palpites: true,
      },
    });

    if (!campeao || !campeao.resultadoFinalId) return;

    const pontos = campeao.pontuacao ?? campeao.bolao.ptsCampeao;

    await Promise.all(
      campeao.palpites.map((p) =>
        this.prisma.palpiteCampeao.update({
          where: { id: p.id },
          data: {
            pontuacao:
              p.timeEscolhidoId === campeao.resultadoFinalId ? pontos : 0,
            calculadoEm: new Date(),
          },
        }),
      ),
    );
  }

  private async resetPontuacaoPalpitesCampeao(campeaoId: string) {
    await this.prisma.palpiteCampeao.updateMany({
      where: { campeaoId },
      data: { pontuacao: 0, calculadoEm: null },
    });
  }

  private async ensureTimeBelongsToBolao(timeId: string, bolaoId: string) {
    const exists = await this.prisma.bolaoTime.findFirst({
      where: { bolaoId, timeId },
    });

    if (!exists) {
      throw new BadRequestException(
        "O time precisa estar vinculado ao bolão para ser escolhido",
      );
    }
  }

  async create(dto: CreateCampeaoDto) {
    await this.ensureBolao(dto.bolaoId);
    const dataLimite = this.parseDate(dto.dataLimite);

    const existing = await this.prisma.campeao.findFirst({
      where: { bolaoId: dto.bolaoId, nome: dto.nome },
    });
    if (existing) {
      throw new ConflictException(
        "Já existe um campeão com esse nome no bolão",
      );
    }

    return this.prisma.campeao.create({
      data: {
        bolaoId: dto.bolaoId,
        nome: dto.nome,
        descricao: dto.descricao,
        dataLimite: dataLimite!,
        pontuacao: dto.pontuacao,
      },
    });
  }

  async findAllByBolao(bolaoId: string) {
    await this.ensureBolao(bolaoId);
    const campeoes = await this.prisma.campeao.findMany({
      where: { bolaoId },
      orderBy: { dataLimite: "asc" },
      include: {
        resultadoFinal: {
          select: { id: true, nome: true, escudoUrl: true },
        },
        _count: {
          select: { palpites: true },
        },
      },
    });

    return campeoes.map((c) => ({
      ...c,
      ...this.computeCampeaoStatus(c),
    }));
  }

  async findById(id: string) {
    const campeao = await this.prisma.campeao.findUnique({
      where: { id },
      include: {
        resultadoFinal: {
          select: { id: true, nome: true, escudoUrl: true },
        },
        bolao: {
          select: { id: true, nome: true, ptsCampeao: true },
        },
        _count: {
          select: { palpites: true },
        },
      },
    });
    if (!campeao) throw new NotFoundException("Campeão não encontrado");
    return {
      ...campeao,
      ...this.computeCampeaoStatus(campeao),
    };
  }

  async update(id: string, dto: UpdateCampeaoDto) {
    const campeao = await this.prisma.campeao.findUnique({ where: { id } });
    if (!campeao) throw new NotFoundException("Campeão não encontrado");

    const bolaoId = dto.bolaoId ?? campeao.bolaoId;
    await this.ensureBolao(bolaoId);

    const dataLimite = this.parseDate(dto.dataLimite ?? campeao.dataLimite);

    if (dto.nome && dto.nome !== campeao.nome) {
      const existing = await this.prisma.campeao.findFirst({
        where: { bolaoId, nome: dto.nome },
      });
      if (existing) {
        throw new ConflictException(
          "Já existe um campeão com esse nome no bolão",
        );
      }
    }

    const hasResultado = Object.prototype.hasOwnProperty.call(
      dto,
      "resultadoFinalId",
    );
    const now = new Date();
    const movingDeadlineToFuture =
      dto.dataLimite !== undefined && (dataLimite as Date) > now;
    const shouldReopenByFutureDate =
      movingDeadlineToFuture && !hasResultado && !!campeao.resultadoFinalId;

    if (hasResultado && dto.resultadoFinalId) {
      await this.ensureTimeBelongsToBolao(dto.resultadoFinalId, bolaoId);
    }

    let resultadoFinalId = campeao.resultadoFinalId;
    let definidoEm = campeao.definidoEm;

    if (hasResultado) {
      if (dto.resultadoFinalId === null) {
        resultadoFinalId = null;
        definidoEm = null;
      } else if (dto.resultadoFinalId) {
        resultadoFinalId = dto.resultadoFinalId;
        definidoEm =
          dto.resultadoFinalId !== campeao.resultadoFinalId
            ? new Date()
            : campeao.definidoEm;
      }
    } else if (shouldReopenByFutureDate) {
      resultadoFinalId = null;
      definidoEm = null;
    }

    const updated = await this.prisma.campeao.update({
      where: { id },
      data: {
        bolaoId,
        nome: dto.nome ?? campeao.nome,
        descricao: dto.descricao ?? campeao.descricao,
        dataLimite: dataLimite!,
        pontuacao: dto.pontuacao ?? campeao.pontuacao,
        resultadoFinalId,
        definidoEm,
      },
    });

    if (hasResultado || shouldReopenByFutureDate) {
      if (resultadoFinalId) {
        await this.recalcPontuacaoCampeao(id);
      } else {
        await this.resetPontuacaoPalpitesCampeao(id);
      }
    }

    return updated;
  }

  async remove(id: string, senha?: string) {
    if (!senha) {
      throw new UnauthorizedException("Senha de confirmação é obrigatória");
    }

    const campeao = await this.prisma.campeao.findUnique({
      where: { id },
      include: { _count: { select: { palpites: true } } },
    });
    if (!campeao) throw new NotFoundException("Campeão não encontrado");

    if (campeao._count.palpites > 0) {
      throw new BadRequestException(
        "Não é possível remover, há palpites cadastrados",
      );
    }

    await this.prisma.campeao.delete({ where: { id } });
    return { message: "Campeão removido com sucesso" };
  }

  private assertPrazo(dataLimite: Date, user: any) {
    const isAdmin = user?.tipo === TipoUsuario.ADMIN;
    if (isAdmin) return;
    const now = new Date();
    if (now > dataLimite) {
      throw new BadRequestException(
        "Prazo para palpites deste campeão expirou",
      );
    }
  }

  async criarPalpite(user: any, dto: CreatePalpiteCampeaoDto) {
    const campeao = await this.prisma.campeao.findUnique({
      where: { id: dto.campeaoId },
    });
    if (!campeao) throw new NotFoundException("Campeão não encontrado");

    this.assertPrazo(campeao.dataLimite, user);
    await this.ensureTimeBelongsToBolao(dto.timeId, campeao.bolaoId);

    const existing = await this.prisma.palpiteCampeao.findUnique({
      where: {
        unique_palpite_campeao_usuario: {
          campeaoId: dto.campeaoId,
          usuarioId: user.id,
        },
      },
    });
    if (existing) {
      throw new ConflictException("Já existe um palpite seu para este campeão");
    }

    return this.prisma.palpiteCampeao.create({
      data: {
        campeaoId: dto.campeaoId,
        usuarioId: user.id,
        timeEscolhidoId: dto.timeId,
      },
    });
  }

  async atualizarPalpite(
    id: string,
    user: any,
    dto: UpdatePalpiteCampeaoDto,
    forceAdmin = false,
  ) {
    const palpite = await this.prisma.palpiteCampeao.findUnique({
      where: { id },
      include: { campeao: true },
    });
    if (!palpite)
      throw new NotFoundException("Palpite de campeão não encontrado");

    const isOwner = palpite.usuarioId === user.id;
    const isAdmin = user?.tipo === TipoUsuario.ADMIN;
    if (!isOwner && !isAdmin) {
      throw new ForbiddenException("Você não pode editar este palpite");
    }

    if (!isAdmin || !forceAdmin) {
      this.assertPrazo(palpite.campeao.dataLimite, user);
    }

    const targetCampeaoId = dto.campeaoId ?? palpite.campeaoId;
    const campeao = await this.prisma.campeao.findUnique({
      where: { id: targetCampeaoId },
    });
    if (!campeao) throw new NotFoundException("Campeão não encontrado");

    if (!isAdmin || !forceAdmin) {
      this.assertPrazo(campeao.dataLimite, user);
    }

    const targetTimeId = dto.timeId ?? palpite.timeEscolhidoId;
    await this.ensureTimeBelongsToBolao(targetTimeId, campeao.bolaoId);

    if (
      targetCampeaoId !== palpite.campeaoId ||
      targetTimeId !== palpite.timeEscolhidoId
    ) {
      const duplicate = await this.prisma.palpiteCampeao.findUnique({
        where: {
          unique_palpite_campeao_usuario: {
            campeaoId: targetCampeaoId,
            usuarioId: palpite.usuarioId,
          },
        },
      });
      if (duplicate && duplicate.id !== palpite.id) {
        throw new ConflictException(
          "Já existe um palpite deste usuário para o campeão",
        );
      }
    }

    const updated = await this.prisma.palpiteCampeao.update({
      where: { id },
      data: {
        campeaoId: targetCampeaoId,
        timeEscolhidoId: targetTimeId,
      },
    });

    if (campeao.resultadoFinalId) {
      await this.recalcPontuacaoCampeao(campeao.id);
    }

    return updated;
  }

  async listarPalpites(campeaoId: string, user: any) {
    const campeao = await this.prisma.campeao.findUnique({
      where: { id: campeaoId },
      include: {
        resultadoFinal: true,
      },
    });

    if (!campeao) throw new NotFoundException("Campeão não encontrado");

    const isAdmin = user?.tipo === TipoUsuario.ADMIN;
    const prazoEncerrado = new Date() > campeao.dataLimite;
    const revealAll = isAdmin || prazoEncerrado || !!campeao.resultadoFinalId;

    const where = revealAll ? { campeaoId } : { campeaoId, usuarioId: user.id };

    return this.prisma.palpiteCampeao.findMany({
      where,
      include: {
        usuario: { select: { id: true, nome: true, email: true } },
        timeEscolhido: { select: { id: true, nome: true, escudoUrl: true } },
      },
      orderBy: { createdAt: "asc" },
    });
  }
}
