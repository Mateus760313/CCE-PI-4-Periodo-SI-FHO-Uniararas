<?php
// php/logout.php

session_start(); // Inicia a sessão

// Remove todas as variáveis de sessão e destrói a sessão no servidor
$_SESSION = [];
if (ini_get('session.use_cookies')) {
	$params = session_get_cookie_params();
	setcookie(session_name(), '', time() - 42000,
		$params['path'], $params['domain'],
		$params['secure'], $params['httponly']
	);
}
session_unset();
session_destroy(); // Destrói a sessão atual (o arquivo de sessão no servidor)

// Responde ao JavaScript com sucesso
header('Content-Type: application/json');
echo json_encode(['sucesso' => true, 'mensagem' => 'Sessão encerrada com sucesso.']);

exit;
?>