<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // Permite que outros sites consumam sua API (opcional)

// Simulação de um Banco de Dados de Tarifas (Valores médios B1 Residencial com impostos)
// Fonte aproximada: ANEEL 2024
$tarifas_por_estado = [
    'AC' => 0.82, 'AL' => 0.78, 'AP' => 0.75, 'AM' => 0.85,
    'BA' => 0.79, 'CE' => 0.76, 'DF' => 0.68, 'ES' => 0.72,
    'GO' => 0.70, 'MA' => 0.88, 'MT' => 0.75, 'MS' => 0.78,
    'MG' => 0.72, 'PA' => 0.96, 'PB' => 0.74, 'PR' => 0.65,
    'PE' => 0.76, 'PI' => 0.80, 'RJ' => 0.89, 'RN' => 0.73,
    'RS' => 0.69, 'RO' => 0.75, 'RR' => 0.70, 'SC' => 0.62,
    'SP' => 0.70, 'SE' => 0.74, 'TO' => 0.79
];

// Overrides para cidades específicas (Ex: Cidades da sua região que podem ter distribuidoras diferentes)
$tarifas_cidades_especificas = [
    'ARARAS' => 0.71,       // Elektro
    'RIO CLARO' => 0.72,    // Elektro
    'LEME' => 0.71,         // Elektro
    'LIMEIRA' => 0.71,      // Elektro
    'SAO PAULO' => 0.68,    // Enel SP
    'CAMPINAS' => 0.74,     // CPFL Paulista
    'RIO DE JANEIRO' => 0.92 // Light
];

// Configuração da Bandeira Tarifária Atual (Isso poderia vir de um banco de dados administrativo)
// verde, amarela, vermelha1, vermelha2, escassez
$bandeira_atual = 'vermelha1'; 

$valores_bandeiras = [
    'verde' => 0.00,
    'amarela' => 0.01885,
    'vermelha1' => 0.04463,
    'vermelha2' => 0.07877,
    'escassez' => 0.14200
];

// Recebe a cidade via GET
$cidade_input = isset($_GET['cidade']) ? mb_strtoupper(trim($_GET['cidade']), 'UTF-8') : '';
$uf_input = isset($_GET['uf']) ? mb_strtoupper(trim($_GET['uf']), 'UTF-8') : 'SP'; // Default SP

$tarifa_base = 0.70; // Valor fallback padrão nacional

// 1. Tenta achar a cidade específica
if (array_key_exists($cidade_input, $tarifas_cidades_especificas)) {
    $tarifa_base = $tarifas_cidades_especificas[$cidade_input];
    $fonte = "Específica (Cidade)";
} 
// 2. Tenta achar pelo Estado (UF)
elseif (array_key_exists($uf_input, $tarifas_por_estado)) {
    $tarifa_base = $tarifas_por_estado[$uf_input];
    $fonte = "Média Estadual ($uf_input)";
} 
else {
    $fonte = "Média Nacional (Fallback)";
}

// Calcula o adicional da bandeira
$adicional_bandeira = $valores_bandeiras[$bandeira_atual];
$tarifa_final = $tarifa_base + $adicional_bandeira;

// Retorna o JSON
echo json_encode([
    'sucesso' => true,
    'cidade' => $cidade_input,
    'uf' => $uf_input,
    'tarifa_base' => $tarifa_base,
    'bandeira' => [
        'tipo' => $bandeira_atual,
        'adicional' => $adicional_bandeira
    ],
    'tarifa_final' => round($tarifa_final, 4),
    'fonte_dados' => $fonte,
    'timestamp' => date('Y-m-d H:i:s')
]);
?>