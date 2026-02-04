import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateMensagemDiaDto } from "./dto/create-mensagem-dia.dto";

@Injectable()
export class MensagemDiaService {
  constructor(private prisma: PrismaService) {}

  private parseDate(date?: string) {
    if (!date) return undefined;
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException("Data inválida");
    }
    return parsed;
  }

  /**
   * Cria/atualiza a mensagem do dia removendo histórico anterior.
   */
  async upsert(dto: CreateMensagemDiaDto, userId?: string) {
    const dataInicio = this.parseDate(dto.dataInicio);
    const dataFim = this.parseDate(dto.dataFim);

    if (dataInicio && dataFim && dataFim <= dataInicio) {
      throw new BadRequestException("dataFim deve ser posterior a dataInicio");
    }

    // Sem histórico: remove mensagens existentes antes de criar a nova
    await this.prisma.mensagemDia.deleteMany({});

    const mensagem = await this.prisma.mensagemDia.create({
      data: {
        titulo: dto.titulo,
        conteudo: dto.conteudo,
        tipo: dto.tipo ?? "info",
        dataInicio,
        dataFim,
        ativo: dto.ativo ?? true,
        criadoPor: userId,
      },
    });

    return mensagem;
  }

  async getAtual() {
    const now = new Date();
    return this.prisma.mensagemDia.findFirst({
      where: {
        ativo: true,
        AND: [
          {
            OR: [{ dataInicio: null }, { dataInicio: { lte: now } }],
          },
          {
            OR: [{ dataFim: null }, { dataFim: { gte: now } }],
          },
        ],
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async remove() {
    await this.prisma.mensagemDia.deleteMany({});
    return { message: "Mensagem do dia removida" };
  }
}
