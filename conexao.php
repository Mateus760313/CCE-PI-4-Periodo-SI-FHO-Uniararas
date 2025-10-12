<?php
// Configurações do Banco de Dados PostgreSQL
$host = 'localhost'; // TROQUE 'localhost' PARA ESTE IP PARA EVITAR PROBLEMAS
$dbname = 'meusistema'; // Nome do banco de dados que você criou
$user = 'postgres'; 
$password = '1234'; // Sua senha confirmada
$port = '5432';      // Porta padrão do PostgreSQL

$pdo = null;

try {
    // String de conexão PDO
    $pdo = new PDO("pgsql:host=$host;port=$port;dbname=$dbname;user=$user;password=$password");
    
    // Configura o PDO para lançar exceções em caso de erro
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Se a conexão for um sucesso, este bloco termina.
    
} catch (PDOException $e) {
    // Este bloco é executado se a conexão falhar
    
    // CRÍTICO: Não exponha $e->getMessage() em produção. 
    // Mantenha apenas a mensagem genérica para o usuário.
    // echo "Erro de conexão: " . $e->getMessage(); 

    // O código aqui deve retornar o JSON de erro para o AJAX
    header('Content-Type: application/json');
    echo json_encode(['sucesso' => false, 'mensagem' => "Erro de conexão com o banco de dados. Verifique a senha e o php.ini."]);
    
    // Termina a execução do script
    exit(); 
}
// Se a conexão foi um sucesso, o script continua.
?>