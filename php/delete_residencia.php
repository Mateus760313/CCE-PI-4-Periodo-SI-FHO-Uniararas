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

if ($id <= 0) {
    echo json_encode(['sucesso' => false, 'mensagem' => 'ID inválido.']);
    exit;
}

try {
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

    // Deleta a residência (o CASCADE no banco deve cuidar dos dependentes, mas vamos garantir)
    // Se o banco estiver configurado com ON DELETE CASCADE nas FKs, deletar a residência deleta tudo.
    // Caso contrário, precisaríamos deletar aparelhos e cômodos antes.
    // Assumindo que o banco tem CASCADE conforme o dump analisado anteriormente.
    
    $stmt = $pdo->prepare('DELETE FROM residencias WHERE id = :id');
    $stmt->execute([':id' => $id]);

    echo json_encode(['sucesso' => true]);

} catch (Exception $e) {
    echo json_encode(['sucesso' => false, 'mensagem' => 'Erro ao excluir residência: ' . $e->getMessage()]);
}
?>
