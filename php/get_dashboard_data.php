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
    // Calcula o consumo mensal em kWh: (potencia * horas * fator_uso * 30) / 1000
    $sqlTop5 = "
        SELECT nome, (potencia_watts * horas_uso * COALESCE(fator_uso, 1) * 30 / 1000) as consumo_kwh
        FROM aparelhos
        WHERE usuario_id = :uid
        ORDER BY consumo_kwh DESC
        LIMIT 5
    ";
    $stmtTop5 = $pdo->prepare($sqlTop5);
    $stmtTop5->execute([':uid' => $usuarioId]);
    $top5 = $stmtTop5->fetchAll(PDO::FETCH_ASSOC);

    // 2. Consumo por Cômodo (Agrupado por nome para simplificar o gráfico global)
    $sqlComodos = "
        SELECT c.nome, SUM(a.potencia_watts * a.horas_uso * COALESCE(a.fator_uso, 1) * 30 / 1000) as consumo_kwh
        FROM aparelhos a
        JOIN comodos c ON a.comodo_id = c.id
        WHERE a.usuario_id = :uid
        GROUP BY c.nome
        ORDER BY consumo_kwh DESC
    ";
    $stmtComodos = $pdo->prepare($sqlComodos);
    $stmtComodos->execute([':uid' => $usuarioId]);
    $comodos = $stmtComodos->fetchAll(PDO::FETCH_ASSOC);

    // 3. Total Mensal (Soma de tudo)
    $totalMensal = 0;
    foreach ($comodos as $c) {
        $totalMensal += floatval($c['consumo_kwh']);
    }

    echo json_encode([
        'sucesso' => true,
        'top5' => $top5,
        'comodos' => $comodos,
        'total_mensal' => $totalMensal
    ]);

} catch (PDOException $e) {
    error_log("Erro get_dashboard_data: " . $e->getMessage());
    echo json_encode(['sucesso'=>false, 'mensagem'=>'Erro ao buscar dados']);
}
?>