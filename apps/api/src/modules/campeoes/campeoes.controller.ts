import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { CampeoesService } from "./campeoes.service";
import { CreateCampeaoDto } from "./dto/create-campeao.dto";
import { UpdateCampeaoDto } from "./dto/update-campeao.dto";
import { CreatePalpiteCampeaoDto } from "./dto/create-palpite-campeao.dto";
import { UpdatePalpiteCampeaoDto } from "./dto/update-palpite-campeao.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { TipoUsuario } from "@prisma/client";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@Controller("campeoes")
@UseGuards(JwtAuthGuard, RolesGuard)
export class CampeoesController {
  constructor(private readonly campeoesService: CampeoesService) {}

  // CAMPEÕES (ADMIN)
  @Post()
  @Roles(TipoUsuario.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateCampeaoDto) {
    return this.campeoesService.create(dto);
  }

  @Get("bolao/:bolaoId")
  findAll(@Param("bolaoId") bolaoId: string) {
    return this.campeoesService.findAllByBolao(bolaoId);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.campeoesService.findById(id);
  }

  @Patch(":id")
  @Roles(TipoUsuario.ADMIN)
  update(@Param("id") id: string, @Body() dto: UpdateCampeaoDto) {
    return this.campeoesService.update(id, dto);
  }

  @Delete(":id")
  @Roles(TipoUsuario.ADMIN)
  @HttpCode(HttpStatus.OK)
  remove(@Param("id") id: string, @Query("senha") senha?: string) {
    return this.campeoesService.remove(id, senha);
  }

  // PALPITES DE CAMPEÃO
  @Post("palpites")
  @HttpCode(HttpStatus.CREATED)
  criarPalpite(@Body() dto: CreatePalpiteCampeaoDto, @CurrentUser() user: any) {
    return this.campeoesService.criarPalpite(user, dto);
  }

  @Patch("palpites/:id")
  atualizarPalpite(
    @Param("id") id: string,
    @Body() dto: UpdatePalpiteCampeaoDto,
    @CurrentUser() user: any,
  ) {
    return this.campeoesService.atualizarPalpite(id, user, dto);
  }

  @Patch("palpites/:id/admin")
  @Roles(TipoUsuario.ADMIN)
  atualizarPalpiteAdmin(
    @Param("id") id: string,
    @Body() dto: UpdatePalpiteCampeaoDto,
    @CurrentUser() user: any,
  ) {
    return this.campeoesService.atualizarPalpite(id, user, dto, true);
  }

  @Get(":id/palpites")
  listarPalpites(@Param("id") campeaoId: string, @CurrentUser() user: any) {
    return this.campeoesService.listarPalpites(campeaoId, user);
  }
}
