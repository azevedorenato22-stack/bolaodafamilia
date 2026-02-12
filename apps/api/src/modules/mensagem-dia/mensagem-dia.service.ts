import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateMensagemDiaDto } from "./dto/create-mensagem-dia.dto";

@Injectable()
export class MensagemDiaService {
  constructor(private prisma: PrismaService) { }

  private parseDate(date?: string) {
    if (!date) return undefined;
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException("Data inválida");
    }
    return parsed;
  }

  /**
   * Cria uma nova mensagem.
   */
  async create(dto: CreateMensagemDiaDto, userId?: string) {
    const dataInicio = this.parseDate(dto.dataInicio);
    const dataFim = this.parseDate(dto.dataFim);

    if (dataInicio && dataFim && dataFim <= dataInicio) {
      throw new BadRequestException("dataFim deve ser posterior a dataInicio");
    }

    // Normalizar tipo para maiúsculo
    const tipo = dto.tipo?.toUpperCase() || "GERAL";

    // Se for do tipo PATO, LIDER ou DESTAQUE, talvez queiramos desativar anteriores do mesmo tipo?
    if (["PATO", "LIDER", "DESTAQUE"].includes(tipo)) {
      await this.prisma.mensagemDia.updateMany({
        where: { tipo, ativo: true },
        data: { ativo: false },
      });
    }

    const mensagem = await this.prisma.mensagemDia.create({
      data: {
        titulo: dto.titulo ?? null,
        conteudo: dto.conteudo,
        tipo,
        dataInicio: dataInicio ?? null,
        dataFim: dataFim ?? null,
        ativo: dto.ativo ?? true,
      },
    });

    return mensagem;
  }

  /**
   * Lista todas as mensagens (para admin)
   */
  async findAll() {
    return this.prisma.mensagemDia.findMany({
      orderBy: { createdAt: "desc" },
      // include: { criadoPor: { select: { nome: true } } }
    });
  }

  /**
   * Busca todas as mensagens ativas para exibição pública (Pato, Líder, Destaque, Geral)
   */
  async findAllActive() {
    const now = new Date();
    return this.prisma.mensagemDia.findMany({
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

  async update(id: string, dto: CreateMensagemDiaDto) {
    return this.prisma.mensagemDia.update({
      where: { id },
      data: {
        titulo: dto.titulo,
        conteudo: dto.conteudo,
        tipo: dto.tipo,
        ativo: dto.ativo,
        dataInicio: this.parseDate(dto.dataInicio),
        dataFim: this.parseDate(dto.dataFim),
      }
    });
  }

  async remove(id: string) {
    await this.prisma.mensagemDia.delete({ where: { id } });
    return { message: "Mensagem removida" };
  }
}
