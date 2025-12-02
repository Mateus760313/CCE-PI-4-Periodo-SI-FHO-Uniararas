-- Adiciona a coluna fator_uso na tabela aparelhos
ALTER TABLE aparelhos ADD COLUMN fator_uso DECIMAL(4,2) DEFAULT 1.00;

-- Atualiza os registros existentes para garantir que tenham o valor padrão
UPDATE aparelhos SET fator_uso = 1.00 WHERE fator_uso IS NULL;

-- Opcional: Ajustar fator_uso para Geladeiras e Freezers antigos para 0.50
UPDATE aparelhos 
SET fator_uso = 0.50 
WHERE nome ILIKE '%geladeira%' OR nome ILIKE '%freezer%';

-- Estrutura final esperada da tabela aparelhos:
-- id (SERIAL)
-- residencia_id (INT)
-- usuario_id (INT)
-- comodo_id (INT)
-- nome (VARCHAR)
-- potencia_watts (INT)
-- horas_uso (DECIMAL)
-- fator_uso (DECIMAL) -- NOVA COLUNA
-- data_criacao (TIMESTAMP)
