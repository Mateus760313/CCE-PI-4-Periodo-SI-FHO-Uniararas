<?php
session_start();
require 'conexao.php';

$usuarioId = $_SESSION['usuario_id'] ?? null;

if (!$usuarioId) {
    die("Erro: Você precisa estar logado para gerar dados de teste. <a href='../home.html'>Fazer Login</a>");
}

try {
    // 1. Buscar uma residência do usuário
    $stmt = $pdo->prepare("SELECT id, nome, tarifa_kwh FROM residencias WHERE usuario_id = :uid LIMIT 1");
    $stmt->execute([':uid' => $usuarioId]);
    $residencia = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$residencia) {
        die("Erro: Nenhuma residência encontrada. Crie uma residência primeiro.");
    }

    $residenciaId = $residencia['id'];
    $tarifa = floatval($residencia['tarifa_kwh']) ?: 0.75;
    
    echo "<h3>Gerando dados para a residência: " . htmlspecialchars($residencia['nome']) . "</h3>";

    // 2. Limpar dados antigos dessa residência para evitar duplicidade
    $stmt = $pdo->prepare("DELETE FROM snapshots_mensais WHERE residencia_id = :rid");
    $stmt->execute([':rid' => $residenciaId]);
    echo "Dados antigos limpos.<br>";

    // 3. Gerar dados para os últimos 6 meses
    $meses = 6;
    $baseKwh = 250; // Consumo base
    
    $stmtInsert = $pdo->prepare("
        INSERT INTO snapshots_mensais 
        (usuario_id, residencia_id, mes_referencia, total_kwh, total_custo, tarifa_media, qtd_aparelhos, aparelho_maior_consumo, consumo_maior_aparelho)
        VALUES 
        (:uid, :rid, :mes, :kwh, :custo, :tarifa, :qtd, :vilao, :vilao_consumo)
    ");

    for ($i = $meses; $i >= 1; $i--) {
        // Data do primeiro dia do mês passado, retrasado, etc.
        $data = date('Y-m-01', strtotime("-$i months"));
        
        // Variação aleatória de +/- 15%
        $fator = 1 + (rand(-15, 15) / 100);
        
        // Tendência de aumento leve (simulando inverno/verão ou apenas uso crescente)
        if ($i < 3) $fator += 0.1; 

        $kwh = $baseKwh * $fator;
        $custo = $kwh * $tarifa;
        
        $stmtInsert->execute([
            ':uid' => $usuarioId,
            ':rid' => $residenciaId,
            ':mes' => $data,
            ':kwh' => $kwh,
            ':custo' => $custo,
            ':tarifa' => $tarifa,
            ':qtd' => rand(5, 10),
            ':vilao' => 'Chuveiro Elétrico',
            ':vilao_consumo' => $kwh * 0.3 // 30% do consumo
        ]);

        echo "Gerado registro para <strong>$data</strong>: " . number_format($kwh, 2) . " kWh (R$ " . number_format($custo, 2) . ")<br>";
    }

    echo "<br><strong>Sucesso!</strong> Agora volte para a página de relatórios e atualize.<br>";
    echo "<a href='../relatorios.html'>Voltar para Relatórios</a>";

} catch (PDOException $e) {
    die("Erro ao gerar dados: " . $e->getMessage());
}
?>