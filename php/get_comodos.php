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

    // Retorna lista de cômodos com contagem de aparelhos e placeholders para KPIs
    $sql = "SELECT c.id, c.nome, c.residencia_id, c.imagem,
                   COUNT(a.id) AS aparelho_count,
                   0::double precision AS consumo_total_kwh,
                   0::double precision AS custo_total_reais
            FROM comodos c
            LEFT JOIN aparelhos a ON a.comodo_id = c.id
            WHERE c.residencia_id = :rid
            GROUP BY c.id, c.nome, c.residencia_id, c.imagem
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
