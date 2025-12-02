<?php
session_start();
header('Content-Type: application/json');
require 'conexao.php';

$usuarioId = $_SESSION['usuario_id'] ?? null;
if (!$usuarioId) {
    echo json_encode(['sucesso'=>false, 'mensagem'=>'Usuário não autenticado']);
    exit;
}

try {
    // 1. Top 5 Aparelhos
    // Calcula o consumo mensal em kWh e o custo estimado
    $sqlTop5 = "
        SELECT 
            a.nome, 
            c.nome as comodo_nome,
            (a.potencia_watts * a.horas_uso * COALESCE(a.fator_uso, 1) * 30 / 1000) as consumo_kwh,
            (a.potencia_watts * a.horas_uso * COALESCE(a.fator_uso, 1) * 30 / 1000 * COALESCE(r.tarifa_kwh, 0.75)) as custo_estimado
        FROM aparelhos a
        LEFT JOIN residencias r ON a.residencia_id = r.id
        LEFT JOIN comodos c ON a.comodo_id = c.id
        WHERE a.usuario_id = :uid
        ORDER BY consumo_kwh DESC
        LIMIT 5
    ";
    $stmtTop5 = $pdo->prepare($sqlTop5);
    $stmtTop5->execute([':uid' => $usuarioId]);
    $top5 = $stmtTop5->fetchAll(PDO::FETCH_ASSOC);

    // 2. Consumo por Cômodo
    $sqlComodos = "
        SELECT 
            c.nome, 
            SUM(a.potencia_watts * a.horas_uso * COALESCE(a.fator_uso, 1) * 30 / 1000) as consumo_kwh,
            SUM(a.potencia_watts * a.horas_uso * COALESCE(a.fator_uso, 1) * 30 / 1000 * COALESCE(r.tarifa_kwh, 0.75)) as custo_estimado
        FROM aparelhos a
        JOIN comodos c ON a.comodo_id = c.id
        LEFT JOIN residencias r ON a.residencia_id = r.id
        WHERE a.usuario_id = :uid
        GROUP BY c.nome
        ORDER BY consumo_kwh DESC
    ";
    $stmtComodos = $pdo->prepare($sqlComodos);
    $stmtComodos->execute([':uid' => $usuarioId]);
    $comodos = $stmtComodos->fetchAll(PDO::FETCH_ASSOC);

    // 3. Totais Mensais
    $totalMensalKwh = 0;
    $totalMensalCusto = 0;
    foreach ($comodos as $c) {
        $totalMensalKwh += floatval($c['consumo_kwh']);
        $totalMensalCusto += floatval($c['custo_estimado']);
    }

    // 4. Verificar Histórico (Snapshots)
    $sqlHistory = "SELECT COUNT(*) as count FROM snapshots_mensais WHERE usuario_id = :uid";
    $stmtHistory = $pdo->prepare($sqlHistory);
    $stmtHistory->execute([':uid' => $usuarioId]);
    $historyCount = $stmtHistory->fetch(PDO::FETCH_ASSOC)['count'];
    $hasHistory = $historyCount > 0;

    echo json_encode([
        'sucesso' => true,
        'top5' => $top5,
        'comodos' => $comodos,
        'total_mensal' => $totalMensalKwh,
        'total_custo' => $totalMensalCusto,
        'has_history' => $hasHistory
    ]);

} catch (PDOException $e) {
    error_log("Erro get_dashboard_data: " . $e->getMessage());
    echo json_encode(['sucesso'=>false, 'mensagem'=>'Erro ao buscar dados']);
}
?>