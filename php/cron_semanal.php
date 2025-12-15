<?php
// Script para envio de relatórios semanais via CRON ou Agendador de Tarefas
// Executar via linha de comando: php cron_semanal.php

require __DIR__ . '/conexao.php';
require __DIR__ . '/config.php';
require __DIR__ . '/PHPMailer/src/Exception.php';
require __DIR__ . '/PHPMailer/src/PHPMailer.php';
require __DIR__ . '/PHPMailer/src/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

echo "Iniciando envio de relatórios semanais...\n";

try {
    // 1. Buscar usuários que optaram por receber relatório semanal
    $sql = "SELECT id, nome, email FROM usuarios WHERE receber_email_semanal = TRUE";
    $stmt = $pdo->query($sql);
    $usuarios = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "Encontrados " . count($usuarios) . " usuários para envio.\n";

    foreach ($usuarios as $user) {
        echo "Processando usuário: {$user['nome']} ({$user['email']})...\n";
        
        try {
            enviarRelatorioParaUsuario($pdo, $user);
            echo " - Email enviado com sucesso.\n";
        } catch (Exception $e) {
            echo " - Erro ao enviar para {$user['email']}: " . $e->getMessage() . "\n";
        }
    }

} catch (PDOException $e) {
    echo "Erro fatal no banco de dados: " . $e->getMessage() . "\n";
}

// ============================================================================
// FUNÇÕES AUXILIARES (Adaptadas de api_relatorios.php)
// ============================================================================

function enviarRelatorioParaUsuario($pdo, $user) {
    $usuarioId = $user['id'];
    
    // Coletar dados
    $resumo = obterResumoGeral($pdo, $usuarioId);
    $topAparelhos = obterTopAparelhos($pdo, $usuarioId);
    
    // Simular estrutura para recomendações
    $dadosParaRecomendacao = [
        'resumo' => $resumo,
        'top_aparelhos' => $topAparelhos,
        'meta' => ['status' => 'dentro'], 
        'tendencias' => ['variacao_percentual' => 0]
    ];
    $recomendacoes = gerarRecomendacoes($dadosParaRecomendacao);

    // Construir HTML
    $html = montarHtmlEmail($user['nome'], $resumo, $topAparelhos, $recomendacoes);

    // Enviar Email
    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host = SMTP_HOST;
    $mail->SMTPAuth = true;
    $mail->Username = SMTP_USER;
    $mail->Password = SMTP_PASS;
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port = SMTP_PORT;
    $mail->CharSet = 'UTF-8';

    $mail->setFrom(SMTP_FROM, SMTP_FROM_NAME);
    $mail->addAddress($user['email'], $user['nome']);

    $mail->isHTML(true);
    $mail->Subject = 'Seu Relatório Semanal de Consumo - CCE';
    $mail->Body = $html;
    $mail->AltBody = strip_tags(str_replace(['<br>', '</p>'], ["\n", "\n\n"], $html));

    $mail->send();
}

function montarHtmlEmail($nome, $resumo, $topAparelhos, $recomendacoes) {
    $html = "
    <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;'>
        <div style='background-color: #4CAF50; padding: 20px; text-align: center; color: white; border-radius: 8px 8px 0 0;'>
            <h1 style='margin: 0;'>Relatório Semanal</h1>
            <p style='margin: 5px 0 0;'>Calculadora de Consumo Energético</p>
        </div>
        
        <div style='padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px;'>
            <p>Olá, <strong>{$nome}</strong>!</p>
            <p>Confira como está o consumo energético das suas residências nesta semana.</p>
            
            <h2 style='color: #4CAF50; border-bottom: 2px solid #4CAF50; padding-bottom: 5px;'>Resumo do Mês</h2>
            <table style='width: 100%; border-collapse: collapse; margin-bottom: 20px;'>
                <tr>
                    <td style='padding: 8px; border-bottom: 1px solid #eee;'><strong>Consumo Projetado:</strong></td>
                    <td style='padding: 8px; border-bottom: 1px solid #eee; text-align: right;'>{$resumo['consumo_kwh_projetado']} kWh</td>
                </tr>
                <tr>
                    <td style='padding: 8px; border-bottom: 1px solid #eee;'><strong>Custo Estimado:</strong></td>
                    <td style='padding: 8px; border-bottom: 1px solid #eee; text-align: right;'>R$ {$resumo['custo_projetado']}</td>
                </tr>
                <tr>
                    <td style='padding: 8px; border-bottom: 1px solid #eee;'><strong>Total de Aparelhos:</strong></td>
                    <td style='padding: 8px; border-bottom: 1px solid #eee; text-align: right;'>{$resumo['total_aparelhos']}</td>
                </tr>
            </table>

            <h2 style='color: #4CAF50; border-bottom: 2px solid #4CAF50; padding-bottom: 5px;'>Top Consumidores</h2>
            <ul style='padding-left: 20px;'>";
            
    foreach ($topAparelhos as $ap) {
        $consumo = number_format($ap['consumo_mensal'], 2, ',', '.');
        $custo = number_format($ap['custo_mensal'], 2, ',', '.');
        $html .= "<li style='margin-bottom: 5px;'><strong>{$ap['nome']}</strong>: {$consumo} kWh (R$ {$custo})</li>";
    }

    $html .= "
            </ul>

            <h2 style='color: #4CAF50; border-bottom: 2px solid #4CAF50; padding-bottom: 5px;'>Dicas da Semana</h2>
            <ul style='padding-left: 20px;'>";
            
    foreach ($recomendacoes as $rec) {
        $html .= "<li style='margin-bottom: 5px;'>{$rec['texto']}</li>";
    }

    $html .= "
            </ul>
            
            <div style='margin-top: 30px; text-align: center; font-size: 12px; color: #888;'>
                <p>Este é um email automático enviado semanalmente conforme suas preferências.</p>
                <p>Para cancelar, acesse seu perfil no sistema.</p>
            </div>
        </div>
    </div>";
    return $html;
}

function obterResumoGeral($pdo, $usuarioId) {
    // Consumo atual do mês
    $sql = "SELECT 
                COUNT(DISTINCT a.id) as total_aparelhos,
                COUNT(DISTINCT a.residencia_id) as total_residencias,
                COALESCE(SUM(a.potencia_watts * a.horas_uso * COALESCE(a.fator_uso, 1) * :dias / 1000), 0) as consumo_kwh_parcial,
                COALESCE(SUM(a.potencia_watts * a.horas_uso * COALESCE(a.fator_uso, 1) * 30 / 1000), 0) as consumo_kwh_projetado
            FROM aparelhos a
            WHERE a.usuario_id = :uid";
    
    $params = [':uid' => $usuarioId, ':dias' => date('j')];
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $dados = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Obter tarifa média
    $sqlTarifa = "SELECT AVG(COALESCE(tarifa_kwh, 0.75)) as tarifa_media FROM residencias WHERE usuario_id = :uid";
    $stmtTarifa = $pdo->prepare($sqlTarifa);
    $stmtTarifa->execute([':uid' => $usuarioId]);
    
    $tarifa = $stmtTarifa->fetch(PDO::FETCH_ASSOC);
    $tarifaMedia = floatval($tarifa['tarifa_media']) ?: 0.75;
    
    $consumoKwh = floatval($dados['consumo_kwh_parcial']);
    $consumoProjetado = floatval($dados['consumo_kwh_projetado']);
    
    return [
        'total_aparelhos' => intval($dados['total_aparelhos']),
        'total_residencias' => intval($dados['total_residencias']),
        'consumo_kwh_atual' => round($consumoKwh, 2),
        'consumo_kwh_projetado' => round($consumoProjetado, 2),
        'custo_atual' => round($consumoKwh * $tarifaMedia, 2),
        'custo_projetado' => round($consumoProjetado * $tarifaMedia, 2),
        'tarifa_media' => round($tarifaMedia, 4),
        'dias_passados' => intval(date('j')),
        'dias_restantes' => intval(date('t')) - intval(date('j'))
    ];
}

function obterTopAparelhos($pdo, $usuarioId, $limite = 5) {
    $sql = "SELECT 
                a.id, a.nome, a.potencia_watts, a.horas_uso, a.categoria,
                c.nome as comodo_nome,
                r.nome as residencia_nome,
                r.tarifa_kwh,
                (a.potencia_watts * a.horas_uso * COALESCE(a.fator_uso, 1) * 30 / 1000) as consumo_kwh_mes,
                (a.potencia_watts * a.horas_uso * COALESCE(a.fator_uso, 1) * 30 / 1000 * COALESCE(r.tarifa_kwh, 0.75)) as custo_mes
            FROM aparelhos a
            LEFT JOIN comodos c ON a.comodo_id = c.id
            LEFT JOIN residencias r ON a.residencia_id = r.id
            WHERE a.usuario_id = :uid
            ORDER BY consumo_kwh_mes DESC
            LIMIT :limite";
    
    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':uid', $usuarioId, PDO::PARAM_INT);
    $stmt->bindValue(':limite', $limite, PDO::PARAM_INT);
    $stmt->execute();
    
    $aparelhos = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($aparelhos as &$ap) {
        $ap['consumo_mensal'] = round(floatval($ap['consumo_kwh_mes']), 2);
        $ap['custo_mensal'] = round(floatval($ap['custo_mes']), 2);
    }
    
    return $aparelhos;
}

function gerarRecomendacoes($relatorio) {
    $recomendacoes = [];
    
    // Dicas práticas fixas para o email semanal
    $dicasPraticas = [
        ['texto' => 'Mantenha o ar condicionado em 23°C para economizar.'],
        ['texto' => 'Banhos de até 5 minutos economizam muita energia.'],
        ['texto' => 'Evite abrir a geladeira desnecessariamente.'],
        ['texto' => 'Use lâmpadas LED, elas consomem até 80% menos.'],
        ['texto' => 'Tire aparelhos da tomada quando não estiver usando (standby consome!).']
    ];
    
    // Seleciona 3 dicas aleatórias
    shuffle($dicasPraticas);
    return array_slice($dicasPraticas, 0, 3);
}
?>
