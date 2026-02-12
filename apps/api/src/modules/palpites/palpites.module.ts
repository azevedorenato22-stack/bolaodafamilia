import { Module, forwardRef } from "@nestjs/common";
import { PalpitesService } from "./palpites.service";
import { PalpitesController } from "./palpites.controller";
import { PrismaModule } from "../../prisma/prisma.module";
import { JogosModule } from "../jogos/jogos.module";

@Module({
  imports: [PrismaModule, JogosModule],
  controllers: [PalpitesController],
  providers: [PalpitesService],
  exports: [PalpitesService],
})
export class PalpitesModule { }
