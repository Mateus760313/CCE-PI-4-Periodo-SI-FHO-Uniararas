<?php
session_start();
header('Content-Type: application/json');
require 'conexao.php';

$usuarioId = $_SESSION['usuario_id'] ?? null;
if (!$usuarioId) {
    http_response_code(401);
    echo json_encode(['sucesso' => false, 'mensagem' => 'Usuário não autenticado']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['sucesso' => false, 'mensagem' => 'Método não permitido']);
    exit;
}

$tipo = $_POST['tipo'] ?? '';
$valor = filter_var($_POST['valor'] ?? false, FILTER_VALIDATE_BOOLEAN);

try {
    if ($tipo === 'relatorio_semanal') {
        $sql = "UPDATE usuarios SET receber_email_semanal = :valor WHERE id = :uid";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':valor' => $valor ? 'TRUE' : 'FALSE', ':uid' => $usuarioId]);
        
        echo json_encode(['sucesso' => true, 'mensagem' => 'Preferência de relatório semanal atualizada']);
    } elseif ($tipo === 'alertas') {
        $sql = "UPDATE usuarios SET receber_alertas = :valor WHERE id = :uid";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':valor' => $valor ? 'TRUE' : 'FALSE', ':uid' => $usuarioId]);
        
        echo json_encode(['sucesso' => true, 'mensagem' => 'Preferência de alertas atualizada']);
    } else {
        echo json_encode(['sucesso' => false, 'mensagem' => 'Tipo de preferência inválido']);
    }
} catch (PDOException $e) {
    error_log("Erro update_preferencias: " . $e->getMessage());
    echo json_encode(['sucesso' => false, 'mensagem' => 'Erro ao atualizar preferência']);
}
?>
