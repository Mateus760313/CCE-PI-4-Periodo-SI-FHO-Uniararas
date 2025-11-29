<?php
session_start();
header('Content-Type: application/json');
require 'conexao.php';

$usuarioId = $_SESSION['usuario_id'] ?? null;
if (!$usuarioId) {
    echo json_encode(['sucesso' => false, 'mensagem' => 'Usuário não autenticado']);
    exit;
}

try {
    // Busca foto atual
    $stmtFoto = $pdo->prepare("SELECT foto_perfil FROM usuarios WHERE id = :id");
    $stmtFoto->execute([':id' => $usuarioId]);
    $fotoAtual = $stmtFoto->fetchColumn();
    
    // Remove do banco
    $sql = "UPDATE usuarios SET foto_perfil = NULL WHERE id = :id";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':id' => $usuarioId]);
    
    // Deleta o arquivo se existir
    if ($fotoAtual) {
        $caminhoArquivo = dirname(__DIR__) . '/' . $fotoAtual;
        if (file_exists($caminhoArquivo)) {
            unlink($caminhoArquivo);
        }
    }
    
    // Atualiza a sessão
    unset($_SESSION['usuario_foto']);
    
    echo json_encode(['sucesso' => true, 'mensagem' => 'Foto removida com sucesso']);
    
} catch (PDOException $e) {
    error_log("Erro remover foto: " . $e->getMessage());
    echo json_encode(['sucesso' => false, 'mensagem' => 'Erro ao remover foto']);
}
?>
