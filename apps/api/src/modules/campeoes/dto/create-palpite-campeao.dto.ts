import { IsUUID } from "class-validator";

export class CreatePalpiteCampeaoDto {
  @IsUUID()
  campeaoId: string;

  @IsUUID()
  timeId: string;
}
