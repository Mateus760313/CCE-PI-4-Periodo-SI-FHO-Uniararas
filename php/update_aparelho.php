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

$aparelhoId = intval($_POST['id'] ?? 0);
$nome = trim($_POST['nome'] ?? '');
$potencia = intval($_POST['potencia'] ?? 0);
$horas = floatval($_POST['horas'] ?? 0);
$fator = floatval($_POST['fator_uso'] ?? 1.0);

if ($aparelhoId <= 0 || $nome === '' || $potencia <= 0) {
    echo json_encode(['sucesso' => false, 'mensagem' => 'Dados inválidos']);
    exit;
}

try {
    // Verifica se o aparelho pertence ao usuário
    $check = $pdo->prepare('SELECT id FROM aparelhos WHERE id = :aid AND usuario_id = :uid');
    $check->execute([':aid' => $aparelhoId, ':uid' => $usuarioId]);
    if (!$check->fetch()) {
        http_response_code(403);
        echo json_encode(['sucesso' => false, 'mensagem' => 'Aparelho não encontrado ou sem permissão']);
        exit;
    }

    $sql = 'UPDATE aparelhos SET nome = :nome, potencia_watts = :potencia, horas_uso = :horas, fator_uso = :fator WHERE id = :aid';
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':nome' => $nome, ':potencia' => $potencia, ':horas' => $horas, ':fator' => $fator, ':aid' => $aparelhoId]);
    echo json_encode(['sucesso' => true, 'mensagem' => 'Aparelho atualizado']);
} catch (PDOException $e) {
    http_response_code(500);
    error_log('Erro update_aparelho: ' . $e->getMessage());
    echo json_encode(['sucesso' => false, 'mensagem' => 'Erro ao atualizar aparelho']);
}