import { Module } from "@nestjs/common";
import { RodadasService } from "./rodadas.service";
import { RodadasController } from "./rodadas.controller";
import { PrismaModule } from "../../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [RodadasController],
  providers: [RodadasService],
  exports: [RodadasService],
})
export class RodadasModule {}
