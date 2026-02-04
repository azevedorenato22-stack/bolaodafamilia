import { IsArray, IsUUID, ArrayMinSize } from "class-validator";

export class AddTimesBolaoDto {
  @IsArray({ message: "Times deve ser um array" })
  @ArrayMinSize(1, { message: "Pelo menos um time deve ser informado" })
  @IsUUID("4", { each: true, message: "ID de time inválido" })
  timeIds: string[];
}
