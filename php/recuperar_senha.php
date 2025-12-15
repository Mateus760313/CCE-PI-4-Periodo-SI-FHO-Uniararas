<?php
session_start();
header('Content-Type: application/json');
require __DIR__ . '/conexao.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require __DIR__ . '/PHPMailer/src/Exception.php';
require __DIR__ . '/PHPMailer/src/PHPMailer.php';
require __DIR__ . '/PHPMailer/src/SMTP.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['sucesso' => false, 'mensagem' => 'Método não permitido']);
    exit;
}

// Aceita tanto 'email' quanto 'email_recuperar' vindo do formulário
$email_raw = $_POST['email'] ?? $_POST['email_recuperar'] ?? null;
$email = $email_raw ? filter_var($email_raw, FILTER_VALIDATE_EMAIL) : false;
if (!$email) {
    echo json_encode(['sucesso' => false, 'mensagem' => 'Email inválido']);
    exit;
}

try {
    // Verifica se o email existe no banco
    $stmt = $pdo->prepare("SELECT id FROM usuarios WHERE email = :email");
    $stmt->execute([':email' => $email]);
    $usuario = $stmt->fetch();

    if (!$usuario) {
        echo json_encode(['sucesso' => false, 'mensagem' => 'Email não encontrado']);
        exit;
    }

    // Gera um token único
    $token = bin2hex(random_bytes(32));
    $expira = date('Y-m-d H:i:s', strtotime('+1 hour'));

    // Salva o token no banco
    $stmt = $pdo->prepare("INSERT INTO recuperacao_senha (usuario_id, token, data_expiracao) VALUES (:uid, :token, :expira)");
    $stmt->execute([
        ':uid' => $usuario['id'],
        ':token' => $token,
        ':expira' => $expira
    ]);

    // Carrega configuração SMTP externa (preencha php/config.php com suas credenciais)
    require_once __DIR__ . '/config.php';

    // Configura o PHPMailer
    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host = SMTP_HOST;
    $mail->SMTPAuth = true;
    $mail->Username = SMTP_USER;
    $mail->Password = SMTP_PASS;
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port = SMTP_PORT;

    $mail->setFrom(SMTP_FROM, SMTP_FROM_NAME);
    $mail->addAddress($email);

    // Configuração de charset UTF-8 para acentos
    $mail->CharSet = 'UTF-8';
    $mail->Encoding = 'base64';

    $mail->isHTML(true);
    $mail->Subject = 'Recuperação de Senha - CCE';
    
    // O link deve abrir a página estática de redefinição (redefinir_senha.html)
    $resetLink = "http://localhost/CCE-PI-4-Periodo-SI-FHO-Uniararas-main/redefinir_senha.html?token=" . $token;
    
    $mail->Body = "
        <h1>Recuperação de Senha</h1>
        <p>Você solicitou a recuperação de senha da sua conta no CCE.</p>
        <p>Clique no link abaixo para criar uma nova senha:</p>
        <p><a href='{$resetLink}'>{$resetLink}</a></p>
        <p>Este link expira em 1 hora.</p>
        <p>Se você não solicitou esta recuperação, ignore este email.</p>
    ";

    $mail->send();
    echo json_encode(['sucesso' => true, 'mensagem' => 'Email de recuperação enviado com sucesso! Verifique sua caixa de entrada.']);

} catch (Exception $e) {
    error_log("Erro ao processar recuperação de senha: " . $e->getMessage());
    echo json_encode(['sucesso' => false, 'mensagem' => 'Erro ao processar a recuperação de senha']);
}