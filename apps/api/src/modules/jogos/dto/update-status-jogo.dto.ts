import { IsEnum } from "class-validator";
import { StatusJogo } from "@prisma/client";

export class UpdateStatusJogoDto {
  @IsEnum(StatusJogo)
  status: StatusJogo;
}
