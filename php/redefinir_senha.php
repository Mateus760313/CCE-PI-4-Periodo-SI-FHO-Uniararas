<?php
session_start();
header('Content-Type: application/json');
require __DIR__ . '/conexao.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['sucesso' => false, 'mensagem' => 'Método não permitido']);
    exit;
}

$token = $_POST['token'] ?? '';
$novaSenha = $_POST['nova_senha'] ?? '';

if (empty($token) || empty($novaSenha)) {
    echo json_encode(['sucesso' => false, 'mensagem' => 'Dados inválidos']);
    exit;
}

// Validação básica da senha
if (strlen($novaSenha) < 6) {
    echo json_encode(['sucesso' => false, 'mensagem' => 'A senha deve ter pelo menos 6 caracteres']);
    exit;
}

try {
    // Verifica se o token é válido e não expirou
    $stmt = $pdo->prepare("
        SELECT r.usuario_id 
        FROM recuperacao_senha r
        WHERE r.token = :token 
        AND r.data_expiracao > NOW() 
        AND r.usado = false
    ");
    $stmt->execute([':token' => $token]);
    $recuperacao = $stmt->fetch();

    if (!$recuperacao) {
        echo json_encode(['sucesso' => false, 'mensagem' => 'Token inválido ou expirado']);
        exit;
    }

    // Atualiza a senha do usuário
    $senhaHash = password_hash($novaSenha, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("UPDATE usuarios SET senha_hash = :senha WHERE id = :id");
    $stmt->execute([
        ':senha' => $senhaHash,
        ':id' => $recuperacao['usuario_id']
    ]);

    // Marca o token como usado
    $stmt = $pdo->prepare("UPDATE recuperacao_senha SET usado = true WHERE token = :token");
    $stmt->execute([':token' => $token]);

    echo json_encode(['sucesso' => true, 'mensagem' => 'Senha atualizada com sucesso!']);

} catch (PDOException $e) {
    error_log("Erro ao redefinir senha: " . $e->getMessage());
    echo json_encode(['sucesso' => false, 'mensagem' => 'Erro ao redefinir a senha']);
}