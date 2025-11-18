BEGIN;

-- 1) Criar tabela de cômodos
CREATE TABLE IF NOT EXISTS comodos (
  id BIGSERIAL PRIMARY KEY,
  residencia_id BIGINT NOT NULL,
  nome VARCHAR(150) NOT NULL,
  imagem VARCHAR(150),
  data_criacao TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_comodos_residencia FOREIGN KEY (residencia_id)
    REFERENCES residencias (id) ON DELETE CASCADE
);

-- Evita duplicação do mesmo nome por residência
CREATE UNIQUE INDEX IF NOT EXISTS uq_comodos_residencia_nome
  ON comodos (residencia_id, nome);

CREATE INDEX IF NOT EXISTS idx_comodos_residencia ON comodos (residencia_id);

-- 2) Adicionar coluna em aparelhos (se ainda não existir)
ALTER TABLE aparelhos
  ADD COLUMN IF NOT EXISTS comodo_id BIGINT;

-- 3) Criar FK para o novo comodo (permite null; ao deletar comodo, aparelho fica sem comodo)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_aparelhos_comodo') THEN
    ALTER TABLE aparelhos
      ADD CONSTRAINT fk_aparelhos_comodo
      FOREIGN KEY (comodo_id) REFERENCES comodos (id) ON DELETE SET NULL;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_aparelhos_comodo') THEN
    EXECUTE 'CREATE INDEX idx_aparelhos_comodo ON aparelhos (comodo_id)';
  END IF;
END
$$;

-- 4) Inserir um comodo padrão 'Sem cômodo' para cada residência (não duplicará)
INSERT INTO comodos (residencia_id, nome)
SELECT id, 'Sem cômodo' FROM residencias
ON CONFLICT (residencia_id, nome) DO NOTHING;

-- 5) Atualizar aparelhos existentes para apontar ao comodo padrão da sua residência
UPDATE aparelhos a
SET comodo_id = c.id
FROM comodos c
WHERE a.residencia_id = c.residencia_id AND c.nome = 'Sem cômodo'
  AND a.comodo_id IS NULL;

COMMIT;
