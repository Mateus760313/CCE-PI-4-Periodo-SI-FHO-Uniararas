<?php
session_start();
header('Content-Type: application/json');
require 'conexao.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['sucesso'=>false,'mensagem'=>'Método não permitido']);
    exit;
}

$usuarioId = $_SESSION['usuario_id'] ?? null;
if (!$usuarioId) {
    http_response_code(401);
    echo json_encode(['sucesso'=>false,'mensagem'=>'Usuário não autenticado']);
    exit;
}

$nome = trim($_POST['nome'] ?? '');
$imagem = trim($_POST['imagem'] ?? ''); // Agora contém o TIPO (ex: Apartamento_1_morador)
$cidade = trim($_POST['cidade'] ?? '');
$tarifa = floatval($_POST['tarifa'] ?? 0);

if ($nome === '' || $imagem === '') {
    echo json_encode(['sucesso'=>false,'mensagem'=>'Nome e tipo de residência são obrigatórios']);
    exit;
}

// Definição dos Perfis de Consumo
$perfis = [

    'Apartamento_1_morador' => [
        ['nome' => 'Cozinha', 'aparelhos' => [
            ['nome' => 'Geladeira', 'potencia' => 150, 'horas_uso' => 24, 'fator_uso' => 0.50],
            ['nome' => 'Microondas', 'potencia' => 1200, 'horas_uso' => 0.1, 'fator_uso' => 1.0],
            ['nome' => 'Fogão Elétrico', 'potencia' => 1500, 'horas_uso' => 0.15, 'fator_uso' => 1.0],
        ]],
        ['nome' => 'Sala', 'aparelhos' => [
            ['nome' => 'TV', 'potencia' => 100, 'horas_uso' => 3, 'fator_uso' => 0.90],
            ['nome' => 'Lâmpada LED', 'potencia' => 10, 'horas_uso' => 5, 'fator_uso' => 1.0],
            ['nome' => 'Ventilador', 'potencia' => 80, 'horas_uso' => 5, 'fator_uso' => 0.80],
        ]],
        ['nome' => 'Quarto', 'aparelhos' => [
            ['nome' => 'Lâmpada LED', 'potencia' => 10, 'horas_uso' => 6, 'fator_uso' => 1.0],
            ['nome' => 'Carregador Celular', 'potencia' => 15, 'horas_uso' => 2, 'fator_uso' => 0.90],
            ['nome' => 'Notebook', 'potencia' => 60, 'horas_uso' => 4, 'fator_uso' => 0.90],
        ]],
        ['nome' => 'Banheiro', 'aparelhos' => [
            ['nome' => 'Chuveiro Elétrico', 'potencia' => 5500, 'horas_uso' => 0.13, 'fator_uso' => 1.0],
            ['nome' => 'Secador de Cabelo', 'potencia' => 1000, 'horas_uso' => 0.05, 'fator_uso' => 1.0],
        ]],
        ['nome' => 'Lavanderia', 'aparelhos' => [
            ['nome' => 'Máquina de Lavar', 'potencia' => 500, 'horas_uso' => 0.5, 'fator_uso' => 0.50],
        ]],
    ],

    'Apartamento_2_moradores' => [
        ['nome' => 'Cozinha', 'aparelhos' => [
            ['nome' => 'Geladeira', 'potencia' => 180, 'horas_uso' => 24, 'fator_uso' => 0.50],
            ['nome' => 'Microondas', 'potencia' => 1200, 'horas_uso' => 0.15, 'fator_uso' => 1.0],
            ['nome' => 'Fogão Elétrico', 'potencia' => 1500, 'horas_uso' => 0.25, 'fator_uso' => 1.0],
            ['nome' => 'Cafeteira', 'potencia' => 800, 'horas_uso' => 0.1, 'fator_uso' => 1.0],
        ]],
        ['nome' => 'Sala', 'aparelhos' => [
            ['nome' => 'TV', 'potencia' => 120, 'horas_uso' => 4, 'fator_uso' => 0.90],
            ['nome' => 'Lâmpada LED', 'potencia' => 10, 'horas_uso' => 6, 'fator_uso' => 1.0],
            ['nome' => 'Ar Condicionado', 'potencia' => 1400, 'horas_uso' => 4, 'fator_uso' => 0.70],
        ]],
        ['nome' => 'Quarto Casal', 'aparelhos' => [
            ['nome' => 'Lâmpada LED', 'potencia' => 10, 'horas_uso' => 6, 'fator_uso' => 1.0],
            ['nome' => 'Ar Condicionado', 'potencia' => 1200, 'horas_uso' => 5, 'fator_uso' => 0.70],
            ['nome' => 'TV', 'potencia' => 100, 'horas_uso' => 2, 'fator_uso' => 0.90],
        ]],
        ['nome' => 'Banheiro', 'aparelhos' => [
            ['nome' => 'Chuveiro Elétrico', 'potencia' => 5500, 'horas_uso' => 0.25, 'fator_uso' => 1.0],
            ['nome' => 'Secador de Cabelo', 'potencia' => 1000, 'horas_uso' => 0.1, 'fator_uso' => 1.0],
        ]],
        ['nome' => 'Lavanderia', 'aparelhos' => [
            ['nome' => 'Máquina de Lavar', 'potencia' => 500, 'horas_uso' => 1, 'fator_uso' => 0.50],
            ['nome' => 'Ferro de Passar', 'potencia' => 1000, 'horas_uso' => 0.3, 'fator_uso' => 1.0],
        ]],
    ],

    'Casa_pequena_1_morador' => [
        ['nome' => 'Cozinha', 'aparelhos' => [
            ['nome' => 'Geladeira', 'potencia' => 150, 'horas_uso' => 24, 'fator_uso' => 0.50],
            ['nome' => 'Microondas', 'potencia' => 1200, 'horas_uso' => 0.1, 'fator_uso' => 1.0],
        ]],
        ['nome' => 'Sala', 'aparelhos' => [
            ['nome' => 'TV', 'potencia' => 100, 'horas_uso' => 4, 'fator_uso' => 0.90],
            ['nome' => 'Lâmpada LED', 'potencia' => 10, 'horas_uso' => 5, 'fator_uso' => 1.0],
        ]],
        ['nome' => 'Quarto', 'aparelhos' => [
            ['nome' => 'Lâmpada LED', 'potencia' => 10, 'horas_uso' => 6, 'fator_uso' => 1.0],
            ['nome' => 'Ventilador', 'potencia' => 80, 'horas_uso' => 8, 'fator_uso' => 0.80],
        ]],
        ['nome' => 'Banheiro', 'aparelhos' => [
            ['nome' => 'Chuveiro Elétrico', 'potencia' => 5500, 'horas_uso' => 0.13, 'fator_uso' => 1.0],
        ]],
        ['nome' => 'Área Externa', 'aparelhos' => [
            ['nome' => 'Lâmpada', 'potencia' => 20, 'horas_uso' => 8, 'fator_uso' => 1.0],
        ]],
    ],

    'Casa_grande_3_4_moradores' => [
        ['nome' => 'Cozinha', 'aparelhos' => [
            ['nome' => 'Geladeira Duplex', 'potencia' => 250, 'horas_uso' => 24, 'fator_uso' => 0.50],
            ['nome' => 'Microondas', 'potencia' => 1200, 'horas_uso' => 0.2, 'fator_uso' => 1.0],
            ['nome' => 'Forno Elétrico', 'potencia' => 2000, 'horas_uso' => 0.2, 'fator_uso' => 1.0],
            ['nome' => 'Lava-louças', 'potencia' => 1500, 'horas_uso' => 0.3, 'fator_uso' => 0.50],
        ]],
        ['nome' => 'Sala de Estar', 'aparelhos' => [
            ['nome' => 'TV 50pol', 'potencia' => 150, 'horas_uso' => 5, 'fator_uso' => 0.90],
            ['nome' => 'Ar Condicionado', 'potencia' => 1800, 'horas_uso' => 5, 'fator_uso' => 0.70],
            ['nome' => 'Lâmpadas', 'potencia' => 30, 'horas_uso' => 6, 'fator_uso' => 1.0],
        ]],
        ['nome' => 'Quarto Principal', 'aparelhos' => [
            ['nome' => 'Ar Condicionado', 'potencia' => 1200, 'horas_uso' => 5, 'fator_uso' => 0.70],
            ['nome' => 'TV', 'potencia' => 100, 'horas_uso' => 2, 'fator_uso' => 0.90],
            ['nome' => 'Abajur', 'potencia' => 10, 'horas_uso' => 2, 'fator_uso' => 1.0],
        ]],
        ['nome' => 'Quarto Filhos', 'aparelhos' => [
            ['nome' => 'Computador Gamer', 'potencia' => 400, 'horas_uso' => 4, 'fator_uso' => 0.90],
            ['nome' => 'Ventilador', 'potencia' => 80, 'horas_uso' => 8, 'fator_uso' => 0.80],
            ['nome' => 'Lâmpada LED', 'potencia' => 10, 'horas_uso' => 5, 'fator_uso' => 1.0],
        ]],
        ['nome' => 'Banheiro Social', 'aparelhos' => [
            ['nome' => 'Chuveiro Elétrico', 'potencia' => 5500, 'horas_uso' => 0.4, 'fator_uso' => 1.0],
        ]],
        ['nome' => 'Banheiro Suíte', 'aparelhos' => [
            ['nome' => 'Chuveiro Elétrico', 'potencia' => 5500, 'horas_uso' => 0.3, 'fator_uso' => 1.0],
            ['nome' => 'Secador', 'potencia' => 1200, 'horas_uso' => 0.1, 'fator_uso' => 1.0],
        ]],
        ['nome' => 'Lavanderia', 'aparelhos' => [
            ['nome' => 'Máquina de Lavar', 'potencia' => 600, 'horas_uso' => 1, 'fator_uso' => 0.50],
            ['nome' => 'Secadora', 'potencia' => 2000, 'horas_uso' => 0.5, 'fator_uso' => 0.60],
            ['nome' => 'Ferro', 'potencia' => 1000, 'horas_uso' => 0.3, 'fator_uso' => 1.0],
        ]],
        ['nome' => 'Área de Lazer', 'aparelhos' => [
            ['nome' => 'Freezer', 'potencia' => 200, 'horas_uso' => 24, 'fator_uso' => 0.50],
            ['nome' => 'Som', 'potencia' => 100, 'horas_uso' => 2, 'fator_uso' => 0.90],
        ]],
    ],

    'Mini_comercio' => [
        ['nome' => 'Recepção', 'aparelhos' => [
            ['nome' => 'Ar Condicionado', 'potencia' => 1800, 'horas_uso' => 8, 'fator_uso' => 0.70],
            ['nome' => 'Computador', 'potencia' => 200, 'horas_uso' => 8, 'fator_uso' => 0.90],
            ['nome' => 'Bebedouro', 'potencia' => 100, 'horas_uso' => 24, 'fator_uso' => 0.40],
            ['nome' => 'Lâmpadas', 'potencia' => 40, 'horas_uso' => 10, 'fator_uso' => 1.0],
        ]],
        ['nome' => 'Copa', 'aparelhos' => [
            ['nome' => 'Geladeira Pequena', 'potencia' => 100, 'horas_uso' => 24, 'fator_uso' => 0.50],
            ['nome' => 'Microondas', 'potencia' => 1200, 'horas_uso' => 0.1, 'fator_uso' => 1.0],
            ['nome' => 'Cafeteira', 'potencia' => 800, 'horas_uso' => 0.5, 'fator_uso' => 1.0],
        ]],
        ['nome' => 'Banheiro', 'aparelhos' => [
            ['nome' => 'Lâmpada', 'potencia' => 10, 'horas_uso' => 10, 'fator_uso' => 1.0],
            ['nome' => 'Secador de Mãos', 'potencia' => 1500, 'horas_uso' => 0.05, 'fator_uso' => 1.0],
        ]],
    ],

    'Pequeno_escritorio' => [
        ['nome' => 'Sala de Trabalho', 'aparelhos' => [
            ['nome' => '3 Computadores', 'potencia' => 600, 'horas_uso' => 8, 'fator_uso' => 0.90],
            ['nome' => 'Ar Condicionado', 'potencia' => 1800, 'horas_uso' => 8, 'fator_uso' => 0.70],
            ['nome' => 'Impressora', 'potencia' => 300, 'horas_uso' => 0.3, 'fator_uso' => 1.0],
            ['nome' => 'Lâmpadas', 'potencia' => 40, 'horas_uso' => 8, 'fator_uso' => 1.0],
        ]],
        ['nome' => 'Copa', 'aparelhos' => [
            ['nome' => 'Frigobar', 'potencia' => 80, 'horas_uso' => 24, 'fator_uso' => 0.50],
            ['nome' => 'Cafeteira', 'potencia' => 800, 'horas_uso' => 0.1, 'fator_uso' => 1.0],
        ]],
        ['nome' => 'Banheiro', 'aparelhos' => [
            ['nome' => 'Lâmpada', 'potencia' => 10, 'horas_uso' => 8, 'fator_uso' => 1.0],
        ]],
    ],

];

// Seleciona o perfil ou usa um padrão genérico se não encontrar
$perfilSelecionado = $perfis[$imagem] ?? $perfis['Casa_pequena_1_morador'];

try {
    $pdo->beginTransaction();

    error_log("Tentando criar residência - usuarioId: $usuarioId, nome: $nome, imagem: $imagem");
    $sql = "INSERT INTO residencias (usuario_id, nome, imagem, cidade, tarifa_kwh) VALUES (:usuario_id, :nome, :imagem, :cidade, :tarifa) RETURNING id, data_criacao";
    $stmt = $pdo->prepare($sql);
    error_log("SQL preparado: $sql");
    $stmt->execute([
        ':usuario_id' => $usuarioId,
        ':nome' => $nome,
        ':imagem' => $imagem,
        ':cidade' => $cidade,
        ':tarifa' => $tarifa
    ]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    $residenciaId = $row['id'];

    // --- AUTO-POPULAÇÃO DE CÔMODOS E APARELHOS ---
    $stmtComodo = $pdo->prepare("INSERT INTO comodos (residencia_id, nome) VALUES (:residencia_id, :nome) RETURNING id");
    $stmtAparelho = $pdo->prepare("INSERT INTO aparelhos (residencia_id, usuario_id, comodo_id, nome, potencia_watts, horas_uso, fator_uso) VALUES (:residencia_id, :usuario_id, :comodo_id, :nome, :potencia, :horas_uso, :fator_uso)");

    foreach ($perfilSelecionado as $comodo) {
        // Criar Cômodo
        $stmtComodo->execute([
            ':residencia_id' => $residenciaId,
            ':nome' => $comodo['nome']
        ]);
        $comodoRow = $stmtComodo->fetch(PDO::FETCH_ASSOC);
        $comodoId = $comodoRow['id'];

        // Criar Aparelhos do Cômodo
        foreach ($comodo['aparelhos'] as $aparelho) {
            $stmtAparelho->execute([
                ':residencia_id' => $residenciaId,
                ':usuario_id' => $usuarioId,
                ':comodo_id' => $comodoId,
                ':nome' => $aparelho['nome'],
                ':potencia' => $aparelho['potencia'],
                ':horas_uso' => $aparelho['horas_uso'],
                ':fator_uso' => $aparelho['fator_uso'] ?? 1.0
            ]);
        }
    }

    $pdo->commit();
    echo json_encode(['sucesso'=>true,'mensagem'=>'Residência criada com itens padrão','residencia'=>array_merge(['id'=>$row['id']], ['nome'=>$nome,'imagem'=>$imagem,'cidade'=>$cidade,'tarifa_kwh'=>$tarifa,'data_criacao'=>$row['data_criacao']])]);

} catch (PDOException $e) {
    $pdo->rollBack();
    http_response_code(500);
    error_log("Erro create_residencia: ".$e->getMessage());
    echo json_encode(['sucesso'=>false,'mensagem'=>'Erro ao criar residência']);
}
