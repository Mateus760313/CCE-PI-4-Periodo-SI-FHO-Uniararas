<?php
// Habilitar exibição de erros
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Arquivo responsável apenas pela conexão com o banco de dados.
// Não iniciamos a sessão aqui para evitar avisos caso o arquivo seja incluído
// após session_start() em outros scripts.

// Configurações do Banco de Dados PostgreSQL
$host = 'localhost';
$dbname = 'meusistema';
$user = 'postgres';
$password = '1234';
$port = '5432';

$pdo = null;

try {
    error_log("Tentando conectar ao PostgreSQL: host=$host dbname=$dbname user=$user port=$port");
    $pdo = new PDO("pgsql:host=$host;port=$port;dbname=$dbname;user=$user;password=$password");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    // Garante que a comunicação seja em UTF-8
    $pdo->exec("SET NAMES 'UTF8'");
    $pdo->exec("SET client_encoding='UTF8'");
    error_log("Conexão PostgreSQL estabelecida com sucesso");
} catch (PDOException $e) {
    header('Content-Type: application/json');
    $mensagem = "Erro de conexão com o banco de dados: " . $e->getMessage();
    error_log($mensagem);
    echo json_encode(['sucesso' => false, 'mensagem' => $mensagem]);
    exit();
}
?>