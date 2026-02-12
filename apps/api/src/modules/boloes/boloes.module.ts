import { Module } from "@nestjs/common";
import { BoloesService } from "./boloes.service";
import { BoloesController } from "./boloes.controller";
import { PrismaModule } from "../../prisma/prisma.module";
import { JogosModule } from "../jogos/jogos.module";

@Module({
  imports: [PrismaModule, JogosModule],
  controllers: [BoloesController],
  providers: [BoloesService],
  exports: [BoloesService],
})
export class BoloesModule { }
