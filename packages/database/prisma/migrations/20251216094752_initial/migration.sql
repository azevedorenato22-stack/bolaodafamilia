-- CreateEnum
CREATE TYPE "TipoUsuario" AS ENUM ('ADMIN', 'USUARIO');

-- CreateEnum
CREATE TYPE "StatusJogo" AS ENUM ('PALPITES', 'EM_ANDAMENTO', 'ENCERRADO');

-- CreateEnum
CREATE TYPE "VencedorPenaltis" AS ENUM ('CASA', 'FORA');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" UUID NOT NULL,
    "nome" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "senha" VARCHAR(255) NOT NULL,
    "tipo" "TipoUsuario" NOT NULL DEFAULT 'USUARIO',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boloes" (
    "id" UUID NOT NULL,
    "nome" VARCHAR(255) NOT NULL,
    "descricao" TEXT,
    "data_final" TIMESTAMPTZ(3) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "pts_resultado_exato" SMALLINT NOT NULL DEFAULT 10,
    "pts_vencedor_gols" SMALLINT NOT NULL DEFAULT 6,
    "pts_vencedor" SMALLINT NOT NULL DEFAULT 3,
    "pts_gols_time" SMALLINT NOT NULL DEFAULT 2,
    "pts_campeao" SMALLINT NOT NULL DEFAULT 20,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "boloes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "times" (
    "id" UUID NOT NULL,
    "nome" VARCHAR(255) NOT NULL,
    "categoria" VARCHAR(100) NOT NULL,
    "escudo_url" VARCHAR(500),
    "sigla" VARCHAR(10),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "times_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bolao_times" (
    "bolao_id" UUID NOT NULL,
    "time_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bolao_times_pkey" PRIMARY KEY ("bolao_id","time_id")
);

-- CreateTable
CREATE TABLE "rodadas" (
    "id" UUID NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "numero_ordem" SMALLINT,
    "descricao" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "rodadas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jogos" (
    "id" UUID NOT NULL,
    "bolao_id" UUID NOT NULL,
    "rodada_id" UUID NOT NULL,
    "time_casa_id" UUID NOT NULL,
    "time_fora_id" UUID NOT NULL,
    "data_hora" TIMESTAMPTZ(3) NOT NULL,
    "local" VARCHAR(255),
    "status" "StatusJogo" NOT NULL DEFAULT 'PALPITES',
    "mata_mata" BOOLEAN NOT NULL DEFAULT false,
    "resultado_casa" SMALLINT,
    "resultado_fora" SMALLINT,
    "vencedor_penaltis" "VencedorPenaltis",
    "encerrado_em" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "jogos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "palpites" (
    "id" UUID NOT NULL,
    "jogo_id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "gols_casa" SMALLINT NOT NULL,
    "gols_fora" SMALLINT NOT NULL,
    "vencedor_penaltis" "VencedorPenaltis",
    "pontuacao" SMALLINT NOT NULL DEFAULT 0,
    "calculado_em" TIMESTAMPTZ(3),
    "tipo_pontuacao" VARCHAR(50),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "palpites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campeoes" (
    "id" UUID NOT NULL,
    "bolao_id" UUID NOT NULL,
    "nome" VARCHAR(255) NOT NULL,
    "descricao" TEXT,
    "data_limite" TIMESTAMPTZ(3) NOT NULL,
    "resultado_final_id" UUID,
    "pontuacao" SMALLINT,
    "definido_em" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "campeoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "palpites_campeao" (
    "id" UUID NOT NULL,
    "campeao_id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "time_escolhido_id" UUID NOT NULL,
    "pontuacao" SMALLINT NOT NULL DEFAULT 0,
    "calculado_em" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "palpites_campeao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mensagens_dia" (
    "id" UUID NOT NULL,
    "titulo" VARCHAR(255),
    "conteudo" TEXT NOT NULL,
    "tipo" VARCHAR(50) NOT NULL DEFAULT 'info',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "data_inicio" TIMESTAMPTZ(3),
    "data_fim" TIMESTAMPTZ(3),
    "criado_por" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "mensagens_dia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "usuarios_email_idx" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "usuarios_tipo_idx" ON "usuarios"("tipo");

-- CreateIndex
CREATE INDEX "usuarios_ativo_idx" ON "usuarios"("ativo");

-- CreateIndex
CREATE INDEX "usuarios_created_at_idx" ON "usuarios"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "boloes_nome_key" ON "boloes"("nome");

-- CreateIndex
CREATE INDEX "boloes_ativo_idx" ON "boloes"("ativo");

-- CreateIndex
CREATE INDEX "boloes_data_final_idx" ON "boloes"("data_final");

-- CreateIndex
CREATE INDEX "boloes_nome_idx" ON "boloes"("nome");

-- CreateIndex
CREATE INDEX "boloes_created_at_idx" ON "boloes"("created_at");

-- CreateIndex
CREATE INDEX "times_nome_idx" ON "times"("nome");

-- CreateIndex
CREATE INDEX "times_categoria_idx" ON "times"("categoria");

-- CreateIndex
CREATE INDEX "times_sigla_idx" ON "times"("sigla");

-- CreateIndex
CREATE UNIQUE INDEX "times_nome_categoria_key" ON "times"("nome", "categoria");

-- CreateIndex
CREATE INDEX "bolao_times_time_id_idx" ON "bolao_times"("time_id");

-- CreateIndex
CREATE INDEX "bolao_times_bolao_id_idx" ON "bolao_times"("bolao_id");

-- CreateIndex
CREATE UNIQUE INDEX "rodadas_nome_key" ON "rodadas"("nome");

-- CreateIndex
CREATE INDEX "rodadas_nome_idx" ON "rodadas"("nome");

-- CreateIndex
CREATE INDEX "rodadas_numero_ordem_idx" ON "rodadas"("numero_ordem");

-- CreateIndex
CREATE INDEX "jogos_bolao_id_data_hora_idx" ON "jogos"("bolao_id", "data_hora");

-- CreateIndex
CREATE INDEX "jogos_bolao_id_rodada_id_idx" ON "jogos"("bolao_id", "rodada_id");

-- CreateIndex
CREATE INDEX "jogos_bolao_id_status_idx" ON "jogos"("bolao_id", "status");

-- CreateIndex
CREATE INDEX "jogos_rodada_id_idx" ON "jogos"("rodada_id");

-- CreateIndex
CREATE INDEX "jogos_data_hora_idx" ON "jogos"("data_hora");

-- CreateIndex
CREATE INDEX "jogos_status_idx" ON "jogos"("status");

-- CreateIndex
CREATE INDEX "jogos_time_casa_id_idx" ON "jogos"("time_casa_id");

-- CreateIndex
CREATE INDEX "jogos_time_fora_id_idx" ON "jogos"("time_fora_id");

-- CreateIndex
CREATE INDEX "palpites_usuario_id_pontuacao_idx" ON "palpites"("usuario_id", "pontuacao");

-- CreateIndex
CREATE INDEX "palpites_jogo_id_pontuacao_idx" ON "palpites"("jogo_id", "pontuacao");

-- CreateIndex
CREATE INDEX "palpites_usuario_id_idx" ON "palpites"("usuario_id");

-- CreateIndex
CREATE INDEX "palpites_jogo_id_idx" ON "palpites"("jogo_id");

-- CreateIndex
CREATE INDEX "palpites_pontuacao_idx" ON "palpites"("pontuacao");

-- CreateIndex
CREATE INDEX "palpites_calculado_em_idx" ON "palpites"("calculado_em");

-- CreateIndex
CREATE UNIQUE INDEX "palpites_jogo_id_usuario_id_key" ON "palpites"("jogo_id", "usuario_id");

-- CreateIndex
CREATE INDEX "campeoes_bolao_id_idx" ON "campeoes"("bolao_id");

-- CreateIndex
CREATE INDEX "campeoes_data_limite_idx" ON "campeoes"("data_limite");

-- CreateIndex
CREATE INDEX "campeoes_resultado_final_id_idx" ON "campeoes"("resultado_final_id");

-- CreateIndex
CREATE UNIQUE INDEX "campeoes_bolao_id_nome_key" ON "campeoes"("bolao_id", "nome");

-- CreateIndex
CREATE INDEX "palpites_campeao_usuario_id_idx" ON "palpites_campeao"("usuario_id");

-- CreateIndex
CREATE INDEX "palpites_campeao_campeao_id_idx" ON "palpites_campeao"("campeao_id");

-- CreateIndex
CREATE INDEX "palpites_campeao_time_escolhido_id_idx" ON "palpites_campeao"("time_escolhido_id");

-- CreateIndex
CREATE INDEX "palpites_campeao_pontuacao_idx" ON "palpites_campeao"("pontuacao");

-- CreateIndex
CREATE UNIQUE INDEX "palpites_campeao_campeao_id_usuario_id_key" ON "palpites_campeao"("campeao_id", "usuario_id");

-- CreateIndex
CREATE INDEX "mensagens_dia_ativo_idx" ON "mensagens_dia"("ativo");

-- CreateIndex
CREATE INDEX "mensagens_dia_data_inicio_data_fim_idx" ON "mensagens_dia"("data_inicio", "data_fim");

-- CreateIndex
CREATE INDEX "mensagens_dia_tipo_idx" ON "mensagens_dia"("tipo");

-- CreateIndex
CREATE INDEX "mensagens_dia_created_at_idx" ON "mensagens_dia"("created_at");

-- AddForeignKey
ALTER TABLE "bolao_times" ADD CONSTRAINT "bolao_times_bolao_id_fkey" FOREIGN KEY ("bolao_id") REFERENCES "boloes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bolao_times" ADD CONSTRAINT "bolao_times_time_id_fkey" FOREIGN KEY ("time_id") REFERENCES "times"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jogos" ADD CONSTRAINT "jogos_bolao_id_fkey" FOREIGN KEY ("bolao_id") REFERENCES "boloes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jogos" ADD CONSTRAINT "jogos_rodada_id_fkey" FOREIGN KEY ("rodada_id") REFERENCES "rodadas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jogos" ADD CONSTRAINT "jogos_time_casa_id_fkey" FOREIGN KEY ("time_casa_id") REFERENCES "times"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jogos" ADD CONSTRAINT "jogos_time_fora_id_fkey" FOREIGN KEY ("time_fora_id") REFERENCES "times"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "palpites" ADD CONSTRAINT "palpites_jogo_id_fkey" FOREIGN KEY ("jogo_id") REFERENCES "jogos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "palpites" ADD CONSTRAINT "palpites_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campeoes" ADD CONSTRAINT "campeoes_bolao_id_fkey" FOREIGN KEY ("bolao_id") REFERENCES "boloes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campeoes" ADD CONSTRAINT "campeoes_resultado_final_id_fkey" FOREIGN KEY ("resultado_final_id") REFERENCES "times"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "palpites_campeao" ADD CONSTRAINT "palpites_campeao_campeao_id_fkey" FOREIGN KEY ("campeao_id") REFERENCES "campeoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "palpites_campeao" ADD CONSTRAINT "palpites_campeao_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "palpites_campeao" ADD CONSTRAINT "palpites_campeao_time_escolhido_id_fkey" FOREIGN KEY ("time_escolhido_id") REFERENCES "times"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
