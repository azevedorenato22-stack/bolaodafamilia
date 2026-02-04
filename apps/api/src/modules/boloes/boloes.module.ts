import { Module } from "@nestjs/common";
import { BoloesService } from "./boloes.service";
import { BoloesController } from "./boloes.controller";
import { PrismaModule } from "../../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [BoloesController],
  providers: [BoloesService],
  exports: [BoloesService],
})
export class BoloesModule {}
