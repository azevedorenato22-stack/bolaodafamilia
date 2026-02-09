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

    // Se for do tipo PATO, LIDER ou DESTAQUE, talvez queiramos desativar anteriores do mesmo tipo?
    // Por enquanto, vamos permitir múltiplas e o frontend decide ou o admin gerencia.
    // Mas para simplificar a vida do admin, se criar um novo "PATO", desativa o anterior.
    if (dto.tipo && ["PATO", "LIDER", "DESTAQUE"].includes(dto.tipo)) {
      await this.prisma.mensagemDia.updateMany({
        where: { tipo: dto.tipo, ativo: true },
        data: { ativo: false },
      });
    }

    const mensagem = await this.prisma.mensagemDia.create({
      data: {
        titulo: dto.titulo ?? null,
        conteudo: dto.conteudo,
        tipo: dto.tipo ?? "HOME",
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
   * Busca a mensagem ativa mais recente para exibição pública
   */
  async findActive() {
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
