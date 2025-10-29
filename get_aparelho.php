<?php
session_start();
header('Content-Type: application/json');
require 'conexao.php';

$usuarioId = $_SESSION['usuario_id'] ?? null;
if (!$usuarioId) {
    http_response_code(401);
    echo json_encode(['sucesso'=>false,'mensagem'=>'Usuário não autenticado']);
    exit;
}

$residenciaId = intval($_GET['residencia_id'] ?? $_POST['residencia_id'] ?? 0);
if ($residenciaId <= 0) {
    echo json_encode(['sucesso'=>false,'mensagem'=>'Residência não informada']);
    exit;
}

try {
    // Garante que a residencia pertence ao usuário
    $check = $pdo->prepare("SELECT id FROM residencias WHERE id = :rid AND usuario_id = :uid");
    $check->execute([':rid'=>$residenciaId, ':uid'=>$usuarioId]);
    if (!$check->fetch()) {
        http_response_code(403);
        echo json_encode(['sucesso'=>false,'mensagem'=>'Residência inválida']);
        exit;
    }

    $sql = "SELECT id, nome, potencia_watts, horas_uso, data_criacao FROM aparelhos WHERE residencia_id = :rid ORDER BY data_criacao DESC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':rid' => $residenciaId]);
    $aparelhos = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['sucesso'=>true, 'aparelhos' => $aparelhos]);
} catch (PDOException $e) {
    http_response_code(500);
    error_log("Erro get_aparelhos: ".$e->getMessage());
    echo json_encode(['sucesso'=>false,'mensagem'=>'Erro ao buscar aparelhos']);
}
