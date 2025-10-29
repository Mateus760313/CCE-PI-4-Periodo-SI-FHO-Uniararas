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
if (!$usuarioId) {
    http_response_code(401);
    echo json_encode(['sucesso'=>false,'mensagem'=>'Usuário não autenticado']);
    exit;
}

$nome = trim($_POST['nome'] ?? '');
$imagem = trim($_POST['imagem'] ?? '');

if ($nome === '' || $imagem === '') {
    echo json_encode(['sucesso'=>false,'mensagem'=>'Nome e imagem são obrigatórios']);
    exit;
}

try {
    $sql = "INSERT INTO residencias (usuario_id, nome, imagem) VALUES (:usuario_id, :nome, :imagem) RETURNING id, data_criacao";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':usuario_id' => $usuarioId,
        ':nome' => $nome,
        ':imagem' => $imagem
    ]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    echo json_encode(['sucesso'=>true,'mensagem'=>'Residência criada','residencia'=>array_merge(['id'=>$row['id']], ['nome'=>$nome,'imagem'=>$imagem,'data_criacao'=>$row['data_criacao']])]);
} catch (PDOException $e) {
    http_response_code(500);
    error_log("Erro create_residencia: ".$e->getMessage());
    echo json_encode(['sucesso'=>false,'mensagem'=>'Erro ao criar residência']);
}
