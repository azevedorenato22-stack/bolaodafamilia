import { Module } from "@nestjs/common";
import { PalpitesService } from "./palpites.service";
import { PalpitesController } from "./palpites.controller";
import { PrismaModule } from "../../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [PalpitesController],
  providers: [PalpitesService],
  exports: [PalpitesService],
})
export class PalpitesModule {}
