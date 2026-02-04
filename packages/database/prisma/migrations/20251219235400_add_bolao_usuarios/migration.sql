-- Adiciona tabela de relação N:N entre bolões e usuários (participantes)
CREATE TABLE "bolao_usuarios" (
    "bolao_id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pk_bolao_usuario" PRIMARY KEY ("bolao_id", "usuario_id")
);

ALTER TABLE "bolao_usuarios" ADD CONSTRAINT "bolao_usuarios_bolao_id_fkey" FOREIGN KEY ("bolao_id") REFERENCES "boloes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bolao_usuarios" ADD CONSTRAINT "bolao_usuarios_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "bolao_usuarios_bolao_id_idx" ON "bolao_usuarios"("bolao_id");
CREATE INDEX "bolao_usuarios_usuario_id_idx" ON "bolao_usuarios"("usuario_id");

-- Backfill: vincula participantes que já possuem palpites de jogos/campeões no bolão
INSERT INTO "bolao_usuarios" ("bolao_id", "usuario_id")
SELECT DISTINCT j."bolao_id", p."usuario_id"
FROM "palpites" p
JOIN "jogos" j ON j."id" = p."jogo_id"
ON CONFLICT DO NOTHING;

INSERT INTO "bolao_usuarios" ("bolao_id", "usuario_id")
SELECT DISTINCT c."bolao_id", pc."usuario_id"
FROM "palpites_campeao" pc
JOIN "campeoes" c ON c."id" = pc."campeao_id"
ON CONFLICT DO NOTHING;
