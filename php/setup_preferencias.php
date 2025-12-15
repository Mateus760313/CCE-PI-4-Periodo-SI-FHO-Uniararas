<?php
require 'conexao.php';

try {
    // Adicionar coluna receber_email_semanal se não existir
    $sql = "ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS receber_email_semanal BOOLEAN DEFAULT FALSE";
    $pdo->exec($sql);
    
    echo "Coluna 'receber_email_semanal' verificada/criada com sucesso.<br>";
    
    // Adicionar coluna receber_alertas se não existir (para o outro checkbox)
    $sql2 = "ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS receber_alertas BOOLEAN DEFAULT TRUE";
    $pdo->exec($sql2);
    
    echo "Coluna 'receber_alertas' verificada/criada com sucesso.<br>";

} catch (PDOException $e) {
    echo "Erro ao atualizar banco de dados: " . $e->getMessage();
}
?>
