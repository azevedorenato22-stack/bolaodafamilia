import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsUrl,
} from "class-validator";
import { Transform } from "class-transformer";

export class CreateTimeDto {
  @IsString()
  @IsNotEmpty({ message: "Nome é obrigatório" })
  @MaxLength(255, { message: "Nome deve ter no máximo 255 caracteres" })
  nome: string;

  @IsString()
  @IsNotEmpty({ message: "Categoria é obrigatória" })
  @MaxLength(100, { message: "Categoria deve ter no máximo 100 caracteres" })
  categoria: string;

  @IsOptional()
  @IsString()
  @MaxLength(10, { message: "Sigla deve ter no máximo 10 caracteres" })
  @Transform(({ value }) => (value === "" ? undefined : value))
  sigla?: string;

  @IsOptional()
  @IsUrl({}, { message: "URL do escudo inválida" })
  @MaxLength(500, {
    message: "URL do escudo deve ter no máximo 500 caracteres",
  })
  @Transform(({ value }) => (value === "" ? undefined : value))
  escudoUrl?: string;
}
