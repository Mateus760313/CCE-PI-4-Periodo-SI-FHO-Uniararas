<?php
// Habilitar exibição de erros
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Testar escrita no log
error_log("Teste de log - " . date('Y-m-d H:i:s'));

// Mostrar configurações do PHP
echo "Caminho do arquivo de log: " . ini_get('error_log') . "\n";
echo "Log errors: " . ini_get('log_errors') . "\n";
echo "Error reporting: " . ini_get('error_reporting') . "\n";

// Forçar um erro para teste
try {
    throw new Exception("Erro de teste");
} catch (Exception $e) {
    error_log("Erro capturado: " . $e->getMessage());
}

echo "Teste concluído. Verifique o arquivo de log.";
?>