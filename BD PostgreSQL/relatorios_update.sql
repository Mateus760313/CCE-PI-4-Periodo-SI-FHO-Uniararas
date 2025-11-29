-- ============================================
-- ATUALIZAÇÃO DO BANCO DE DADOS PARA RELATÓRIOS AVANÇADOS
-- CCE - Controle de Consumo Energético
-- ============================================

-- 1. TABELA DE METAS DE CONSUMO
-- Armazena as metas mensais de gasto definidas pelo usuário
CREATE TABLE IF NOT EXISTS metas_consumo (
    id BIGSERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    residencia_id BIGINT REFERENCES residencias(id) ON DELETE CASCADE,
    valor_meta NUMERIC(10, 2) NOT NULL,
    mes_referencia DATE NOT NULL, -- Primeiro dia do mês de referência
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ativa BOOLEAN DEFAULT TRUE,
    CONSTRAINT metas_valor_positivo CHECK (valor_meta > 0)
);

CREATE INDEX idx_metas_usuario ON metas_consumo (usuario_id);
CREATE INDEX idx_metas_residencia ON metas_consumo (residencia_id);
CREATE INDEX idx_metas_mes ON metas_consumo (mes_referencia);

-- 2. TABELA DE HISTÓRICO DE CONSUMO DIÁRIO
-- Registra o consumo diário para análises evolutivas
CREATE TABLE IF NOT EXISTS historico_consumo (
    id BIGSERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    residencia_id BIGINT NOT NULL REFERENCES residencias(id) ON DELETE CASCADE,
    aparelho_id BIGINT REFERENCES aparelhos(id) ON DELETE SET NULL,
    data_registro DATE NOT NULL,
    consumo_kwh NUMERIC(10, 4) NOT NULL,
    custo_estimado NUMERIC(10, 2),
    tarifa_aplicada NUMERIC(10, 4),
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT historico_consumo_positivo CHECK (consumo_kwh >= 0)
);

CREATE INDEX idx_historico_usuario ON historico_consumo (usuario_id);
CREATE INDEX idx_historico_residencia ON historico_consumo (residencia_id);
CREATE INDEX idx_historico_aparelho ON historico_consumo (aparelho_id);
CREATE INDEX idx_historico_data ON historico_consumo (data_registro);
CREATE INDEX idx_historico_mes ON historico_consumo (DATE_TRUNC('month', data_registro));

-- 3. TABELA DE SNAPSHOTS MENSAIS
-- Armazena resumo mensal para comparações históricas rápidas
CREATE TABLE IF NOT EXISTS snapshots_mensais (
    id BIGSERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    residencia_id BIGINT NOT NULL REFERENCES residencias(id) ON DELETE CASCADE,
    mes_referencia DATE NOT NULL, -- Primeiro dia do mês
    total_kwh NUMERIC(10, 4) NOT NULL,
    total_custo NUMERIC(10, 2) NOT NULL,
    tarifa_media NUMERIC(10, 4),
    qtd_aparelhos INTEGER,
    aparelho_maior_consumo VARCHAR(150),
    consumo_maior_aparelho NUMERIC(10, 4),
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(residencia_id, mes_referencia)
);

CREATE INDEX idx_snapshots_usuario ON snapshots_mensais (usuario_id);
CREATE INDEX idx_snapshots_residencia ON snapshots_mensais (residencia_id);
CREATE INDEX idx_snapshots_mes ON snapshots_mensais (mes_referencia);

-- 4. TABELA DE LOG DE ALTERAÇÕES DE APARELHOS
-- Registra quando aparelhos são adicionados/removidos para análise de impacto
CREATE TABLE IF NOT EXISTS log_aparelhos (
    id BIGSERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    residencia_id BIGINT NOT NULL REFERENCES residencias(id) ON DELETE CASCADE,
    aparelho_id BIGINT, -- Pode ser NULL se aparelho foi deletado
    nome_aparelho VARCHAR(150) NOT NULL,
    potencia_watts INTEGER NOT NULL,
    horas_uso DOUBLE PRECISION,
    acao VARCHAR(20) NOT NULL, -- 'ADICIONADO', 'REMOVIDO', 'ALTERADO'
    consumo_estimado_kwh NUMERIC(10, 4),
    data_acao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    observacao TEXT
);

CREATE INDEX idx_log_usuario ON log_aparelhos (usuario_id);
CREATE INDEX idx_log_residencia ON log_aparelhos (residencia_id);
CREATE INDEX idx_log_data ON log_aparelhos (data_acao);
CREATE INDEX idx_log_acao ON log_aparelhos (acao);

-- 5. TABELA DE ALERTAS GERADOS
-- Armazena alertas e recomendações geradas pelo sistema
CREATE TABLE IF NOT EXISTS alertas_sistema (
    id BIGSERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    residencia_id BIGINT REFERENCES residencias(id) ON DELETE CASCADE,
    aparelho_id BIGINT REFERENCES aparelhos(id) ON DELETE SET NULL,
    tipo_alerta VARCHAR(50) NOT NULL, -- 'META_EXCEDIDA', 'CONSUMO_ALTO', 'TENDENCIA_ALTA', etc.
    severidade VARCHAR(20) DEFAULT 'INFO', -- 'INFO', 'AVISO', 'ALERTA', 'CRITICO'
    titulo VARCHAR(200) NOT NULL,
    mensagem TEXT NOT NULL,
    dados_json JSONB, -- Dados adicionais em formato JSON
    lido BOOLEAN DEFAULT FALSE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_leitura TIMESTAMP
);

CREATE INDEX idx_alertas_usuario ON alertas_sistema (usuario_id);
CREATE INDEX idx_alertas_tipo ON alertas_sistema (tipo_alerta);
CREATE INDEX idx_alertas_lido ON alertas_sistema (lido);
CREATE INDEX idx_alertas_data ON alertas_sistema (data_criacao);

-- 6. TABELA DE MÉDIAS DE REFERÊNCIA (para comparação com média nacional)
-- Valores médios de consumo por tipo de aparelho
CREATE TABLE IF NOT EXISTS medias_referencia (
    id SERIAL PRIMARY KEY,
    categoria VARCHAR(100) NOT NULL,
    nome_aparelho VARCHAR(150) NOT NULL,
    consumo_medio_kwh_mes NUMERIC(10, 4) NOT NULL,
    potencia_media_watts INTEGER,
    fonte VARCHAR(200),
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserir dados de referência (valores médios nacionais aproximados)
INSERT INTO medias_referencia (categoria, nome_aparelho, consumo_medio_kwh_mes, potencia_media_watts, fonte) VALUES
('Climatização', 'Ar Condicionado Split 9000 BTU', 72.00, 900, 'PROCEL/INMETRO'),
('Climatização', 'Ar Condicionado Split 12000 BTU', 96.00, 1200, 'PROCEL/INMETRO'),
('Climatização', 'Ar Condicionado Split 18000 BTU', 144.00, 1800, 'PROCEL/INMETRO'),
('Climatização', 'Ventilador de Teto', 12.00, 50, 'PROCEL/INMETRO'),
('Climatização', 'Ventilador de Mesa', 9.00, 60, 'PROCEL/INMETRO'),
('Refrigeração', 'Geladeira Frost Free', 45.00, 150, 'PROCEL/INMETRO'),
('Refrigeração', 'Geladeira Simples', 30.00, 90, 'PROCEL/INMETRO'),
('Refrigeração', 'Freezer Vertical', 50.00, 130, 'PROCEL/INMETRO'),
('Aquecimento', 'Chuveiro Elétrico', 132.00, 5500, 'PROCEL/INMETRO'),
('Aquecimento', 'Aquecedor de Água', 100.00, 4000, 'PROCEL/INMETRO'),
('Cozinha', 'Micro-ondas', 13.20, 1100, 'PROCEL/INMETRO'),
('Cozinha', 'Forno Elétrico', 15.00, 1500, 'PROCEL/INMETRO'),
('Cozinha', 'Cafeteira Elétrica', 5.40, 600, 'PROCEL/INMETRO'),
('Cozinha', 'Torradeira', 3.00, 800, 'PROCEL/INMETRO'),
('Lavanderia', 'Máquina de Lavar Roupa', 12.00, 500, 'PROCEL/INMETRO'),
('Lavanderia', 'Secadora de Roupa', 45.00, 3000, 'PROCEL/INMETRO'),
('Lavanderia', 'Ferro de Passar', 12.00, 1000, 'PROCEL/INMETRO'),
('Entretenimento', 'TV LED 32"', 9.00, 50, 'PROCEL/INMETRO'),
('Entretenimento', 'TV LED 50"', 15.00, 100, 'PROCEL/INMETRO'),
('Entretenimento', 'TV LED 65"', 24.00, 150, 'PROCEL/INMETRO'),
('Entretenimento', 'Videogame', 18.00, 150, 'Estimativa'),
('Informática', 'Computador Desktop', 36.00, 200, 'Estimativa'),
('Informática', 'Computador Gamer', 72.00, 500, 'Estimativa'),
('Informática', 'Notebook', 9.00, 50, 'Estimativa'),
('Informática', 'Monitor', 10.00, 40, 'Estimativa'),
('Iluminação', 'Lâmpada LED 9W', 2.70, 9, 'PROCEL/INMETRO'),
('Iluminação', 'Lâmpada LED 12W', 3.60, 12, 'PROCEL/INMETRO'),
('Iluminação', 'Lâmpada Fluorescente 15W', 4.50, 15, 'PROCEL/INMETRO'),
('Outros', 'Roteador Wi-Fi', 4.32, 6, 'Estimativa'),
('Outros', 'Carregador de Celular', 0.90, 5, 'Estimativa'),
('Outros', 'Aspirador de Pó', 6.00, 1200, 'PROCEL/INMETRO')
ON CONFLICT DO NOTHING;

-- 7. ADICIONAR COLUNA NA TABELA DE APARELHOS PARA CATEGORIA
ALTER TABLE aparelhos ADD COLUMN IF NOT EXISTS categoria VARCHAR(100);

-- ============================================
-- COMENTÁRIOS SOBRE AS TABELAS
-- ============================================
COMMENT ON TABLE metas_consumo IS 'Armazena metas de gasto mensal definidas pelo usuário';
COMMENT ON TABLE historico_consumo IS 'Registra consumo diário para análises evolutivas';
COMMENT ON TABLE snapshots_mensais IS 'Resumo mensal para comparações históricas rápidas';
COMMENT ON TABLE log_aparelhos IS 'Log de adição/remoção de aparelhos para análise de impacto';
COMMENT ON TABLE alertas_sistema IS 'Alertas e recomendações geradas pelo sistema';
COMMENT ON TABLE medias_referencia IS 'Valores médios de consumo por tipo de aparelho (referência nacional)';
