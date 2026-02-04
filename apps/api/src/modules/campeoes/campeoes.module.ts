import { Module } from "@nestjs/common";
import { CampeoesService } from "./campeoes.service";
import { CampeoesController } from "./campeoes.controller";
import { PrismaModule } from "../../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [CampeoesController],
  providers: [CampeoesService],
  exports: [CampeoesService],
})
export class CampeoesModule {}
