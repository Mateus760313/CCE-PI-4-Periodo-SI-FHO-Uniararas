<?php
header('Content-Type: application/json');
require __DIR__ . '/config.php';
require __DIR__ . '/PHPMailer/src/Exception.php';
require __DIR__ . '/PHPMailer/src/PHPMailer.php';
require __DIR__ . '/PHPMailer/src/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

try {
    if (empty(SMTP_USER) || empty(SMTP_PASS) || empty(SMTP_HOST)) {
        throw new Exception('Preencha SMTP_USER, SMTP_PASS e SMTP_HOST em php/config.php antes de testar.');
    }

    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host = SMTP_HOST;
    $mail->SMTPAuth = true;
    $mail->Username = SMTP_USER;
    $mail->Password = SMTP_PASS;
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port = SMTP_PORT;

    $mail->setFrom(SMTP_FROM, SMTP_FROM_NAME);
    $mail->addAddress(SMTP_USER); // envia para você mesmo como teste

    $mail->isHTML(true);
    $mail->Subject = 'Teste de envio - CCE';
    $mail->Body = '<p>Este é um email de teste enviado a partir do script <strong>test_mail.php</strong>.</p>';

    $mail->send();
    echo json_encode(['sucesso' => true, 'mensagem' => 'Email de teste enviado para ' . SMTP_USER]);
} catch (Exception $e) {
    error_log('Erro test_mail: ' . $e->getMessage());
    echo json_encode(['sucesso' => false, 'mensagem' => 'Erro: ' . $e->getMessage()]);
}
