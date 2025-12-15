-- 0. Configuração de Encoding
SET client_encoding TO 'UTF8';

-- ============================================
-- 1. ESTRUTURA DE TABELAS PRINCIPAIS
-- ============================================

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    receber_email_semanal BOOLEAN DEFAULT TRUE,
    receber_alertas BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Residências
CREATE TABLE IF NOT EXISTS residencias (
    id BIGSERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL,
    imagem VARCHAR(100), -- Armazena o tipo de residência (ex: 'Apartamento_1_morador')
    cidade VARCHAR(100),
    tarifa_kwh NUMERIC(10, 4) DEFAULT 0.0,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Cômodos
CREATE TABLE IF NOT EXISTS comodos (
    id BIGSERIAL PRIMARY KEY,
    residencia_id BIGINT NOT NULL REFERENCES residencias(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL,
    imagem VARCHAR(255),
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Aparelhos
CREATE TABLE IF NOT EXISTS aparelhos (
    id BIGSERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    residencia_id BIGINT NOT NULL REFERENCES residencias(id) ON DELETE CASCADE,
    comodo_id BIGINT NOT NULL REFERENCES comodos(id) ON DELETE CASCADE,
    nome VARCHAR(150) NOT NULL,
    potencia_watts INTEGER NOT NULL,
    horas_uso NUMERIC(5, 2) NOT NULL,
    fator_uso DECIMAL(4,2) DEFAULT 1.00,
    categoria VARCHAR(100),
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. ESTRUTURA DE TABELAS (RELATÓRIOS E ANALYTICS)
-- ============================================

-- Tabela de Metas
CREATE TABLE IF NOT EXISTS metas_consumo (
    id BIGSERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    residencia_id BIGINT REFERENCES residencias(id) ON DELETE CASCADE,
    valor_meta NUMERIC(10, 2) NOT NULL,
    mes_referencia DATE NOT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ativa BOOLEAN DEFAULT TRUE,
    CONSTRAINT metas_valor_positivo CHECK (valor_meta > 0)
);

CREATE INDEX IF NOT EXISTS idx_metas_usuario ON metas_consumo (usuario_id);
CREATE INDEX IF NOT EXISTS idx_metas_residencia ON metas_consumo (residencia_id);
CREATE INDEX IF NOT EXISTS idx_metas_mes ON metas_consumo (mes_referencia);

-- Tabela de Histórico
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

CREATE INDEX IF NOT EXISTS idx_historico_usuario ON historico_consumo (usuario_id);
CREATE INDEX IF NOT EXISTS idx_historico_residencia ON historico_consumo (residencia_id);
CREATE INDEX IF NOT EXISTS idx_historico_aparelho ON historico_consumo (aparelho_id);
CREATE INDEX IF NOT EXISTS idx_historico_data ON historico_consumo (data_registro);
CREATE INDEX IF NOT EXISTS idx_historico_mes ON historico_consumo (DATE_TRUNC('month', data_registro));

-- Tabela de Snapshots
CREATE TABLE IF NOT EXISTS snapshots_mensais (
    id BIGSERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    residencia_id BIGINT NOT NULL REFERENCES residencias(id) ON DELETE CASCADE,
    mes_referencia DATE NOT NULL,
    total_kwh NUMERIC(10, 4) NOT NULL,
    total_custo NUMERIC(10, 2) NOT NULL,
    tarifa_media NUMERIC(10, 4),
    qtd_aparelhos INTEGER,
    aparelho_maior_consumo VARCHAR(150),
    consumo_maior_aparelho NUMERIC(10, 4),
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(residencia_id, mes_referencia)
);

CREATE INDEX IF NOT EXISTS idx_snapshots_usuario ON snapshots_mensais (usuario_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_residencia ON snapshots_mensais (residencia_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_mes ON snapshots_mensais (mes_referencia);

-- Tabela de Log de Aparelhos
CREATE TABLE IF NOT EXISTS log_aparelhos (
    id BIGSERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    residencia_id BIGINT NOT NULL REFERENCES residencias(id) ON DELETE CASCADE,
    aparelho_id BIGINT,
    nome_aparelho VARCHAR(150) NOT NULL,
    potencia_watts INTEGER NOT NULL,
    horas_uso DOUBLE PRECISION,
    acao VARCHAR(20) NOT NULL,
    consumo_estimado_kwh NUMERIC(10, 4),
    data_acao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    observacao TEXT
);

CREATE INDEX IF NOT EXISTS idx_log_usuario ON log_aparelhos (usuario_id);
CREATE INDEX IF NOT EXISTS idx_log_residencia ON log_aparelhos (residencia_id);
CREATE INDEX IF NOT EXISTS idx_log_data ON log_aparelhos (data_acao);
CREATE INDEX IF NOT EXISTS idx_log_acao ON log_aparelhos (acao);

-- Tabela de Alertas
CREATE TABLE IF NOT EXISTS alertas_sistema (
    id BIGSERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    residencia_id BIGINT REFERENCES residencias(id) ON DELETE CASCADE,
    aparelho_id BIGINT REFERENCES aparelhos(id) ON DELETE SET NULL,
    tipo_alerta VARCHAR(50) NOT NULL,
    severidade VARCHAR(20) DEFAULT 'INFO',
    titulo VARCHAR(200) NOT NULL,
    mensagem TEXT NOT NULL,
    dados_json JSONB,
    lido BOOLEAN DEFAULT FALSE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_leitura TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_alertas_usuario ON alertas_sistema (usuario_id);
CREATE INDEX IF NOT EXISTS idx_alertas_tipo ON alertas_sistema (tipo_alerta);
CREATE INDEX IF NOT EXISTS idx_alertas_lido ON alertas_sistema (lido);
CREATE INDEX IF NOT EXISTS idx_alertas_data ON alertas_sistema (data_criacao);

-- Tabela de Médias de Referência
CREATE TABLE IF NOT EXISTS medias_referencia (
    id SERIAL PRIMARY KEY,
    categoria VARCHAR(100) NOT NULL,
    nome_aparelho VARCHAR(150) NOT NULL,
    consumo_medio_kwh_mes NUMERIC(10, 4) NOT NULL,
    potencia_media_watts NUMERIC(10, 2),
    fonte VARCHAR(200),
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 3. DADOS (POPULAÇÃO DA TABELA DE REFERÊNCIA)
-- ============================================

-- Limpar dados antigos (caso a tabela já existisse com dados)
TRUNCATE TABLE medias_referencia RESTART IDENTITY;

-- Inserir dados personalizados
INSERT INTO medias_referencia (categoria, nome_aparelho, potencia_media_watts, consumo_medio_kwh_mes, fonte) VALUES
-- Cozinha
('Cozinha', 'Geladeira (1 porta)', 200, 35.0, 'Personalizado'),
('Cozinha', 'Geladeira (2 portas)', 250, 55.0, 'Personalizado'),
('Cozinha', 'Fogão elétrico (por boca)', 3500, 52.5, 'Personalizado'),
('Cozinha', 'Forno elétrico', 3000, 30.0, 'Personalizado'),
('Cozinha', 'Micro-ondas', 1150, 11.5, 'Personalizado'),
('Cozinha', 'Torradeira', 1150, 3.5, 'Personalizado'),
('Cozinha', 'Sanduicheira', 1100, 3.3, 'Personalizado'),
('Cozinha', 'Liquidificador', 650, 2.0, 'Personalizado'),
('Cozinha', 'Batedeira', 500, 1.5, 'Personalizado'),
('Cozinha', 'Cafeteira elétrica', 1150, 17.2, 'Personalizado'),
('Cozinha', 'Lavadora de louças', 2000, 60.0, 'Personalizado'),

-- Lavanderia
('Lavanderia', 'Máquina de lavar roupa', 1000, 20.0, 'Personalizado'),
('Lavanderia', 'Secadora de roupas', 3500, 70.0, 'Personalizado'),
('Lavanderia', 'Ferro de passar', 1500, 15.0, 'Personalizado'),
('Lavanderia', 'Ferro a vapor', 1850, 18.5, 'Personalizado'),

-- Climatização e Ventilação
('Climatização', 'Ar-condicionado (9000 BTU)', 1200, 144.0, 'Personalizado'),
('Climatização', 'Ar-condicionado comum', 1175, 141.0, 'Personalizado'),
('Climatização', 'Ar-condicionado inverter', 925, 111.0, 'Personalizado'),
('Climatização', 'Aquecedor elétrico', 2000, 120.0, 'Personalizado'),
('Climatização', 'Ventilador', 100, 24.0, 'Personalizado'),
('Climatização', 'Umidificador', 65, 15.6, 'Personalizado'),

-- Eletrônicos / Entretenimento
('Entretenimento', 'TV LED (40–55")', 100, 15.0, 'Personalizado'),
('Entretenimento', 'TV CRT', 155, 23.2, 'Personalizado'),
('Entretenimento', 'Home Theater', 350, 10.5, 'Personalizado'),
('Entretenimento', 'Videogame (PS5/Xbox)', 175, 10.5, 'Personalizado'),

-- Informática
('Informática', 'Computador desktop', 250, 30.0, 'Personalizado'),
('Informática', 'Notebook', 75, 9.0, 'Personalizado'),
('Informática', 'Monitor moderno', 97.5, 11.7, 'Personalizado'),
('Informática', 'Monitor CRT', 120, 14.4, 'Personalizado'),
('Informática', 'Roteador Wi-Fi', 12.5, 9.0, 'Personalizado'),
('Informática', 'Carregador de smartphone', 36.5, 2.2, 'Personalizado'),

-- Iluminação
('Iluminação', 'Lâmpada incandescente', 70, 10.5, 'Personalizado'),
('Iluminação', 'Lâmpada fluorescente', 27.5, 4.1, 'Personalizado'),
('Iluminação', 'Lâmpada LED', 12.5, 1.9, 'Personalizado'),

-- Banheiro
('Banheiro', 'Chuveiro elétrico', 5500, 82.5, 'Personalizado'),
('Banheiro', 'Secador de cabelo', 1500, 7.5, 'Personalizado'),

-- Ferramentas / Gerais
('Outros', 'Aspirador de pó', 1150, 2.3, 'Personalizado'),
('Outros', 'Máquina de costura', 150, 0.3, 'Personalizado'),
('Outros', 'Furadeira elétrica', 750, 0.4, 'Personalizado');

-- ============================================
-- 4. COMENTÁRIOS
-- ============================================
COMMENT ON TABLE metas_consumo IS 'Armazena metas de gasto mensal definidas pelo usuário';
COMMENT ON TABLE historico_consumo IS 'Registra consumo diário para análises evolutivas';
COMMENT ON TABLE snapshots_mensais IS 'Resumo mensal para comparações históricas rápidas';
COMMENT ON TABLE log_aparelhos IS 'Log de adição/remoção de aparelhos para análise de impacto';
COMMENT ON TABLE alertas_sistema IS 'Alertas e recomendações geradas pelo sistema';
COMMENT ON TABLE medias_referencia IS 'Valores médios de consumo por tipo de aparelho (referência nacional)';
