<?php
session_start();
header('Content-Type: application/json');
require 'conexao.php';

$usuarioId = $_SESSION['usuario_id'] ?? null;

if (!$usuarioId) {
    echo json_encode(['sucesso' => false, 'mensagem' => 'Usuário não logado']);
    exit;
}

// Mapa de consumo típico (Watts e Horas/Dia)
$dadosSimulados = [
    'Chuveiro' => ['watts' => 5500, 'horas' => 0.6], // ~35 min
    'Ar Condicionado' => ['watts' => 1400, 'horas' => 8],
    'Geladeira' => ['watts' => 300, 'horas' => 10], // Compressor liga/desliga
    'Computador' => ['watts' => 500, 'horas' => 6],
    'TV' => ['watts' => 120, 'horas' => 5],
    'Televisão' => ['watts' => 120, 'horas' => 5],
    'Forno' => ['watts' => 2000, 'horas' => 0.5],
    'Videogame' => ['watts' => 180, 'horas' => 4],
    'Microondas' => ['watts' => 1400, 'horas' => 0.3], // ~20 min
    'Lâmpada' => ['watts' => 15, 'horas' => 6],
    'LED' => ['watts' => 10, 'horas' => 8],
    'Máquina de Lavar' => ['watts' => 1000, 'horas' => 0.5], // Média diária
    'Ferro' => ['watts' => 1500, 'horas' => 0.2],
    'Ventilador' => ['watts' => 80, 'horas' => 8],
    'Air Fryer' => ['watts' => 1500, 'horas' => 0.4]
];

try {
    // Busca todos os aparelhos do usuário
    $stmt = $pdo->prepare("SELECT id, nome FROM aparelhos WHERE usuario_id = :uid");
    $stmt->execute([':uid' => $usuarioId]);
    $aparelhos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $atualizados = 0;

    foreach ($aparelhos as $ap) {
        $nome = $ap['nome'];
        $dados = null;

        // Tenta encontrar uma correspondência no nome
        foreach ($dadosSimulados as $chave => $valor) {
            if (stripos($nome, $chave) !== false) {
                $dados = $valor;
                break;
            }
        }

        // Se não achou específico, define um padrão genérico se estiver zerado
        if (!$dados) {
            $dados = ['watts' => 100, 'horas' => 1];
        }

        // Atualiza o aparelho
        $update = $pdo->prepare("UPDATE aparelhos SET potencia_watts = :w, horas_uso = :h WHERE id = :id");
        $update->execute([
            ':w' => $dados['watts'],
            ':h' => $dados['horas'],
            ':id' => $ap['id']
        ]);
        $atualizados++;
    }

    echo json_encode([
        'sucesso' => true, 
        'mensagem' => "Simulação aplicada em $atualizados aparelhos!",
        'detalhes' => "Os valores de potência e horas de uso foram atualizados com médias de mercado."
    ]);

} catch (PDOException $e) {
    echo json_encode(['sucesso' => false, 'mensagem' => 'Erro no banco de dados: ' . $e->getMessage()]);
}
?>