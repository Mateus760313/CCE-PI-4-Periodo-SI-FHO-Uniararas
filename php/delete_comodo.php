<?php
session_start();
header('Content-Type: application/json');
require 'conexao.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['sucesso' => false, 'mensagem' => 'Método não permitido']);
    exit;
}

$usuarioId = $_SESSION['usuario_id'] ?? null;
if (!$usuarioId) {
    http_response_code(401);
    echo json_encode(['sucesso' => false, 'mensagem' => 'Usuário não autenticado']);
    exit;
}

$comodoId = intval($_POST['id'] ?? 0);
if ($comodoId <= 0) {
    echo json_encode(['sucesso' => false, 'mensagem' => 'ID do cômodo inválido']);
    exit;
}

try {
    // Verifica se o cômodo pertence ao usuário
    $check = $pdo->prepare('SELECT c.id FROM comodos c JOIN residencias r ON r.id = c.residencia_id WHERE c.id = :cid AND r.usuario_id = :uid');
    $check->execute([':cid' => $comodoId, ':uid' => $usuarioId]);
    if (!$check->fetch()) {
        http_response_code(403);
        echo json_encode(['sucesso' => false, 'mensagem' => 'Cômodo não encontrado ou sem permissão']);
        exit;
    }

    $sql = 'DELETE FROM comodos WHERE id = :cid';
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':cid' => $comodoId]);
    echo json_encode(['sucesso' => true, 'mensagem' => 'Cômodo excluído']);
} catch (PDOException $e) {
    http_response_code(500);
    error_log('Erro delete_comodo: ' . $e->getMessage());
    echo json_encode(['sucesso' => false, 'mensagem' => 'Erro ao excluir cômodo']);
}