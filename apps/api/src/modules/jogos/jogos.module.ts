import { Module } from "@nestjs/common";
import { JogosService } from "./jogos.service";
import { JogosController } from "./jogos.controller";
import { PrismaModule } from "../../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [JogosController],
  providers: [JogosService],
  exports: [JogosService],
})
export class JogosModule {}
