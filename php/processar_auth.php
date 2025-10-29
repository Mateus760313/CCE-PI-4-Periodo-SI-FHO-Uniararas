<?php
// CRÍTICO: Inicia a sessão PHP para poder usar $_SESSION
session_start(); 

// Define que a resposta será sempre em JSON. Deve vir após session_start().
header('Content-Type: application/json');

// Inclui o arquivo de conexão com o banco de dados (fornece $pdo)
require 'conexao.php'; 

// Verifica se a requisição é POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); // Método não permitido
    echo json_encode(['sucesso' => false, 'mensagem' => 'Método de requisição não suportado.']);
    exit;
}

// O JavaScript precisa enviar um campo 'acao' para o PHP saber o que fazer
$acao = $_POST['acao'] ?? ''; 

if ($acao === 'cadastro') {
    // ----------------------------------------------------------------
    // Lógica para CADASTRO
    // ----------------------------------------------------------------
    
    $nome = trim($_POST['nome_cadastro'] ?? '');
    $email = trim($_POST['email_cadastro'] ?? '');
    $senha = $_POST['senha_cadastro'] ?? '';

    if (empty($nome) || empty($email) || empty($senha)) {
        echo json_encode(['sucesso' => false, 'mensagem' => 'Todos os campos de cadastro são obrigatórios.']);
        exit;
    }
    
    // Validação de email
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['sucesso' => false, 'mensagem' => 'Formato de e-mail inválido.']);
        exit;
    }
    
    // Hash seguro da senha
    $senha_hash = password_hash($senha, PASSWORD_DEFAULT);

    try {
        // Prepara a consulta para inserção (prevenção de SQL Injection)
        $sql = "INSERT INTO usuarios (nome, email, senha_hash) VALUES (:nome, :email, :senha_hash)";
        $stmt = $pdo->prepare($sql);
        
        // Executa a inserção
        $stmt->execute([
            ':nome' => $nome,
            ':email' => $email,
            ':senha_hash' => $senha_hash
        ]);

        // Pega o ID do usuário recém inserido
        $usuario_id = $pdo->lastInsertId();
        
        // Cria a sessão do usuário após o cadastro
        $_SESSION['usuario_id'] = $usuario_id;
        $_SESSION['usuario_nome'] = $nome;
        $_SESSION['usuario_email'] = $email;
        
        echo json_encode(['sucesso' => true, 'mensagem' => 'Cadastro realizado com sucesso!']);
        
    } catch (PDOException $e) {
        // Erro 23505 é o código do PostgreSQL para violação de UNIQUE (email já existe)
        if ($e->getCode() === '23505') { 
            echo json_encode(['sucesso' => false, 'mensagem' => 'Este e-mail já está cadastrado.']);
        } else {
            http_response_code(500); 
            // Em ambiente de produção, não use $e->getMessage()
            echo json_encode(['sucesso' => false, 'mensagem' => 'Erro interno ao cadastrar usuário.']); 
        }
    }

} elseif ($acao === 'login') {
    // ----------------------------------------------------------------
    // Lógica para LOGIN
    // ----------------------------------------------------------------
    
    $email = trim($_POST['email_login'] ?? '');
    $senha = $_POST['senha_login'] ?? '';

    if (empty($email) || empty($senha)) {
        echo json_encode(['sucesso' => false, 'mensagem' => 'Email e senha são obrigatórios.']);
        exit;
    }

    try {
        // 1. Busca o usuário pelo email
        $sql = "SELECT id, nome, senha_hash FROM usuarios WHERE email = :email";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':email' => $email]);
        $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

        // 2. Verifica se o usuário foi encontrado e se a senha está correta
        if ($usuario && password_verify($senha, $usuario['senha_hash'])) {
            
            // 3. Login bem-sucedido: Armazena dados na sessão (chaves que o get_usuario_logado.php espera)
            $_SESSION['usuario_id'] = $usuario['id'];
            $_SESSION['usuario_nome'] = $usuario['nome'];
            $_SESSION['usuario_email'] = $email;
            
            echo json_encode(['sucesso' => true, 'mensagem' => 'Login realizado com sucesso!']);
            exit; // CRÍTICO: Termina aqui após o sucesso
            
        } else {
            // Usuário não encontrado ou senha incorreta
            echo json_encode(['sucesso' => false, 'mensagem' => 'E-mail ou senha inválidos.']);
        }

    } catch (PDOException $e) {
        http_response_code(500); 
        echo json_encode(['sucesso' => false, 'mensagem' => 'Erro interno ao tentar fazer login.']);
    }

} else {
    // Ação desconhecida
    echo json_encode(['sucesso' => false, 'mensagem' => 'Ação não especificada.']);
}
?>