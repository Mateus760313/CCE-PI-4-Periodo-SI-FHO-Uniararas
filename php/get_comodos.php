<?php
session_start();
header('Content-Type: application/json');
require 'conexao.php';

$usuarioId = $_SESSION['usuario_id'] ?? null;
if (!$usuarioId) {
    http_response_code(401);
    echo json_encode(['sucesso' => false, 'mensagem' => 'Usuário não autenticado']);
    exit;
}

$residenciaId = intval($_GET['residencia_id'] ?? $_POST['residencia_id'] ?? 0);
if ($residenciaId <= 0) {
    echo json_encode(['sucesso' => false, 'mensagem' => 'Residência não informada']);
    exit;
}

try {
    // Verifica propriedade da residência
    $check = $pdo->prepare('SELECT id FROM residencias WHERE id = :rid AND usuario_id = :uid');
    $check->execute([':rid' => $residenciaId, ':uid' => $usuarioId]);
    if (!$check->fetch()) {
        http_response_code(403);
        echo json_encode(['sucesso' => false, 'mensagem' => 'Residência inválida']);
        exit;
    }

    // Retorna lista de cômodos com contagem de aparelhos e KPIs calculados
    $sql = "SELECT 
                c.id, 
                c.nome, 
                c.residencia_id, 
                c.imagem,
                COUNT(a.id) AS aparelho_count,
                COALESCE(SUM((a.potencia_watts * a.horas_uso / 1000) * 30), 0) AS consumo_total_kwh,
                COALESCE(SUM((a.potencia_watts * a.horas_uso / 1000) * 30 * COALESCE(r.tarifa_kwh, 0)), 0) AS custo_total_reais,
                (
                    SELECT a2.nome 
                    FROM aparelhos a2 
                    WHERE a2.comodo_id = c.id 
                    ORDER BY (a2.potencia_watts * a2.horas_uso) DESC 
                    LIMIT 1
                ) as vilao_nome,
                (
                    SELECT ((a2.potencia_watts * a2.horas_uso / 1000) * 30 * COALESCE(r.tarifa_kwh, 0))
                    FROM aparelhos a2 
                    WHERE a2.comodo_id = c.id 
                    ORDER BY (a2.potencia_watts * a2.horas_uso) DESC 
                    LIMIT 1
                ) as vilao_custo
            FROM comodos c
            JOIN residencias r ON r.id = c.residencia_id
            LEFT JOIN aparelhos a ON a.comodo_id = c.id
            WHERE c.residencia_id = :rid
            GROUP BY c.id, c.nome, c.residencia_id, c.imagem, r.tarifa_kwh
            ORDER BY c.nome ASC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([':rid' => $residenciaId]);
    $comodos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['sucesso' => true, 'comodos' => $comodos]);
} catch (PDOException $e) {
    http_response_code(500);
    error_log('Erro get_comodos: '.$e->getMessage());
    echo json_encode(['sucesso' => false, 'mensagem' => 'Erro ao buscar cômodos']);
}
