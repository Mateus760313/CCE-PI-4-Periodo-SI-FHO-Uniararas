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

try {
    $sql = "SELECT id, nome, imagem, data_criacao FROM residencias WHERE usuario_id = :usuario_id ORDER BY data_criacao DESC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':usuario_id' => $usuarioId]);
    $residencias = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['sucesso'=>true,'residencias'=>$residencias]);
} catch (PDOException $e) {
    http_response_code(500);
    error_log("Erro get_residencias: ".$e->getMessage());
    echo json_encode(['sucesso'=>false,'mensagem'=>'Erro ao buscar residências']);
}
