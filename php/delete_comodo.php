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

$comodoId = intval($_POST['id'] ?? 0);
$acao = $_POST['acao'] ?? 'delete_all'; // 'delete_all' ou 'move'
$targetComodoId = intval($_POST['target_comodo_id'] ?? 0);

if ($comodoId <= 0) {
    echo json_encode(['sucesso' => false, 'mensagem' => 'ID do cômodo inválido']);
    exit;
}

try {
    $pdo->beginTransaction();

    // 1. Verifica se o cômodo pertence ao usuário e pega o ID da residência
    $stmt = $pdo->prepare('
        SELECT c.id, c.residencia_id 
        FROM comodos c 
        JOIN residencias r ON r.id = c.residencia_id 
        WHERE c.id = :cid AND r.usuario_id = :uid
    ');
    $stmt->execute([':cid' => $comodoId, ':uid' => $usuarioId]);
    $comodo = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$comodo) {
        throw new Exception('Cômodo não encontrado ou sem permissão');
    }

    $residenciaId = $comodo['residencia_id'];

    // 2. Lógica de Aparelhos
    if ($acao === 'move') {
        if ($targetComodoId <= 0) {
            throw new Exception('Cômodo de destino inválido');
        }

        // Verifica se o cômodo de destino existe e pertence à MESMA residência
        $stmtCheck = $pdo->prepare('SELECT id FROM comodos WHERE id = :tid AND residencia_id = :rid');
        $stmtCheck->execute([':tid' => $targetComodoId, ':rid' => $residenciaId]);
        if (!$stmtCheck->fetch()) {
            throw new Exception('Cômodo de destino inválido ou não pertence à mesma residência');
        }

        // Move os aparelhos
        $stmtMove = $pdo->prepare('UPDATE aparelhos SET comodo_id = :tid WHERE comodo_id = :cid');
        $stmtMove->execute([':tid' => $targetComodoId, ':cid' => $comodoId]);

    } else {
        // Padrão: delete_all (Deleta os aparelhos do cômodo)
        $stmtDeleteApps = $pdo->prepare('DELETE FROM aparelhos WHERE comodo_id = :cid');
        $stmtDeleteApps->execute([':cid' => $comodoId]);
    }

    // 3. Deleta o cômodo
    $stmtDelete = $pdo->prepare('DELETE FROM comodos WHERE id = :cid');
    $stmtDelete->execute([':cid' => $comodoId]);

    $pdo->commit();
    echo json_encode(['sucesso' => true, 'mensagem' => 'Cômodo excluído com sucesso']);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(['sucesso' => false, 'mensagem' => $e->getMessage()]);
}