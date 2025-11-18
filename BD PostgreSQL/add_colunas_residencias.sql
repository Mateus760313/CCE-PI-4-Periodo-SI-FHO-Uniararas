-- Adiciona as colunas 'cidade' e 'tarifa_kwh' à tabela residencias
ALTER TABLE residencias
  ADD COLUMN IF NOT EXISTS cidade VARCHAR(100),
  ADD COLUMN IF NOT EXISTS tarifa_kwh NUMERIC(10,2);

-- Opcional: define valor padrão para tarifa_kwh
-- ALTER TABLE residencias ALTER COLUMN tarifa_kwh SET DEFAULT 0.00;

-- Opcional: preenche tarifa_kwh com valor padrão para registros existentes
-- UPDATE residencias SET tarifa_kwh = 0.00 WHERE tarifa_kwh IS NULL;
