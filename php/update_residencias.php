<?php
require_once 'conexao.php';
session_start();
header('Content-Type: application/json');

// Verifica se o usuário está logado
if (!isset($_SESSION['usuario_id'])) {
    echo json_encode(['sucesso' => false, 'mensagem' => 'Usuário não autenticado.']);
    exit;
}

// Valida parâmetros
$id = isset($_POST['id']) ? intval($_POST['id']) : 0;
$nome = isset($_POST['nome']) ? trim($_POST['nome']) : '';
$tarifa = isset($_POST['tarifa']) ? floatval($_POST['tarifa']) : 0;
$imagem = isset($_POST['imagem']) ? trim($_POST['imagem']) : '';

if ($id <= 0 || $nome === '' || $tarifa <= 0 || $imagem === '') {
    echo json_encode(['sucesso' => false, 'mensagem' => 'Parâmetros inválidos.']);
    exit;
}

try {
    // Usa a variável global $pdo definida em conexao.php
    global $pdo;
    if (!$pdo) {
        throw new Exception('Conexão com o banco não estabelecida.');
    }
    // Verifica se a residência pertence ao usuário
    $stmt = $pdo->prepare('SELECT id FROM residencias WHERE id = :id AND usuario_id = :usuario_id');
    $stmt->execute([
        ':id' => $id,
        ':usuario_id' => $_SESSION['usuario_id']
    ]);
    if ($stmt->rowCount() === 0) {
        echo json_encode(['sucesso' => false, 'mensagem' => 'Residência não encontrada ou acesso negado.']);
        exit;
    }
    // Atualiza os dados (sem coluna cidade)
    $stmt = $pdo->prepare('UPDATE residencias SET nome = :nome, tarifa_kwh = :tarifa, imagem = :imagem WHERE id = :id');
    $stmt->execute([
        ':nome' => $nome,
        ':tarifa' => $tarifa,
        ':imagem' => $imagem,
        ':id' => $id
    ]);
    echo json_encode(['sucesso' => true]);
} catch (Exception $e) {
    echo json_encode(['sucesso' => false, 'mensagem' => 'Erro ao atualizar residência: ' . $e->getMessage()]);
}
?>