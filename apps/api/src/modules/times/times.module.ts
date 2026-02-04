import { Module } from "@nestjs/common";
import { TimesService } from "./times.service";
import { TimesController } from "./times.controller";
import { PrismaModule } from "../../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [TimesController],
  providers: [TimesService],
  exports: [TimesService],
})
export class TimesModule {}
