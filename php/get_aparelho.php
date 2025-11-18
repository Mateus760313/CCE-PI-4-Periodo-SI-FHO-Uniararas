<?php
session_start();
header('Content-Type: application/json');
require __DIR__ . '/conexao.php';

$usuarioId = $_SESSION['usuario_id'] ?? null;
if (!$usuarioId) {
    http_response_code(401);
    echo json_encode(['sucesso'=>false,'mensagem'=>'Usuário não autenticado']);
    exit;
}

// Aceita either 'comodo_id' ou 'residencia_id'
$comodoId = intval($_GET['comodo_id'] ?? $_POST['comodo_id'] ?? 0);
$residenciaId = intval($_GET['residencia_id'] ?? $_POST['residencia_id'] ?? 0);

try {
    if ($comodoId > 0) {
        // Verifica se o cômodo pertence a uma residência do usuário
        $check = $pdo->prepare('SELECT c.id, c.residencia_id FROM comodos c JOIN residencias r ON r.id = c.residencia_id WHERE c.id = :cid AND r.usuario_id = :uid');
        $check->execute([':cid' => $comodoId, ':uid' => $usuarioId]);
        $row = $check->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            http_response_code(403);
            echo json_encode(['sucesso' => false, 'mensagem' => 'Cômodo inválido ou sem permissão']);
            exit;
        }

        $sql = 'SELECT id, nome, potencia_watts, horas_uso, data_criacao FROM aparelhos WHERE comodo_id = :cid ORDER BY data_criacao DESC';
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':cid' => $comodoId]);
        $aparelhos = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['sucesso' => true, 'aparelhos' => $aparelhos]);
        exit;
    }

    if ($residenciaId <= 0) {
        echo json_encode(['sucesso' => false, 'mensagem' => 'Residência ou cômodo não informado']);
        exit;
    }

    // Garante que a residencia pertence ao usuário
    $check = $pdo->prepare("SELECT id FROM residencias WHERE id = :rid AND usuario_id = :uid");
    $check->execute([':rid' => $residenciaId, ':uid' => $usuarioId]);
    if (!$check->fetch()) {
        http_response_code(403);
        echo json_encode(['sucesso' => false, 'mensagem' => 'Residência inválida']);
        exit;
    }

    $sql = "SELECT id, nome, potencia_watts, horas_uso, data_criacao FROM aparelhos WHERE residencia_id = :rid ORDER BY data_criacao DESC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':rid' => $residenciaId]);
    $aparelhos = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['sucesso' => true, 'aparelhos' => $aparelhos]);
} catch (PDOException $e) {
    http_response_code(500);
    error_log("Erro get_aparelhos: " . $e->getMessage());
    echo json_encode(['sucesso' => false, 'mensagem' => 'Erro ao buscar aparelhos']);
}
