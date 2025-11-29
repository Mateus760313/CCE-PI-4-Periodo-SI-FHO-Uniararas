<?php
session_start();
header('Content-Type: application/json');
require 'conexao.php';

$usuarioId = $_SESSION['usuario_id'] ?? null;
if (!$usuarioId) {
    echo json_encode(['sucesso' => false, 'mensagem' => 'Usuário não autenticado']);
    exit;
}

// Verifica se há arquivo enviado
if (!isset($_FILES['foto']) || $_FILES['foto']['error'] !== UPLOAD_ERR_OK) {
    $erros = [
        UPLOAD_ERR_INI_SIZE => 'Arquivo muito grande (limite do servidor)',
        UPLOAD_ERR_FORM_SIZE => 'Arquivo muito grande (limite do formulário)',
        UPLOAD_ERR_PARTIAL => 'Upload incompleto',
        UPLOAD_ERR_NO_FILE => 'Nenhum arquivo enviado',
        UPLOAD_ERR_NO_TMP_DIR => 'Pasta temporária não encontrada',
        UPLOAD_ERR_CANT_WRITE => 'Falha ao gravar arquivo',
        UPLOAD_ERR_EXTENSION => 'Upload bloqueado por extensão'
    ];
    $erro = $_FILES['foto']['error'] ?? UPLOAD_ERR_NO_FILE;
    echo json_encode(['sucesso' => false, 'mensagem' => $erros[$erro] ?? 'Erro no upload']);
    exit;
}

$arquivo = $_FILES['foto'];

// Validações
$tiposPermitidos = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
$tamanhoMaximo = 5 * 1024 * 1024; // 5MB

// Verifica o tipo MIME real do arquivo
$finfo = new finfo(FILEINFO_MIME_TYPE);
$tipoReal = $finfo->file($arquivo['tmp_name']);

if (!in_array($tipoReal, $tiposPermitidos)) {
    echo json_encode(['sucesso' => false, 'mensagem' => 'Tipo de arquivo não permitido. Use JPG, PNG, GIF ou WebP.']);
    exit;
}

if ($arquivo['size'] > $tamanhoMaximo) {
    echo json_encode(['sucesso' => false, 'mensagem' => 'Arquivo muito grande. Máximo: 5MB']);
    exit;
}

// Gera nome único para o arquivo
$extensao = pathinfo($arquivo['name'], PATHINFO_EXTENSION);
$nomeArquivo = 'user_' . $usuarioId . '_' . time() . '.' . strtolower($extensao);

// Define o diretório de upload
$diretorioUpload = dirname(__DIR__) . '/uploads/perfil/';

// Cria o diretório se não existir
if (!is_dir($diretorioUpload)) {
    mkdir($diretorioUpload, 0755, true);
}

$caminhoCompleto = $diretorioUpload . $nomeArquivo;

try {
    // Busca foto antiga para deletar
    $stmtAntiga = $pdo->prepare("SELECT foto_perfil FROM usuarios WHERE id = :id");
    $stmtAntiga->execute([':id' => $usuarioId]);
    $fotoAntiga = $stmtAntiga->fetchColumn();
    
    // Move o arquivo para o diretório de uploads
    if (move_uploaded_file($arquivo['tmp_name'], $caminhoCompleto)) {
        
        // Caminho relativo para salvar no banco
        $caminhoRelativo = 'uploads/perfil/' . $nomeArquivo;
        
        // Atualiza no banco de dados
        $sql = "UPDATE usuarios SET foto_perfil = :foto WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':foto' => $caminhoRelativo,
            ':id' => $usuarioId
        ]);
        
        // Deleta a foto antiga se existir
        if ($fotoAntiga && file_exists(dirname(__DIR__) . '/' . $fotoAntiga)) {
            unlink(dirname(__DIR__) . '/' . $fotoAntiga);
        }
        
        // Atualiza a sessão
        $_SESSION['usuario_foto'] = $caminhoRelativo;
        
        echo json_encode([
            'sucesso' => true, 
            'mensagem' => 'Foto atualizada com sucesso!',
            'foto_url' => $caminhoRelativo
        ]);
        
    } else {
        echo json_encode(['sucesso' => false, 'mensagem' => 'Erro ao salvar o arquivo']);
    }
    
} catch (PDOException $e) {
    error_log("Erro upload foto: " . $e->getMessage());
    echo json_encode(['sucesso' => false, 'mensagem' => 'Erro ao atualizar banco de dados']);
}
?>
