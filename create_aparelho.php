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

$residenciaId = intval($_POST['residencia_id'] ?? 0);
$nome = trim($_POST['nome'] ?? '');
$potencia = intval($_POST['potencia'] ?? 0);
$horas = floatval($_POST['horas'] ?? 0);

if ($residenciaId <= 0 || $nome === '' || $potencia <= 0) {
    echo json_encode(['sucesso'=>false,'mensagem'=>'Dados inválidos']);
    exit;
}

try {
    // Opcional: verificar se a residência pertence ao usuário
    $check = $pdo->prepare("SELECT id FROM residencias WHERE id = :rid AND usuario_id = :uid");
    $check->execute([':rid'=>$residenciaId, ':uid'=>$usuarioId]);
    if (!$check->fetch()) {
        http_response_code(403);
        echo json_encode(['sucesso'=>false,'mensagem'=>'Residência inválida']);
        exit;
    }

    $sql = "INSERT INTO aparelhos (residencia_id, usuario_id, nome, potencia_watts, horas_uso) VALUES (:rid, :uid, :nome, :pot, :horas) RETURNING id";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':rid' => $residenciaId,
        ':uid' => $usuarioId,
        ':nome' => $nome,
        ':pot' => $potencia,
        ':horas' => $horas
    ]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    echo json_encode(['sucesso'=>true,'mensagem'=>'Aparelho criado','aparelho'=>['id'=>$row['id'],'nome'=>$nome,'potencia'=>$potencia,'horasUso'=>$horas,'residenciaId'=>$residenciaId]]);
} catch (PDOException $e) {
    http_response_code(500);
    error_log("Erro create_aparelho: ".$e->getMessage());
    echo json_encode(['sucesso'=>false,'mensagem'=>'Erro ao criar aparelho']);
}
