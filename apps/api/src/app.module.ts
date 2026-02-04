import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { BoloesModule } from "./modules/boloes/boloes.module";
import { TimesModule } from "./modules/times/times.module";
import { RodadasModule } from "./modules/rodadas/rodadas.module";
import { JogosModule } from "./modules/jogos/jogos.module";
import { PalpitesModule } from "./modules/palpites/palpites.module";
import { CampeoesModule } from "./modules/campeoes/campeoes.module";
import { RankingModule } from "./modules/ranking/ranking.module";
import { MensagemDiaModule } from "./modules/mensagem-dia/mensagem-dia.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: "../../.env",
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    BoloesModule,
    TimesModule,
    RodadasModule,
    JogosModule,
    PalpitesModule,
    CampeoesModule,
    RankingModule,
    MensagemDiaModule,
    // Módulos a serem implementados:
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
