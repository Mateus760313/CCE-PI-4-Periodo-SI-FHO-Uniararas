<?php
session_start();
header('Content-Type: application/json');
require 'conexao.php';

$usuarioId = $_SESSION['usuario_id'] ?? null;
if (!$usuarioId) {
    echo json_encode(['sucesso' => false, 'mensagem' => 'Usuário não autenticado']);
    exit;
}

$acao = $_POST['acao'] ?? $_GET['acao'] ?? '';

try {
    switch ($acao) {
        
        // ========== METAS ==========
        case 'salvar_meta':
            salvarMeta($pdo, $usuarioId);
            break;
            
        case 'obter_meta':
            obterMeta($pdo, $usuarioId);
            break;
            
        // ========== RELATÓRIO COMPLETO ==========
        case 'gerar_relatorio':
            gerarRelatorioCompleto($pdo, $usuarioId);
            break;
            
        case 'comparativo_mensal':
            comparativoMensal($pdo, $usuarioId);
            break;
            
        case 'analise_aparelhos':
            analiseAparelhos($pdo, $usuarioId);
            break;
            
        case 'previsao_consumo':
            previsaoConsumo($pdo, $usuarioId);
            break;
            
        // ========== HISTÓRICO ==========
        case 'registrar_consumo_diario':
            registrarConsumoDiario($pdo, $usuarioId);
            break;
            
        case 'obter_historico':
            obterHistorico($pdo, $usuarioId);
            break;
            
        // ========== ALERTAS ==========
        case 'obter_alertas':
            obterAlertas($pdo, $usuarioId);
            break;
            
        case 'marcar_alerta_lido':
            marcarAlertaLido($pdo, $usuarioId);
            break;
            
        default:
            echo json_encode(['sucesso' => false, 'mensagem' => 'Ação não especificada']);
    }
} catch (PDOException $e) {
    error_log("Erro api_relatorios: " . $e->getMessage());
    echo json_encode(['sucesso' => false, 'mensagem' => 'Erro interno do servidor']);
}

// ========== FUNÇÕES DE META ==========
function salvarMeta($pdo, $usuarioId) {
    $residenciaId = $_POST['residencia_id'] ?? null;
    $valorMeta = floatval($_POST['valor_meta'] ?? 0);
    $mesReferencia = $_POST['mes_referencia'] ?? date('Y-m-01');
    
    if ($valorMeta <= 0) {
        echo json_encode(['sucesso' => false, 'mensagem' => 'Valor da meta deve ser positivo']);
        return;
    }
    
    // Desativa metas anteriores
    $sqlDesativa = "UPDATE metas_consumo SET ativa = FALSE 
                    WHERE usuario_id = :uid AND (residencia_id = :rid OR (:rid IS NULL AND residencia_id IS NULL))";
    $stmtDesativa = $pdo->prepare($sqlDesativa);
    $stmtDesativa->execute([':uid' => $usuarioId, ':rid' => $residenciaId]);
    
    // Insere nova meta
    $sql = "INSERT INTO metas_consumo (usuario_id, residencia_id, valor_meta, mes_referencia, ativa) 
            VALUES (:uid, :rid, :valor, :mes, TRUE)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':uid' => $usuarioId,
        ':rid' => $residenciaId,
        ':valor' => $valorMeta,
        ':mes' => $mesReferencia
    ]);
    
    echo json_encode(['sucesso' => true, 'mensagem' => 'Meta salva com sucesso', 'meta_id' => $pdo->lastInsertId()]);
}

function obterMeta($pdo, $usuarioId) {
    $residenciaId = $_GET['residencia_id'] ?? $_POST['residencia_id'] ?? null;
    
    $sql = "SELECT * FROM metas_consumo 
            WHERE usuario_id = :uid AND ativa = TRUE 
            AND (residencia_id = :rid OR (:rid IS NULL AND residencia_id IS NULL))
            ORDER BY data_criacao DESC LIMIT 1";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':uid' => $usuarioId, ':rid' => $residenciaId]);
    $meta = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode(['sucesso' => true, 'meta' => $meta]);
}

// ========== RELATÓRIO COMPLETO ==========
function gerarRelatorioCompleto($pdo, $usuarioId) {
    $residenciaId = $_GET['residencia_id'] ?? $_POST['residencia_id'] ?? null;
    
    $relatorio = [
        'sucesso' => true,
        'data_geracao' => date('Y-m-d H:i:s'),
        'periodo' => [
            'mes_atual' => date('Y-m'),
            'dias_passados' => date('j'),
            'dias_no_mes' => date('t')
        ]
    ];
    
    // 1. RESUMO GERAL
    $relatorio['resumo'] = obterResumoGeral($pdo, $usuarioId, $residenciaId);
    
    // 2. ANÁLISE DE META
    $relatorio['meta'] = analisarMeta($pdo, $usuarioId, $residenciaId, $relatorio['resumo']);
    
    // 3. TOP APARELHOS
    $relatorio['top_aparelhos'] = obterTopAparelhos($pdo, $usuarioId, $residenciaId);
    
    // 4. CONSUMO POR CÔMODO
    $relatorio['consumo_comodos'] = obterConsumoPorComodo($pdo, $usuarioId, $residenciaId);
    
    // 5. COMPARATIVO COM MÊS ANTERIOR
    $relatorio['comparativo'] = obterComparativoMensal($pdo, $usuarioId, $residenciaId);
    
    // 6. IMPACTO DE NOVOS APARELHOS
    $relatorio['impacto_aparelhos'] = analisarImpactoAparelhos($pdo, $usuarioId, $residenciaId);
    
    // 7. TENDÊNCIAS
    $relatorio['tendencias'] = calcularTendencias($pdo, $usuarioId, $residenciaId);
    
    // 8. RECOMENDAÇÕES
    $relatorio['recomendacoes'] = gerarRecomendacoes($relatorio);
    
    // 9. ALERTAS ATIVOS
    $relatorio['alertas'] = obterAlertasAtivos($pdo, $usuarioId, $residenciaId);
    
    // 10. PREVISÕES
    $relatorio['previsoes'] = calcularPrevisoes($relatorio);
    
    echo json_encode($relatorio, JSON_UNESCAPED_UNICODE);
}

function obterResumoGeral($pdo, $usuarioId, $residenciaId) {
    $whereResidencia = $residenciaId ? "AND a.residencia_id = :rid" : "";
    
    // Consumo atual do mês
    $sql = "SELECT 
                COUNT(DISTINCT a.id) as total_aparelhos,
                COUNT(DISTINCT a.residencia_id) as total_residencias,
                COALESCE(SUM(a.potencia_watts * a.horas_uso * :dias / 1000), 0) as consumo_kwh_parcial,
                COALESCE(SUM(a.potencia_watts * a.horas_uso * 30 / 1000), 0) as consumo_kwh_projetado
            FROM aparelhos a
            WHERE a.usuario_id = :uid $whereResidencia";
    
    $params = [':uid' => $usuarioId, ':dias' => date('j')];
    if ($residenciaId) $params[':rid'] = $residenciaId;
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $dados = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Obter tarifa média
    $sqlTarifa = "SELECT AVG(COALESCE(tarifa_kwh, 0.75)) as tarifa_media FROM residencias WHERE usuario_id = :uid";
    if ($residenciaId) {
        $sqlTarifa = "SELECT COALESCE(tarifa_kwh, 0.75) as tarifa_media FROM residencias WHERE id = :rid";
        $stmtTarifa = $pdo->prepare($sqlTarifa);
        $stmtTarifa->execute([':rid' => $residenciaId]);
    } else {
        $stmtTarifa = $pdo->prepare($sqlTarifa);
        $stmtTarifa->execute([':uid' => $usuarioId]);
    }
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

function analisarMeta($pdo, $usuarioId, $residenciaId, $resumo) {
    // Buscar meta ativa
    $sql = "SELECT * FROM metas_consumo 
            WHERE usuario_id = :uid AND ativa = TRUE 
            AND (residencia_id = :rid OR (:rid IS NULL AND residencia_id IS NULL))
            ORDER BY data_criacao DESC LIMIT 1";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':uid' => $usuarioId, ':rid' => $residenciaId]);
    $meta = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$meta) {
        return [
            'tem_meta' => false,
            'mensagem' => 'Você ainda não definiu uma meta de consumo.'
        ];
    }
    
    $valorMeta = floatval($meta['valor_meta']);
    $custoAtual = $resumo['custo_atual'];
    $custoProjetado = $resumo['custo_projetado'];
    
    $percentualAtual = ($custoAtual / $valorMeta) * 100;
    $percentualProjetado = ($custoProjetado / $valorMeta) * 100;
    $diferencaAtual = $custoAtual - $valorMeta;
    $diferencaProjetada = $custoProjetado - $valorMeta;
    
    // Status da meta
    $status = 'dentro';
    $statusTexto = 'Dentro da meta';
    $statusCor = 'success';
    
    if ($percentualAtual >= 100) {
        $status = 'excedido';
        $statusTexto = 'Meta excedida!';
        $statusCor = 'danger';
    } elseif ($percentualAtual >= 80) {
        $status = 'alerta';
        $statusTexto = 'Próximo da meta';
        $statusCor = 'warning';
    } elseif ($percentualProjetado > 100) {
        $status = 'risco';
        $statusTexto = 'Risco de exceder';
        $statusCor = 'warning';
    }
    
    // Gerar mensagem contextualizada
    $diasPassados = $resumo['dias_passados'];
    $diasRestantes = $resumo['dias_restantes'];
    
    $mensagem = sprintf(
        "Este mês você já consumiu R$ %.2f, o que representa %.1f%% da sua meta de R$ %.2f.",
        $custoAtual, $percentualAtual, $valorMeta
    );
    
    if ($percentualProjetado > 100 && $status !== 'excedido') {
        $mensagem .= sprintf(
            " Se o consumo continuar nesse ritmo, você deve ultrapassar a meta em cerca de R$ %.2f.",
            $diferencaProjetada
        );
    } elseif ($status === 'excedido') {
        $mensagem .= sprintf(
            " Você já ultrapassou sua meta em R$ %.2f.",
            abs($diferencaAtual)
        );
    } else {
        $mensagem .= sprintf(
            " Você ainda tem R$ %.2f disponíveis para os próximos %d dias.",
            $valorMeta - $custoAtual, $diasRestantes
        );
    }
    
    return [
        'tem_meta' => true,
        'valor_meta' => $valorMeta,
        'custo_atual' => $custoAtual,
        'custo_projetado' => $custoProjetado,
        'percentual_atual' => round($percentualAtual, 1),
        'percentual_projetado' => round($percentualProjetado, 1),
        'diferenca_atual' => round($diferencaAtual, 2),
        'diferenca_projetada' => round($diferencaProjetada, 2),
        'status' => $status,
        'status_texto' => $statusTexto,
        'status_cor' => $statusCor,
        'mensagem' => $mensagem,
        'dias_restantes' => $diasRestantes,
        'valor_diario_permitido' => $diasRestantes > 0 ? round(($valorMeta - $custoAtual) / $diasRestantes, 2) : 0
    ];
}

function obterTopAparelhos($pdo, $usuarioId, $residenciaId, $limite = 10) {
    $whereResidencia = $residenciaId ? "AND a.residencia_id = :rid" : "";
    
    $sql = "SELECT 
                a.id, a.nome, a.potencia_watts, a.horas_uso, a.categoria,
                c.nome as comodo_nome,
                r.nome as residencia_nome,
                r.tarifa_kwh,
                (a.potencia_watts * a.horas_uso * 30 / 1000) as consumo_kwh_mes,
                (a.potencia_watts * a.horas_uso * 30 / 1000 * COALESCE(r.tarifa_kwh, 0.75)) as custo_mes
            FROM aparelhos a
            LEFT JOIN comodos c ON a.comodo_id = c.id
            LEFT JOIN residencias r ON a.residencia_id = r.id
            WHERE a.usuario_id = :uid $whereResidencia
            ORDER BY consumo_kwh_mes DESC
            LIMIT :limite";
    
    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':uid', $usuarioId, PDO::PARAM_INT);
    $stmt->bindValue(':limite', $limite, PDO::PARAM_INT);
    if ($residenciaId) $stmt->bindValue(':rid', $residenciaId, PDO::PARAM_INT);
    $stmt->execute();
    
    $aparelhos = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Calcular total para percentuais
    $totalConsumo = array_sum(array_column($aparelhos, 'consumo_kwh_mes'));
    
    foreach ($aparelhos as &$ap) {
        $ap['percentual_total'] = $totalConsumo > 0 ? round(($ap['consumo_kwh_mes'] / $totalConsumo) * 100, 1) : 0;
        $ap['consumo_kwh_mes'] = round(floatval($ap['consumo_kwh_mes']), 2);
        $ap['custo_mes'] = round(floatval($ap['custo_mes']), 2);
        $ap['consumo_kwh_dia'] = round(floatval($ap['consumo_kwh_mes']) / 30, 3);
        
        // Comparar com média de referência
        $ap['comparacao_media'] = compararComMediaReferencia($pdo, $ap);
    }
    
    return $aparelhos;
}

function compararComMediaReferencia($pdo, $aparelho) {
    // Buscar média de referência pelo nome do aparelho (busca aproximada)
    $nomeAparelho = strtolower($aparelho['nome']);
    
    $sql = "SELECT * FROM medias_referencia 
            WHERE LOWER(nome_aparelho) LIKE :nome 
            OR :nome LIKE '%' || LOWER(nome_aparelho) || '%'
            LIMIT 1";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':nome' => '%' . $nomeAparelho . '%']);
    $media = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$media) {
        return null;
    }
    
    $consumoUsuario = floatval($aparelho['consumo_kwh_mes']);
    $consumoMedia = floatval($media['consumo_medio_kwh_mes']);
    $diferenca = $consumoUsuario - $consumoMedia;
    $percentualDiferenca = $consumoMedia > 0 ? (($diferenca / $consumoMedia) * 100) : 0;
    
    $status = 'normal';
    if ($percentualDiferenca > 30) {
        $status = 'muito_acima';
    } elseif ($percentualDiferenca > 10) {
        $status = 'acima';
    } elseif ($percentualDiferenca < -10) {
        $status = 'abaixo';
    }
    
    return [
        'media_referencia' => round($consumoMedia, 2),
        'diferenca_kwh' => round($diferenca, 2),
        'percentual_diferenca' => round($percentualDiferenca, 1),
        'status' => $status,
        'fonte' => $media['fonte']
    ];
}

function obterConsumoPorComodo($pdo, $usuarioId, $residenciaId) {
    $whereResidencia = $residenciaId ? "AND a.residencia_id = :rid" : "";
    
    $sql = "SELECT 
                c.id, c.nome,
                COUNT(a.id) as qtd_aparelhos,
                SUM(a.potencia_watts * a.horas_uso * 30 / 1000) as consumo_kwh_mes,
                SUM(a.potencia_watts * a.horas_uso * 30 / 1000 * COALESCE(r.tarifa_kwh, 0.75)) as custo_mes
            FROM comodos c
            LEFT JOIN aparelhos a ON a.comodo_id = c.id
            LEFT JOIN residencias r ON c.residencia_id = r.id
            WHERE r.usuario_id = :uid $whereResidencia
            GROUP BY c.id, c.nome
            ORDER BY consumo_kwh_mes DESC";
    
    $params = [':uid' => $usuarioId];
    if ($residenciaId) $params[':rid'] = $residenciaId;
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $comodos = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $totalConsumo = array_sum(array_column($comodos, 'consumo_kwh_mes'));
    
    foreach ($comodos as &$com) {
        $com['percentual_total'] = $totalConsumo > 0 ? round(($com['consumo_kwh_mes'] / $totalConsumo) * 100, 1) : 0;
        $com['consumo_kwh_mes'] = round(floatval($com['consumo_kwh_mes']), 2);
        $com['custo_mes'] = round(floatval($com['custo_mes']), 2);
    }
    
    return $comodos;
}

function obterComparativoMensal($pdo, $usuarioId, $residenciaId) {
    // Obter snapshot do mês anterior
    $mesAnterior = date('Y-m-01', strtotime('-1 month'));
    
    $sql = "SELECT * FROM snapshots_mensais 
            WHERE usuario_id = :uid AND mes_referencia = :mes";
    if ($residenciaId) {
        $sql .= " AND residencia_id = :rid";
    }
    
    $params = [':uid' => $usuarioId, ':mes' => $mesAnterior];
    if ($residenciaId) $params[':rid'] = $residenciaId;
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $snapshotAnterior = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$snapshotAnterior) {
        return [
            'tem_dados_anteriores' => false,
            'mensagem' => 'Ainda não há dados do mês anterior para comparação.'
        ];
    }
    
    // Consumo atual (projetado para o mês completo)
    $resumoAtual = obterResumoGeral($pdo, $usuarioId, $residenciaId);
    
    $consumoAnterior = floatval($snapshotAnterior['total_kwh']);
    $custoAnterior = floatval($snapshotAnterior['total_custo']);
    $consumoAtual = $resumoAtual['consumo_kwh_projetado'];
    $custoAtual = $resumoAtual['custo_projetado'];
    
    $diferencaKwh = $consumoAtual - $consumoAnterior;
    $diferencaCusto = $custoAtual - $custoAnterior;
    $percentualVariacao = $consumoAnterior > 0 ? (($diferencaKwh / $consumoAnterior) * 100) : 0;
    
    $tendencia = 'estavel';
    if ($percentualVariacao > 5) $tendencia = 'aumento';
    if ($percentualVariacao < -5) $tendencia = 'reducao';
    
    // Gerar mensagem
    $mensagem = '';
    if ($tendencia === 'aumento') {
        $mensagem = sprintf(
            "O aumento de R$ %.2f em relação ao mês anterior representa uma variação de %.1f%%.",
            abs($diferencaCusto), abs($percentualVariacao)
        );
    } elseif ($tendencia === 'reducao') {
        $mensagem = sprintf(
            "Parabéns! Você reduziu R$ %.2f em relação ao mês anterior (%.1f%% de economia).",
            abs($diferencaCusto), abs($percentualVariacao)
        );
    } else {
        $mensagem = "Seu consumo está estável em relação ao mês anterior.";
    }
    
    return [
        'tem_dados_anteriores' => true,
        'mes_anterior' => $mesAnterior,
        'consumo_anterior_kwh' => round($consumoAnterior, 2),
        'custo_anterior' => round($custoAnterior, 2),
        'consumo_atual_kwh' => round($consumoAtual, 2),
        'custo_atual' => round($custoAtual, 2),
        'diferenca_kwh' => round($diferencaKwh, 2),
        'diferenca_custo' => round($diferencaCusto, 2),
        'percentual_variacao' => round($percentualVariacao, 1),
        'tendencia' => $tendencia,
        'mensagem' => $mensagem
    ];
}

function analisarImpactoAparelhos($pdo, $usuarioId, $residenciaId) {
    $whereResidencia = $residenciaId ? "AND residencia_id = :rid" : "";
    
    // Buscar aparelhos adicionados nos últimos 30 dias
    $sql = "SELECT * FROM log_aparelhos 
            WHERE usuario_id = :uid 
            AND data_acao >= NOW() - INTERVAL '30 days'
            $whereResidencia
            ORDER BY data_acao DESC";
    
    $params = [':uid' => $usuarioId];
    if ($residenciaId) $params[':rid'] = $residenciaId;
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $analises = [];
    
    foreach ($logs as $log) {
        $consumoEstimado = floatval($log['consumo_estimado_kwh']);
        $acao = $log['acao'];
        $dataAcao = date('d/m/Y', strtotime($log['data_acao']));
        
        $mensagem = '';
        if ($acao === 'ADICIONADO') {
            $mensagem = sprintf(
                "Após a instalação do %s em %s, o consumo total aumentou em aproximadamente %.2f kWh/mês.",
                $log['nome_aparelho'], $dataAcao, $consumoEstimado
            );
        } elseif ($acao === 'REMOVIDO') {
            $mensagem = sprintf(
                "Após a remoção do %s, o gasto total reduziu em aproximadamente %.2f kWh/mês.",
                $log['nome_aparelho'], $consumoEstimado
            );
        } elseif ($acao === 'ALTERADO') {
            $mensagem = sprintf(
                "Alteração no %s em %s pode ter impactado o consumo.",
                $log['nome_aparelho'], $dataAcao
            );
        }
        
        $analises[] = [
            'aparelho' => $log['nome_aparelho'],
            'acao' => $acao,
            'data' => $dataAcao,
            'consumo_estimado_kwh' => $consumoEstimado,
            'mensagem' => $mensagem
        ];
    }
    
    return [
        'tem_alteracoes' => count($analises) > 0,
        'total_alteracoes' => count($analises),
        'analises' => $analises
    ];
}

function calcularTendencias($pdo, $usuarioId, $residenciaId) {
    // Obter snapshots dos últimos 6 meses
    $sql = "SELECT * FROM snapshots_mensais 
            WHERE usuario_id = :uid 
            AND mes_referencia >= DATE_TRUNC('month', NOW()) - INTERVAL '6 months'
            ORDER BY mes_referencia ASC";
    if ($residenciaId) {
        $sql = "SELECT * FROM snapshots_mensais 
                WHERE residencia_id = :rid 
                AND mes_referencia >= DATE_TRUNC('month', NOW()) - INTERVAL '6 months'
                ORDER BY mes_referencia ASC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':rid' => $residenciaId]);
    } else {
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':uid' => $usuarioId]);
    }
    
    $snapshots = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($snapshots) < 2) {
        return [
            'tem_dados_suficientes' => false,
            'mensagem' => 'São necessários pelo menos 2 meses de dados para calcular tendências.'
        ];
    }
    
    // Calcular tendência linear simples
    $valores = array_column($snapshots, 'total_kwh');
    $n = count($valores);
    $sumX = 0; $sumY = 0; $sumXY = 0; $sumX2 = 0;
    
    for ($i = 0; $i < $n; $i++) {
        $sumX += $i;
        $sumY += $valores[$i];
        $sumXY += $i * $valores[$i];
        $sumX2 += $i * $i;
    }
    
    $slope = ($n * $sumXY - $sumX * $sumY) / ($n * $sumX2 - $sumX * $sumX);
    $mediaConsumo = $sumY / $n;
    $percentualTendencia = $mediaConsumo > 0 ? ($slope / $mediaConsumo) * 100 : 0;
    
    $tendencia = 'estavel';
    $mensagem = '';
    
    if ($percentualTendencia > 5) {
        $tendencia = 'aumento';
        $mensagem = sprintf(
            "Sua tendência nos últimos %d meses mostra aumento gradual de %.1f%% ao mês.",
            $n, abs($percentualTendencia)
        );
    } elseif ($percentualTendencia < -5) {
        $tendencia = 'reducao';
        $mensagem = sprintf(
            "Ótimo! Sua tendência nos últimos %d meses mostra redução gradual de %.1f%% ao mês.",
            $n, abs($percentualTendencia)
        );
    } else {
        $mensagem = sprintf(
            "Seu consumo está estável nos últimos %d meses.",
            $n
        );
    }
    
    return [
        'tem_dados_suficientes' => true,
        'meses_analisados' => $n,
        'tendencia' => $tendencia,
        'percentual_mensal' => round($percentualTendencia, 1),
        'mensagem' => $mensagem,
        'historico' => array_map(function($s) {
            return [
                'mes' => $s['mes_referencia'],
                'consumo_kwh' => round(floatval($s['total_kwh']), 2),
                'custo' => round(floatval($s['total_custo']), 2)
            ];
        }, $snapshots)
    ];
}

function gerarRecomendacoes($relatorio) {
    $recomendacoes = [];
    
    // Recomendações baseadas na meta
    if (isset($relatorio['meta']['status'])) {
        if ($relatorio['meta']['status'] === 'excedido') {
            $recomendacoes[] = [
                'tipo' => 'meta',
                'severidade' => 'critico',
                'icone' => '🚨',
                'titulo' => 'Meta Excedida',
                'mensagem' => 'Sua meta foi excedida. Revise os aparelhos de maior consumo e considere reduzir o uso.'
            ];
        } elseif ($relatorio['meta']['status'] === 'risco') {
            $recomendacoes[] = [
                'tipo' => 'meta',
                'severidade' => 'aviso',
                'icone' => '⚠️',
                'titulo' => 'Risco de Exceder Meta',
                'mensagem' => sprintf(
                    'No ritmo atual, você ultrapassará a meta. Tente limitar o gasto diário a R$ %.2f.',
                    $relatorio['meta']['valor_diario_permitido']
                )
            ];
        }
    }
    
    // Recomendações baseadas nos aparelhos
    if (isset($relatorio['top_aparelhos'])) {
        foreach ($relatorio['top_aparelhos'] as $ap) {
            if ($ap['percentual_total'] > 40) {
                $recomendacoes[] = [
                    'tipo' => 'aparelho',
                    'severidade' => 'aviso',
                    'icone' => '⚡',
                    'titulo' => 'Concentração de Consumo',
                    'mensagem' => sprintf(
                        'O %s representa %.1f%% do seu gasto total. Considere otimizar seu uso.',
                        $ap['nome'], $ap['percentual_total']
                    )
                ];
            }
            
            if (isset($ap['comparacao_media']) && $ap['comparacao_media']['status'] === 'muito_acima') {
                $recomendacoes[] = [
                    'tipo' => 'aparelho',
                    'severidade' => 'info',
                    'icone' => '📊',
                    'titulo' => 'Consumo Acima da Média',
                    'mensagem' => sprintf(
                        'O %s está consumindo %.1f%% acima da média nacional para equipamentos similares.',
                        $ap['nome'], $ap['comparacao_media']['percentual_diferenca']
                    )
                ];
            }
        }
    }
    
    // Recomendações baseadas em tendências
    if (isset($relatorio['tendencias']['tendencia']) && $relatorio['tendencias']['tendencia'] === 'aumento') {
        $recomendacoes[] = [
            'tipo' => 'tendencia',
            'severidade' => 'aviso',
            'icone' => '📈',
            'titulo' => 'Tendência de Aumento',
            'mensagem' => $relatorio['tendencias']['mensagem']
        ];
    }
    
    // Recomendações gerais
    if (empty($relatorio['meta']['tem_meta']) || !$relatorio['meta']['tem_meta']) {
        $recomendacoes[] = [
            'tipo' => 'geral',
            'severidade' => 'info',
            'icone' => '🎯',
            'titulo' => 'Defina uma Meta',
            'mensagem' => 'Definir uma meta mensal ajuda a controlar seus gastos e economizar energia.'
        ];
    }
    
    // Dicas práticas
    $dicasPraticas = [
        [
            'tipo' => 'dica',
            'severidade' => 'info',
            'icone' => '💡',
            'titulo' => 'Ar Condicionado',
            'mensagem' => 'Mantenha o ar condicionado em 23°C. Cada grau a menos aumenta o consumo em cerca de 5%.'
        ],
        [
            'tipo' => 'dica',
            'severidade' => 'info',
            'icone' => '💡',
            'titulo' => 'Chuveiro Elétrico',
            'mensagem' => 'Reduza o tempo de banho para 5 minutos pode economizar até 30% no consumo do chuveiro.'
        ],
        [
            'tipo' => 'dica',
            'severidade' => 'info',
            'icone' => '💡',
            'titulo' => 'Geladeira',
            'mensagem' => 'Não coloque alimentos quentes na geladeira e evite deixar a porta aberta por muito tempo.'
        ]
    ];
    
    // Adicionar uma dica aleatória
    if (count($recomendacoes) < 5) {
        $recomendacoes[] = $dicasPraticas[array_rand($dicasPraticas)];
    }
    
    return $recomendacoes;
}

function calcularPrevisoes($relatorio) {
    $diasRestantes = $relatorio['periodo']['dias_no_mes'] - $relatorio['periodo']['dias_passados'];
    $diasPassados = $relatorio['periodo']['dias_passados'];
    
    if ($diasPassados == 0) {
        return ['tem_previsao' => false];
    }
    
    $custoAtual = $relatorio['resumo']['custo_atual'];
    $mediaDiaria = $custoAtual / $diasPassados;
    $previsaoFimMes = $custoAtual + ($mediaDiaria * $diasRestantes);
    
    $previsao = [
        'tem_previsao' => true,
        'media_diaria' => round($mediaDiaria, 2),
        'previsao_fim_mes' => round($previsaoFimMes, 2),
        'dias_restantes' => $diasRestantes
    ];
    
    // Se tiver meta, calcular data de estouro
    if (isset($relatorio['meta']['tem_meta']) && $relatorio['meta']['tem_meta']) {
        $valorMeta = $relatorio['meta']['valor_meta'];
        
        if ($custoAtual < $valorMeta && $mediaDiaria > 0) {
            $diasParaEstouro = ($valorMeta - $custoAtual) / $mediaDiaria;
            $dataEstouro = date('d/m/Y', strtotime("+$diasParaEstouro days"));
            
            $previsao['dias_para_estourar_meta'] = round($diasParaEstouro);
            $previsao['data_previsao_estouro'] = $dataEstouro;
            $previsao['vai_estourar'] = $diasParaEstouro < $diasRestantes;
        } else {
            $previsao['vai_estourar'] = $custoAtual >= $valorMeta;
        }
    }
    
    return $previsao;
}

function obterAlertasAtivos($pdo, $usuarioId, $residenciaId) {
    $whereResidencia = $residenciaId ? "AND (residencia_id = :rid OR residencia_id IS NULL)" : "";
    
    $sql = "SELECT * FROM alertas_sistema 
            WHERE usuario_id = :uid AND lido = FALSE $whereResidencia
            ORDER BY 
                CASE severidade 
                    WHEN 'CRITICO' THEN 1 
                    WHEN 'ALERTA' THEN 2 
                    WHEN 'AVISO' THEN 3 
                    ELSE 4 
                END,
                data_criacao DESC
            LIMIT 10";
    
    $params = [':uid' => $usuarioId];
    if ($residenciaId) $params[':rid'] = $residenciaId;
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

// ========== FUNÇÕES DE HISTÓRICO ==========
function registrarConsumoDiario($pdo, $usuarioId) {
    // Esta função seria chamada por um cron job diário
    $sql = "INSERT INTO historico_consumo (usuario_id, residencia_id, aparelho_id, data_registro, consumo_kwh, custo_estimado, tarifa_aplicada)
            SELECT 
                a.usuario_id,
                a.residencia_id,
                a.id,
                CURRENT_DATE,
                (a.potencia_watts * a.horas_uso / 1000),
                (a.potencia_watts * a.horas_uso / 1000 * COALESCE(r.tarifa_kwh, 0.75)),
                COALESCE(r.tarifa_kwh, 0.75)
            FROM aparelhos a
            JOIN residencias r ON a.residencia_id = r.id
            WHERE a.usuario_id = :uid
            ON CONFLICT DO NOTHING";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':uid' => $usuarioId]);
    
    echo json_encode(['sucesso' => true, 'mensagem' => 'Consumo diário registrado']);
}

function obterHistorico($pdo, $usuarioId) {
    $residenciaId = $_GET['residencia_id'] ?? null;
    $periodo = $_GET['periodo'] ?? '30'; // dias
    
    $whereResidencia = $residenciaId ? "AND residencia_id = :rid" : "";
    
    $sql = "SELECT 
                data_registro,
                SUM(consumo_kwh) as consumo_total,
                SUM(custo_estimado) as custo_total
            FROM historico_consumo
            WHERE usuario_id = :uid 
            AND data_registro >= CURRENT_DATE - INTERVAL ':periodo days'
            $whereResidencia
            GROUP BY data_registro
            ORDER BY data_registro ASC";
    
    $sql = str_replace(':periodo', intval($periodo), $sql);
    
    $params = [':uid' => $usuarioId];
    if ($residenciaId) $params[':rid'] = $residenciaId;
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    
    echo json_encode(['sucesso' => true, 'historico' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
}

// ========== FUNÇÕES DE ALERTAS ==========
function obterAlertas($pdo, $usuarioId) {
    $apenasNaoLidos = isset($_GET['nao_lidos']) && $_GET['nao_lidos'] === '1';
    
    $sql = "SELECT * FROM alertas_sistema WHERE usuario_id = :uid";
    if ($apenasNaoLidos) {
        $sql .= " AND lido = FALSE";
    }
    $sql .= " ORDER BY data_criacao DESC LIMIT 50";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':uid' => $usuarioId]);
    
    echo json_encode(['sucesso' => true, 'alertas' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
}

function marcarAlertaLido($pdo, $usuarioId) {
    $alertaId = $_POST['alerta_id'] ?? null;
    
    if (!$alertaId) {
        echo json_encode(['sucesso' => false, 'mensagem' => 'ID do alerta não informado']);
        return;
    }
    
    $sql = "UPDATE alertas_sistema SET lido = TRUE, data_leitura = NOW() 
            WHERE id = :id AND usuario_id = :uid";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':id' => $alertaId, ':uid' => $usuarioId]);
    
    echo json_encode(['sucesso' => true]);
}

// ========== COMPARATIVO MENSAL ==========
function comparativoMensal($pdo, $usuarioId) {
    $residenciaId = $_GET['residencia_id'] ?? null;
    $resultado = obterComparativoMensal($pdo, $usuarioId, $residenciaId);
    echo json_encode(['sucesso' => true, 'comparativo' => $resultado]);
}

// ========== ANÁLISE DE APARELHOS ==========
function analiseAparelhos($pdo, $usuarioId) {
    $residenciaId = $_GET['residencia_id'] ?? null;
    $aparelhos = obterTopAparelhos($pdo, $usuarioId, $residenciaId, 20);
    echo json_encode(['sucesso' => true, 'aparelhos' => $aparelhos]);
}

// ========== PREVISÃO DE CONSUMO ==========
function previsaoConsumo($pdo, $usuarioId) {
    $residenciaId = $_GET['residencia_id'] ?? null;
    $resumo = obterResumoGeral($pdo, $usuarioId, $residenciaId);
    $meta = analisarMeta($pdo, $usuarioId, $residenciaId, $resumo);
    
    $relatorio = [
        'periodo' => [
            'dias_passados' => date('j'),
            'dias_no_mes' => date('t')
        ],
        'resumo' => $resumo,
        'meta' => $meta
    ];
    
    $previsao = calcularPrevisoes($relatorio);
    echo json_encode(['sucesso' => true, 'previsao' => $previsao]);
}
?>
