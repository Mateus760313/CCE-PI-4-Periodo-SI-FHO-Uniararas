<?php
require 'conexao.php';

// Configurações da Simulação
$emailSimulacao = 'familia.simulada@exemplo.com';
$senhaSimulacao = 'senha123'; // Em produção, usar hash
$nomeUsuario = 'Família Silva';
$nomeResidencia = 'Casa Grande';
$tarifa = 0.85; // R$ por kWh

try {
    $pdo->beginTransaction();

    // 1. Limpar dados anteriores dessa simulação (se houver)
    $stmt = $pdo->prepare("SELECT id FROM usuarios WHERE email = ?");
    $stmt->execute([$emailSimulacao]);
    $usuarioExistente = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($usuarioExistente) {
        $uid = $usuarioExistente['id'];
        // Limpar tabelas relacionadas
        $pdo->exec("DELETE FROM log_aparelhos WHERE usuario_id = $uid");
        $pdo->exec("DELETE FROM snapshots_mensais WHERE usuario_id = $uid");
        $pdo->exec("DELETE FROM metas_consumo WHERE usuario_id = $uid");
        $pdo->exec("DELETE FROM alertas_sistema WHERE usuario_id = $uid");
        $pdo->exec("DELETE FROM historico_consumo WHERE usuario_id = $uid");
        
        // Apagar aparelhos e cômodos
        $stmtRes = $pdo->prepare("SELECT id FROM residencias WHERE usuario_id = ?");
        $stmtRes->execute([$uid]);
        $residencias = $stmtRes->fetchAll(PDO::FETCH_COLUMN);
        
        if (!empty($residencias)) {
            $idsRes = implode(',', $residencias);
            $pdo->exec("DELETE FROM aparelhos WHERE residencia_id IN ($idsRes)");
            $pdo->exec("DELETE FROM comodos WHERE residencia_id IN ($idsRes)");
            $pdo->exec("DELETE FROM residencias WHERE usuario_id = $uid");
        }
        
        $pdo->exec("DELETE FROM usuarios WHERE id = $uid");
    }

    // 2. Criar Usuário
    // Nota: Se a senha for hash no sistema real, aqui deveria ser password_hash($senhaSimulacao, PASSWORD_DEFAULT)
    // Vou assumir texto plano para teste ou usar um hash padrão se necessário. 
    // Verificando processar_auth.php rapidamente... (assumindo hash para garantir)
    $senhaHash = password_hash($senhaSimulacao, PASSWORD_DEFAULT);
    
    $stmt = $pdo->prepare("INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?) RETURNING id");
    // Se o banco não suportar RETURNING (MySQL antigo), usar lastInsertId
    // O código original usa PostgreSQL (BD PostgreSQL folder), então RETURNING funciona ou lastInsertId
    // Vou usar lastInsertId para compatibilidade genérica com PDO
    $stmt = $pdo->prepare("INSERT INTO usuarios (nome, email, senha_hash) VALUES (?, ?, ?)");
    $stmt->execute([$nomeUsuario, $emailSimulacao, $senhaHash]);
    $usuarioId = $pdo->lastInsertId();

    // 3. Criar Residência
    $stmt = $pdo->prepare("INSERT INTO residencias (usuario_id, nome, tarifa_kwh, imagem) VALUES (?, ?, ?, ?)");
    $stmt->execute([$usuarioId, $nomeResidencia, $tarifa, 'Casa_grande_3_4_moradores']);
    $residenciaId = $pdo->lastInsertId();

    // 4. Criar Cômodos
    $comodos = [
        'Sala de Estar' => [],
        'Cozinha' => [],
        'Quarto Casal' => [],
        'Quarto Filhos' => [],
        'Banheiro' => []
    ];

    $comodoIds = [];
    foreach ($comodos as $nome => $aparelhos) {
        $stmt = $pdo->prepare("INSERT INTO comodos (residencia_id, nome) VALUES (?, ?)");
        $stmt->execute([$residenciaId, $nome]);
        $comodoIds[$nome] = $pdo->lastInsertId();
    }

    // 5. Definir Aparelhos e Inserir
    // Vamos calibrar para que o Ar Condicionado represente ~11% de aumento
    // Cenário:
    // Consumo Antigo (sem AC): ~500 kWh
    // Consumo Novo (com AC): ~555 kWh (11% a mais)
    // AC Consumo: ~55 kWh/mês
    
    $listaAparelhos = [
        // Sala de Estar
        ['nome' => 'TV 55"', 'potencia' => 150, 'horas' => 6, 'comodo' => 'Sala de Estar', 'categoria' => 'Eletrônicos'],
        ['nome' => 'Videogame', 'potencia' => 200, 'horas' => 3, 'comodo' => 'Sala de Estar', 'categoria' => 'Eletrônicos'],
        ['nome' => 'Lâmpadas LED', 'potencia' => 30, 'horas' => 6, 'comodo' => 'Sala de Estar', 'categoria' => 'Iluminação'],
        
        // Cozinha (Grande consumidor)
        ['nome' => 'Geladeira Duplex', 'potencia' => 250, 'horas' => 10, 'comodo' => 'Cozinha', 'categoria' => 'Eletrodomésticos'], // Compressor cicla
        ['nome' => 'Microondas', 'potencia' => 1200, 'horas' => 0.5, 'comodo' => 'Cozinha', 'categoria' => 'Eletrodomésticos'],
        ['nome' => 'Forno Elétrico', 'potencia' => 3000, 'horas' => 0.3, 'comodo' => 'Cozinha', 'categoria' => 'Eletrodomésticos'],
        
        // Quarto Filhos
        ['nome' => 'Computador Gamer', 'potencia' => 400, 'horas' => 5, 'comodo' => 'Quarto Filhos', 'categoria' => 'Eletrônicos'],
        ['nome' => 'Lâmpadas', 'potencia' => 20, 'horas' => 5, 'comodo' => 'Quarto Filhos', 'categoria' => 'Iluminação'],
        
        // Banheiro
        ['nome' => 'Chuveiro Elétrico', 'potencia' => 5500, 'horas' => 0.7, 'comodo' => 'Banheiro', 'categoria' => 'Banho'], // ~20 min banho total/dia
        
        // Quarto Casal (Onde entra o AC)
        ['nome' => 'TV 32"', 'potencia' => 80, 'horas' => 2, 'comodo' => 'Quarto Casal', 'categoria' => 'Eletrônicos'],
        ['nome' => 'Ar Condicionado', 'potencia' => 1400, 'horas' => 2, 'comodo' => 'Quarto Casal', 'categoria' => 'Climatização'], 
        // AC: 1400W * 2h * 30d = 84 kWh.
    ];

    $consumoTotalAtual = 0;

    foreach ($listaAparelhos as $ap) {
        $consumoMensal = ($ap['potencia'] * $ap['horas'] * 30) / 1000;
        $consumoTotalAtual += $consumoMensal;

        $stmt = $pdo->prepare("INSERT INTO aparelhos (usuario_id, residencia_id, comodo_id, nome, potencia_watts, horas_uso, fator_uso, categoria) VALUES (?, ?, ?, ?, ?, ?, 1, ?)");
        $stmt->execute([
            $usuarioId,
            $residenciaId,
            $comodoIds[$ap['comodo']],
            $ap['nome'],
            $ap['potencia'],
            $ap['horas'],
            $ap['categoria']
        ]);
    }

    // 6. Gerar Histórico (Snapshots Mensais)
    // Queremos que o mês atual (projetado) seja ~11% maior que o mês passado.
    // Consumo Atual calculado acima.
    // Mês Passado = Consumo Atual / 1.11
    
    $mesAtual = date('Y-m-01');
    $mesPassado = date('Y-m-01', strtotime('-1 month'));
    $mesRetrasado = date('Y-m-01', strtotime('-2 months'));
    $mes3 = date('Y-m-01', strtotime('-3 months'));
    $mes4 = date('Y-m-01', strtotime('-4 months'));

    $consumoMesPassado = $consumoTotalAtual / 1.11;
    $custoMesPassado = $consumoMesPassado * $tarifa;

    // Inserir Snapshot Mês Passado
    $stmt = $pdo->prepare("INSERT INTO snapshots_mensais (usuario_id, residencia_id, mes_referencia, total_kwh, total_custo) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([$usuarioId, $residenciaId, $mesPassado, $consumoMesPassado, $custoMesPassado]);

    // Inserir outros meses para tendência (estável ou leve crescimento)
    $historico = [
        ['mes' => $mesRetrasado, 'kwh' => $consumoMesPassado * 0.98],
        ['mes' => $mes3, 'kwh' => $consumoMesPassado * 0.97],
        ['mes' => $mes4, 'kwh' => $consumoMesPassado * 0.99],
    ];

    foreach ($historico as $h) {
        $stmt->execute([$usuarioId, $residenciaId, $h['mes'], $h['kwh'], $h['kwh'] * $tarifa]);
    }

    // 7. Gerar Log de Instalação do AC
    // AC foi instalado há 15 dias
    $dataInstalacao = date('Y-m-d H:i:s', strtotime('-15 days'));
    $consumoEstimadoAC = (1400 * 2 * 30) / 1000; // 84 kWh

    $stmt = $pdo->prepare("INSERT INTO log_aparelhos (usuario_id, residencia_id, nome_aparelho, acao, data_acao, consumo_estimado_kwh, potencia_watts, horas_uso) VALUES (?, ?, ?, 'ADICIONADO', ?, ?, ?, ?)");
    $stmt->execute([$usuarioId, $residenciaId, 'Ar Condicionado', $dataInstalacao, $consumoEstimadoAC, 1400, 2]);

    // 8. Definir Meta (para gerar alerta)
    // Meta um pouco abaixo do consumo atual para gerar aviso de "Risco" ou "Excedido"
    $valorMeta = ($consumoTotalAtual * $tarifa) * 0.95; // Meta é 95% do gasto atual (vai estourar)
    
    $stmt = $pdo->prepare("INSERT INTO metas_consumo (usuario_id, residencia_id, valor_meta, mes_referencia, ativa) VALUES (?, ?, ?, ?, TRUE)");
    $stmt->execute([$usuarioId, $residenciaId, $valorMeta, $mesAtual]);

    // 9. Gerar Alertas do Sistema
    $stmt = $pdo->prepare("INSERT INTO alertas_sistema (usuario_id, residencia_id, titulo, mensagem, severidade, lido, data_criacao, tipo_alerta) VALUES (?, ?, ?, ?, ?, FALSE, NOW(), ?)");
    
    // Alerta de consumo elevado
    $stmt->execute([
        $usuarioId, 
        $residenciaId, 
        'Consumo Elevado Detectado', 
        'Seu consumo aumentou 11% em relação ao mês anterior. Verifique os novos aparelhos.', 
        'ALERTA',
        'CONSUMO'
    ]);

    $pdo->commit();

    echo "<h1>Simulação Configurada com Sucesso!</h1>";
    echo "<p><strong>Usuário:</strong> $emailSimulacao</p>";
    echo "<p><strong>Senha:</strong> $senhaSimulacao</p>";
    echo "<p><strong>Cenário:</strong> Família de 4 pessoas, Casa Grande.</p>";
    echo "<p><strong>Evento:</strong> Instalação de Ar Condicionado há 15 dias.</p>";
    echo "<p><strong>Impacto:</strong> Aumento de ~11% no consumo projetado.</p>";
    echo "<br><a href='../area-logada.html'>Ir para Login (Use as credenciais acima)</a>";

} catch (Exception $e) {
    $pdo->rollBack();
    echo "Erro ao configurar simulação: " . $e->getMessage();
}
?>
