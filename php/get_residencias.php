<?php
session_start();
header('Content-Type: application/json');
require 'conexao.php';

$usuarioId = $_SESSION['usuario_id'] ?? null;
if (!$usuarioId) {
    http_response_code(401);
    echo json_encode(['sucesso'=>false,'mensagem'=>'Usuário não autenticado']);
    exit;
}

try {
    $sql = "SELECT 
                r.id, 
                r.nome, 
                r.imagem, 
                r.data_criacao, 
                r.tarifa_kwh,
                COUNT(a.id) as total_aparelhos,
                COALESCE(SUM((a.potencia_watts * a.horas_uso * COALESCE(a.fator_uso, 1) / 1000) * 30), 0) as total_kwh_mensal,
                COALESCE(SUM((a.potencia_watts * a.horas_uso * COALESCE(a.fator_uso, 1) / 1000) * 30 * COALESCE(r.tarifa_kwh, 0)), 0) as total_custo_mensal
            FROM residencias r
            LEFT JOIN aparelhos a ON a.residencia_id = r.id
            WHERE r.usuario_id = :usuario_id
            GROUP BY r.id
            ORDER BY r.data_criacao DESC";
            
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':usuario_id' => $usuarioId]);
    $residencias = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['sucesso'=>true,'residencias'=>$residencias]);
} catch (PDOException $e) {
    http_response_code(500);
    error_log("Erro get_residencias: ".$e->getMessage());
    echo json_encode(['sucesso'=>false,'mensagem'=>'Erro ao buscar residências']);
}
