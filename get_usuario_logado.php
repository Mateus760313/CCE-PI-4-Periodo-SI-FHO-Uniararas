<?php
session_start();
// Define que a resposta será sempre em JSON
header('Content-Type: application/json');

// Inclui o arquivo de conexão com o banco de dados (que fornece $pdo)
require 'conexao.php'; 

// Verifica se a requisição é POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['sucesso' => false, 'mensagem' => 'Método de requisição não suportado.']);
    exit;
}

$acao = $_POST['acao'] ?? ''; 

// Caso: retornar os dados do usuário logado (checagem de sessão)
if ($acao === 'me') {
    // Se a sessão contém as chaves definidas no login, retornamos os dados
    if (!empty($_SESSION['usuario_id'])) {
        echo json_encode([
            'sucesso' => true,
            'id' => $_SESSION['usuario_id'],
            'nome' => $_SESSION['usuario_nome'] ?? '',
            'email' => $_SESSION['usuario_email'] ?? ''
        ]);
    } else {
        http_response_code(401); // Unauthorized
        echo json_encode(['sucesso' => false, 'mensagem' => 'Usuário não autenticado.']);
    }
    exit;
}

if ($acao === 'cadastro') {
    // ----------------------------------------------------------------
    // Lógica para CADASTRO (MANTIDA)
    // ----------------------------------------------------------------
    $nome = trim($_POST['nome_cadastro'] ?? '');
    $email = trim($_POST['email_cadastro'] ?? '');
    $senha = $_POST['senha_cadastro'] ?? '';

    if (empty($nome) || empty($email) || empty($senha)) {
        echo json_encode(['sucesso' => false, 'mensagem' => 'Todos os campos de cadastro são obrigatórios.']);
        exit;
    }
    
    // ... (Validações de email e hash da senha) ...
    $senha_hash = password_hash($senha, PASSWORD_DEFAULT);

    try {
        $sql = "INSERT INTO usuarios (nome, email, senha_hash) VALUES (:nome, :email, :senha_hash)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':nome' => $nome,
            ':email' => $email,
            ':senha_hash' => $senha_hash
        ]);
        
        echo json_encode(['sucesso' => true, 'mensagem' => 'Cadastro realizado com sucesso!']);
        
    } catch (PDOException $e) {
        if ($e->getCode() === '23505') { 
            echo json_encode(['sucesso' => false, 'mensagem' => 'Este e-mail já está cadastrado.']);
        } else {
            http_response_code(500); 
            echo json_encode(['sucesso' => false, 'mensagem' => 'Erro interno ao cadastrar usuário.']); 
        }
    }

} elseif ($acao === 'login') {
    // ----------------------------------------------------------------
    // Lógica para LOGIN (USANDO BANCO DE DADOS)
    // ----------------------------------------------------------------
    
    $email = trim($_POST['email_login'] ?? ''); 
    $senha = $_POST['senha_login'] ?? '';

    if (empty($email) || empty($senha)) {
        echo json_encode(['sucesso' => false, 'mensagem' => 'E-mail e senha são obrigatórios.']);
        exit;
    }
    
    try {
        // 1. Busca o usuário pelo e-mail
        $sql = "SELECT id, nome, senha_hash FROM usuarios WHERE email = :email";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':email' => $email]);
        $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

        // 2. Verifica se o usuário foi encontrado E se a senha confere
        if ($usuario && password_verify($senha, $usuario['senha_hash'])) {
            
            // Login bem-sucedido: Armazena dados essenciais na sessão
            $_SESSION['usuario_id'] = $usuario['id'];
            $_SESSION['usuario_nome'] = $usuario['nome']; // O nome que seu JS precisa!
            $_SESSION['usuario_email'] = $email;
            
            echo json_encode(['sucesso' => true, 'mensagem' => 'Login realizado com sucesso!']);
            exit;
            
        } else {
            // Usuário não encontrado ou senha incorreta
            echo json_encode(['sucesso' => false, 'mensagem' => 'E-mail ou senha inválidos.']);
        }

    } catch (PDOException $e) {
        http_response_code(500); 
        error_log("Erro de Login: " . $e->getMessage()); // Loga o erro real no servidor
        echo json_encode(['sucesso' => false, 'mensagem' => 'Erro interno ao tentar fazer login.']);
    }

} else {
    // Ação desconhecida
    echo json_encode(['sucesso' => false, 'mensagem' => 'Ação não especificada.']);
}
?>