-- Adiciona tabela de relação N:N entre bolões e rodadas
CREATE TABLE "bolao_rodadas" (
    "bolao_id" UUID NOT NULL,
    "rodada_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pk_bolao_rodada" PRIMARY KEY ("bolao_id", "rodada_id")
);

ALTER TABLE "bolao_rodadas" ADD CONSTRAINT "bolao_rodadas_bolao_id_fkey" FOREIGN KEY ("bolao_id") REFERENCES "boloes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bolao_rodadas" ADD CONSTRAINT "bolao_rodadas_rodada_id_fkey" FOREIGN KEY ("rodada_id") REFERENCES "rodadas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "bolao_rodadas_bolao_id_idx" ON "bolao_rodadas"("bolao_id");
CREATE INDEX "bolao_rodadas_rodada_id_idx" ON "bolao_rodadas"("rodada_id");

-- Vincula automaticamente combinações já existentes em jogos
INSERT INTO "bolao_rodadas" ("bolao_id", "rodada_id")
SELECT DISTINCT j."bolao_id", j."rodada_id"
FROM "jogos" j
LEFT JOIN "bolao_rodadas" br ON br."bolao_id" = j."bolao_id" AND br."rodada_id" = j."rodada_id"
WHERE br."bolao_id" IS NULL;
