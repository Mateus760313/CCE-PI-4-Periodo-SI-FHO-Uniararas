<?php
header('Content-Type: application/json; charset=utf-8');
require 'conexao.php';

try {
    // Busca aparelhos da tabela de referência
    // Se a tabela não existir (caso o usuário não tenha rodado o update), retorna array vazio ou erro tratado
    $stmt = $pdo->query("SELECT nome_aparelho, potencia_media_watts FROM medias_referencia ORDER BY nome_aparelho ASC");
    $sugestoes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['sucesso' => true, 'sugestoes' => $sugestoes]);
} catch (PDOException $e) {
    // Se a tabela não existir, retorna lista vazia sem erro
    if ($e->getCode() == '42P01') { // Undefined table
        echo json_encode(['sucesso' => true, 'sugestoes' => []]);
    } else {
        echo json_encode(['sucesso' => false, 'mensagem' => 'Erro ao buscar sugestões: ' . $e->getMessage()]);
    }
}
?>