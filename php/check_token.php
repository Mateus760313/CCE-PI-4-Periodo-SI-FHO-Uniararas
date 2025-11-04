<?php
// Endpoint de debug temporário para checar tokens de recuperação
// Uso: GET ou POST com parâmetro 'token'
// EXEMPLO (navegador): http://localhost/PI%20para%20testes/php/check_token.php?token=abc
// EXEMPLO (curl): curl -X POST -d "token=abc" http://localhost/PI%20para%20testes/php/check_token.php

header('Content-Type: application/json');
require __DIR__ . '/conexao.php';

$token = $_GET['token'] ?? $_POST['token'] ?? null;
if (!$token) {
    echo json_encode(['sucesso' => false, 'mensagem' => 'Parâmetro token ausente']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT id, usuario_id, token, data_expiracao, usado, data_criacao FROM recuperacao_senha WHERE token = :token");
    $stmt->execute([':token' => $token]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        echo json_encode(['sucesso' => false, 'mensagem' => 'Token não encontrado']);
        exit;
    }

    // Não vamos retornar o token completo por segurança — mascaramos parte dele
    $masked = substr($row['token'], 0, 6) . '...' . substr($row['token'], -6);

    $now = new DateTime();
    $exp = new DateTime($row['data_expiracao']);
    $expired = $exp < $now;

    echo json_encode([
        'sucesso' => true,
        'id' => (int)$row['id'],
        'usuario_id' => (int)$row['usuario_id'],
        'token_masked' => $masked,
        'data_expiracao' => $row['data_expiracao'],
        'usado' => (bool)$row['usado'],
        'expirado' => $expired,
        'data_criacao' => $row['data_criacao']
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['sucesso' => false, 'mensagem' => 'Erro ao consultar o banco', 'erro' => $e->getMessage()]);
}
