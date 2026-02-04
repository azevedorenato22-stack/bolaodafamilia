-- Adiciona coluna de pontuação de pênaltis por bolão
ALTER TABLE "boloes" ADD COLUMN "pts_penaltis" SMALLINT NOT NULL DEFAULT 1;
