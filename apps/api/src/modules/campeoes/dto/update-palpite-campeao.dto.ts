import { IsOptional, IsUUID } from "class-validator";

export class UpdatePalpiteCampeaoDto {
  @IsOptional()
  @IsUUID()
  campeaoId?: string;

  @IsOptional()
  @IsUUID()
  timeId?: string;
}
