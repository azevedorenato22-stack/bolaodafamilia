-- AlterTable
ALTER TABLE "usuarios"
ADD COLUMN "usuario" VARCHAR(100);

-- Preencher usuários existentes reutilizando o email como identificador de login
UPDATE "usuarios"
SET "usuario" = "email"
WHERE "usuario" IS NULL;

-- Tornar obrigatório após popular
ALTER TABLE "usuarios"
ALTER COLUMN "usuario" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_usuario_key" ON "usuarios"("usuario");

-- CreateIndex
CREATE INDEX "usuarios_usuario_idx" ON "usuarios"("usuario");
