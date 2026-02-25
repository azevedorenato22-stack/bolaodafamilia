import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreatePalpiteDto } from "./dto/create-palpite.dto";
import { UpdatePalpiteDto } from "./dto/update-palpite.dto";
import { StatusJogo, TipoUsuario, VencedorPenaltis } from "@prisma/client";
import { JogosService } from "../jogos/jogos.service";

@Injectable()
export class PalpitesService {
  constructor(
    private prisma: PrismaService,
    private jogosService: JogosService,
  ) { }

  private readonly BLOQUEIO_MINUTOS = Number(
    process.env.BLOQUEIO_PALPITE_MINUTOS ?? 15,
  );

  private async getJogo(jogoId: string) {
    const jogo = await this.prisma.jogo.findUnique({
      where: { id: jogoId },
      select: {
        id: true,
        dataHora: true,
        status: true,
        mataMata: true,
        bolaoId: true,
      },
    });

    if (!jogo) {
      throw new NotFoundException("Jogo não encontrado");
    }

    return jogo;
  }

  async findMine(user: any, bolaoId?: string) {
    if (!user || user.tipo === TipoUsuario.ADMIN) {
      return [];
    }
    if (!bolaoId) {
      throw new BadRequestException("bolaoId é obrigatório");
    }

    const palpites = await this.prisma.palpite.findMany({
      where: {
        usuarioId: user.id,
        jogo: { bolaoId },
      },
      select: {
        id: true,
        jogoId: true,
        golsCasa: true,
        golsFora: true,
        vencedorPenaltis: true,
        pontuacao: true,
        jogo: {
          select: {
            status: true,
            dataHora: true,
            mataMata: true,
          },
        },
      },
    });

    return palpites;
  }

  private requirePenaltisIfNeeded(
    mataMata: boolean,
    vencedorPenaltis?: VencedorPenaltis | null,
  ) {
    if (!mataMata && vencedorPenaltis) {
      throw new BadRequestException(
        "Vencedor nos pênaltis só é permitido para jogos mata-mata",
      );
    }
  }

  private assertCanEdit(
    user: any,
    jogo: { dataHora: Date; status: StatusJogo },
  ) {
    const isAdmin = user?.tipo === TipoUsuario.ADMIN;
    if (isAdmin) return;

    if (jogo.status !== StatusJogo.PALPITES) {
      throw new BadRequestException("Palpites bloqueados para este jogo");
    }

    const now = new Date();
    const diffMinutes = (jogo.dataHora.getTime() - now.getTime()) / 60000;
    const inCriticalWindow =
      diffMinutes < this.BLOQUEIO_MINUTOS && diffMinutes > -240;

    if (inCriticalWindow) {
      throw new BadRequestException(
        `Palpites são permitidos até ${this.BLOQUEIO_MINUTOS} minutos antes do jogo`,
      );
    }
  }

  async create(user: any, createPalpiteDto: CreatePalpiteDto) {
    if (user?.tipo === TipoUsuario.ADMIN) {
      throw new ForbiddenException("Administradores não participam de bolões");
    }
    const jogo = await this.getJogo(createPalpiteDto.jogoId);

    this.assertCanEdit(user, jogo);
    this.requirePenaltisIfNeeded(
      jogo.mataMata,
      createPalpiteDto.vencedorPenaltis,
    );

    const existing = await this.prisma.palpite.findUnique({
      where: {
        unique_palpite_usuario_jogo: {
          jogoId: createPalpiteDto.jogoId,
          usuarioId: user.id,
        },
      },
    });

    if (existing) {
      throw new BadRequestException(
        "Você já cadastrou um palpite para este jogo",
      );
    }

    return this.prisma.palpite.create({
      data: {
        jogoId: createPalpiteDto.jogoId,
        usuarioId: user.id,
        golsCasa: createPalpiteDto.golsCasa,
        golsFora: createPalpiteDto.golsFora,
        vencedorPenaltis: createPalpiteDto.vencedorPenaltis,
      },
    });
  }

  async update(
    id: string,
    user: any,
    updatePalpiteDto: UpdatePalpiteDto,
    forceAdmin = false,
  ) {
    if (user?.tipo === TipoUsuario.ADMIN && !forceAdmin) {
      throw new ForbiddenException("Administradores não participam de bolões");
    }
    const palpite = await this.prisma.palpite.findUnique({
      where: { id },
    });

    if (!palpite) {
      throw new NotFoundException("Palpite não encontrado");
    }

    const isOwner = palpite.usuarioId === user.id;
    const isAdmin = user?.tipo === TipoUsuario.ADMIN;
    if (!isOwner && !isAdmin) {
      throw new ForbiddenException("Você não pode editar este palpite");
    }

    const targetJogoId = updatePalpiteDto.jogoId ?? palpite.jogoId;
    const jogo = await this.getJogo(targetJogoId);

    if (targetJogoId !== palpite.jogoId) {
      const duplicate = await this.prisma.palpite.findUnique({
        where: {
          unique_palpite_usuario_jogo: {
            jogoId: targetJogoId,
            usuarioId: palpite.usuarioId,
          },
        },
      });

      if (duplicate) {
        throw new BadRequestException(
          "Já existe um palpite deste usuário para o jogo selecionado",
        );
      }
    }

    if (!isAdmin || !forceAdmin) {
      this.assertCanEdit(user, jogo);
    }

    this.requirePenaltisIfNeeded(
      jogo.mataMata,
      updatePalpiteDto.vencedorPenaltis ?? palpite.vencedorPenaltis,
    );

    const updated = await this.prisma.palpite.update({
      where: { id },
      data: {
        jogoId: targetJogoId,
        golsCasa: updatePalpiteDto.golsCasa ?? palpite.golsCasa,
        golsFora: updatePalpiteDto.golsFora ?? palpite.golsFora,
        vencedorPenaltis:
          updatePalpiteDto.vencedorPenaltis ?? palpite.vencedorPenaltis,
      },
    });

    if (isAdmin && forceAdmin && jogo.status === StatusJogo.ENCERRADO) {
      await this.jogosService.recalcularPontuacao(targetJogoId);
    }

    return updated;
  }

  async findByJogo(jogoId: string, user: any) {
    const jogo = await this.prisma.jogo.findUnique({
      where: { id: jogoId },
      select: { id: true, status: true },
    });

    if (!jogo) {
      throw new NotFoundException("Jogo não encontrado");
    }

    const isAdmin = user?.tipo === TipoUsuario.ADMIN;
    const revelado = jogo.status !== StatusJogo.PALPITES;

    const where =
      revelado || isAdmin ? { jogoId } : { jogoId, usuarioId: user.id };

    const palpites = await this.prisma.palpite.findMany({
      where,
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        jogoId: true,
        usuarioId: true,
        golsCasa: true,
        golsFora: true,
        vencedorPenaltis: true,
        pontuacao: true,
        createdAt: true,
        usuario: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });

    return palpites;
  }
}
