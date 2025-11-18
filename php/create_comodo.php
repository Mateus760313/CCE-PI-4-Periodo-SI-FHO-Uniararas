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

$nome = trim($_POST['nome'] ?? '');
$residenciaId = $_POST['residencia_id'] ?? null;

if ($nome === '' || !$residenciaId) {
    echo json_encode(['sucesso' => false, 'mensagem' => 'Nome do cômodo e residência são obrigatórios']);
    exit;
}

try {
    // Verifica se a residência pertence ao usuário
    $sql = 'SELECT id FROM residencias WHERE id = :id AND usuario_id = :usuario_id';
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':id' => $residenciaId, ':usuario_id' => $usuarioId]);
    $res = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$res) {
        http_response_code(403);
        echo json_encode(['sucesso' => false, 'mensagem' => 'Residência não encontrada ou sem permissão']);
        exit;
    }

    // Insere o cômodo
    $insert = 'INSERT INTO comodos (residencia_id, nome, imagem) VALUES (:residencia_id, :nome, :imagem) RETURNING id, data_criacao';
    $stmt = $pdo->prepare($insert);
    $imagem = $_POST['imagem'] ?? null;
    $stmt->execute([
        ':residencia_id' => $residenciaId,
        ':nome' => $nome,
        ':imagem' => $imagem
    ]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode(['sucesso' => true, 'mensagem' => 'Cômodo criado com sucesso', 'comodo' => array_merge(['id' => $row['id']], ['nome' => $nome, 'residencia_id' => $residenciaId, 'imagem' => $imagem, 'data_criacao' => $row['data_criacao']])]);
} catch (PDOException $e) {
    http_response_code(500);
    error_log('Erro create_comodo: '.$e->getMessage());
    echo json_encode(['sucesso' => false, 'mensagem' => 'Erro ao criar cômodo']);
}

