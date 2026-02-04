import { Module } from "@nestjs/common";
import { MensagemDiaService } from "./mensagem-dia.service";
import { MensagemDiaController } from "./mensagem-dia.controller";
import { PrismaModule } from "../../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [MensagemDiaController],
  providers: [MensagemDiaService],
  exports: [MensagemDiaService],
})
export class MensagemDiaModule {}
