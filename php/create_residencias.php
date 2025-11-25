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
$imagem = trim($_POST['imagem'] ?? '');
$cidade = trim($_POST['cidade'] ?? '');
$tarifa = floatval($_POST['tarifa'] ?? 0);

if ($nome === '' || $imagem === '') {
    echo json_encode(['sucesso'=>false,'mensagem'=>'Nome e imagem são obrigatórios']);
    exit;
}

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
    $padroes = [
        [
            "nome" => "Cozinha",
            "aparelhos" => [
                [ "nome" => "Geladeira", "potencia" => 150, "horas_uso" => 24 ],
                [ "nome" => "Microondas", "potencia" => 1200, "horas_uso" => 0.5 ],
                [ "nome" => "Fogão Elétrico", "potencia" => 1500, "horas_uso" => 1 ]
            ]
        ],
        [
            "nome" => "Sala",
            "aparelhos" => [
                [ "nome" => "TV", "potencia" => 120, "horas_uso" => 4 ],
                [ "nome" => "Ar Condicionado", "potencia" => 1400, "horas_uso" => 8 ],
                [ "nome" => "Lâmpada LED", "potencia" => 10, "horas_uso" => 6 ]
            ]
        ],
        [
            "nome" => "Quarto",
            "aparelhos" => [
                [ "nome" => "Ar Condicionado", "potencia" => 1200, "horas_uso" => 8 ],
                [ "nome" => "Computador", "potencia" => 300, "horas_uso" => 4 ],
                [ "nome" => "Lâmpada LED", "potencia" => 10, "horas_uso" => 6 ]
            ]
        ],
        [
            "nome" => "Banheiro",
            "aparelhos" => [
                [ "nome" => "Chuveiro Elétrico", "potencia" => 5500, "horas_uso" => 0.5 ],
                [ "nome" => "Secador de Cabelo", "potencia" => 1000, "horas_uso" => 0.2 ]
            ]
        ],
        [
            "nome" => "Lavanderia",
            "aparelhos" => [
                [ "nome" => "Máquina de Lavar", "potencia" => 500, "horas_uso" => 1 ],
                [ "nome" => "Ferro de Passar", "potencia" => 1000, "horas_uso" => 0.5 ]
            ]
        ]
    ];

    $stmtComodo = $pdo->prepare("INSERT INTO comodos (residencia_id, nome) VALUES (:residencia_id, :nome) RETURNING id");
    $stmtAparelho = $pdo->prepare("INSERT INTO aparelhos (residencia_id, usuario_id, comodo_id, nome, potencia_watts, horas_uso) VALUES (:residencia_id, :usuario_id, :comodo_id, :nome, :potencia, :horas_uso)");

    foreach ($padroes as $comodo) {
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
                ':horas_uso' => $aparelho['horas_uso']
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
