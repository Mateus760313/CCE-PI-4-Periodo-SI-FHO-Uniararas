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


$comodoId = intval($_POST['comodo_id'] ?? 0);
$nome = trim($_POST['nome'] ?? '');
$potencia = intval($_POST['potencia'] ?? 0);
$horas = floatval($_POST['horas'] ?? 0);

if ($comodoId <= 0 || $nome === '' || $potencia <= 0) {
    echo json_encode(['sucesso'=>false,'mensagem'=>'Dados inválidos']);
    exit;
}

try {
    // Busca residencia_id pelo comodo_id e valida propriedade
    $check = $pdo->prepare("SELECT c.residencia_id FROM comodos c JOIN residencias r ON r.id = c.residencia_id WHERE c.id = :cid AND r.usuario_id = :uid");
    $check->execute([':cid'=>$comodoId, ':uid'=>$usuarioId]);
    $row = $check->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        error_log("Erro: Cômodo $comodoId não pertence ao usuário $usuarioId");
        http_response_code(403);
        echo json_encode(['sucesso'=>false,'mensagem'=>'Cômodo inválido ou sem permissão']);
        exit;
    }
    $residenciaId = $row['residencia_id'];

    $sql = "INSERT INTO aparelhos (residencia_id, usuario_id, comodo_id, nome, potencia_watts, horas_uso) VALUES (:rid, :uid, :cid, :nome, :pot, :horas) RETURNING id";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':rid' => $residenciaId,
        ':uid' => $usuarioId,
        ':cid' => $comodoId,
        ':nome' => $nome,
        ':pot' => $potencia,
        ':horas' => $horas
    ]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    echo json_encode(['sucesso'=>true,'mensagem'=>'Aparelho criado','aparelho'=>['id'=>$row['id'],'nome'=>$nome,'potencia'=>$potencia,'horasUso'=>$horas,'comodoId'=>$comodoId,'residenciaId'=>$residenciaId]]);
} catch (PDOException $e) {
    http_response_code(500);
    error_log("Erro create_aparelho: " . $e->getMessage());
    echo json_encode(['sucesso'=>false,'mensagem'=>'Erro ao criar aparelho']);
}
