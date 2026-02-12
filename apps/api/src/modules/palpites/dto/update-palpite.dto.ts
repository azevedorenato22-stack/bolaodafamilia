import { IsEnum, IsInt, IsOptional, IsUUID, Min } from "class-validator";
import { VencedorPenaltis } from "@prisma/client";
import { Type } from "class-transformer";

export class UpdatePalpiteDto {
  @IsOptional()
  @IsUUID()
  jogoId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  golsCasa?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  golsFora?: number;

  @IsOptional()
  @IsEnum(VencedorPenaltis)
  vencedorPenaltis?: VencedorPenaltis | null;
}
