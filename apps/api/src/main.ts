import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const envOrigins =
    process.env.CORS_ORIGINS?.split(",")
      .map((o) => o.trim())
      .filter(Boolean) || [];

  const allowedOrigins = [
    "http://localhost:3000",
    /\.trycloudflare\.com$/,
    ...envOrigins,
  ];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  });

  app.setGlobalPrefix("api");

  const port = process.env.API_PORT || 3001;
  await app.listen(port, "0.0.0.0");

  console.log(`🚀 API rodando em http://localhost:${port}/api`);
}

bootstrap();
