<?php
session_start();
header('Content-Type: application/json');
require 'conexao.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['sucesso'=>false,'mensagem'=>'Método não permitido']);
    exit;
}

$usuarioId = $_SESSION['usuario_id'] ?? null;
if (!$usuarioId) { http_response_code(401); echo json_encode(['sucesso'=>false,'mensagem'=>'Usuário não autenticado']); exit; }

$id = intval($_POST['id'] ?? 0);
if ($id <= 0) { echo json_encode(['sucesso'=>false,'mensagem'=>'ID inválido']); exit; }

try {
    // Garante que o aparelho pertence ao usuário (através da residênca ou usuario_id)
    $stmt = $pdo->prepare("DELETE FROM aparelhos WHERE id = :id AND usuario_id = :uid");
    $stmt->execute([':id'=>$id, ':uid'=>$usuarioId]);
    if ($stmt->rowCount() === 0) {
        echo json_encode(['sucesso'=>false,'mensagem'=>'Aparelho não encontrado ou sem permissão']);
    } else {
        echo json_encode(['sucesso'=>true,'mensagem'=>'Aparelho removido']);
    }
} catch (PDOException $e) {
    http_response_code(500);
    error_log("Erro delete_aparelho: ".$e->getMessage());
    echo json_encode(['sucesso'=>false,'mensagem'=>'Erro ao remover aparelho']);
}
