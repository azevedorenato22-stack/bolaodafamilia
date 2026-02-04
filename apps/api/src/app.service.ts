import { Injectable } from "@nestjs/common";

@Injectable()
export class AppService {
  getHello(): { message: string; version: string; timestamp: string } {
    return {
      message: "Bem-vindo à API do Bolão do Chuveiro Ligado! ⚽",
      version: "0.1.0",
      timestamp: new Date().toISOString(),
    };
  }
}
