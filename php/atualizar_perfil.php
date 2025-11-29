<?php
session_start();
header('Content-Type: application/json');
require 'conexao.php';

$usuarioId = $_SESSION['usuario_id'] ?? null;
if (!$usuarioId) {
    echo json_encode(['sucesso' => false, 'mensagem' => 'Usuário não autenticado']);
    exit;
}

$acao = $_POST['acao'] ?? '';

try {
    switch ($acao) {
        case 'atualizar':
            $nome = trim($_POST['nome'] ?? '');
            $email = trim($_POST['email'] ?? '');
            $telefone = trim($_POST['telefone'] ?? '');

            if (empty($nome) || empty($email)) {
                echo json_encode(['sucesso' => false, 'mensagem' => 'Nome e e-mail são obrigatórios']);
                exit;
            }

            // Verifica se o e-mail já está em uso por outro usuário
            $checkEmail = $pdo->prepare("SELECT id FROM usuarios WHERE email = :email AND id != :id");
            $checkEmail->execute([':email' => $email, ':id' => $usuarioId]);
            if ($checkEmail->fetch()) {
                echo json_encode(['sucesso' => false, 'mensagem' => 'Este e-mail já está em uso por outra conta']);
                exit;
            }

            $sql = "UPDATE usuarios SET nome = :nome, email = :email, telefone = :telefone WHERE id = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':nome' => $nome,
                ':email' => $email,
                ':telefone' => $telefone ?: null,
                ':id' => $usuarioId
            ]);

            echo json_encode(['sucesso' => true, 'mensagem' => 'Dados atualizados com sucesso']);
            break;

        case 'alterar_senha':
            $senhaAtual = $_POST['senha_atual'] ?? '';
            $novaSenha = $_POST['nova_senha'] ?? '';

            if (empty($senhaAtual) || empty($novaSenha)) {
                echo json_encode(['sucesso' => false, 'mensagem' => 'Preencha todos os campos']);
                exit;
            }

            if (strlen($novaSenha) < 6) {
                echo json_encode(['sucesso' => false, 'mensagem' => 'A nova senha deve ter pelo menos 6 caracteres']);
                exit;
            }

            // Busca a senha atual do usuário
            $stmt = $pdo->prepare("SELECT senha FROM usuarios WHERE id = :id");
            $stmt->execute([':id' => $usuarioId]);
            $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$usuario || !password_verify($senhaAtual, $usuario['senha'])) {
                echo json_encode(['sucesso' => false, 'mensagem' => 'Senha atual incorreta']);
                exit;
            }

            // Atualiza a senha
            $novaSenhaHash = password_hash($novaSenha, PASSWORD_DEFAULT);
            $updateSenha = $pdo->prepare("UPDATE usuarios SET senha = :senha WHERE id = :id");
            $updateSenha->execute([':senha' => $novaSenhaHash, ':id' => $usuarioId]);

            echo json_encode(['sucesso' => true, 'mensagem' => 'Senha alterada com sucesso']);
            break;

        case 'excluir_conta':
            $senha = $_POST['senha'] ?? '';

            if (empty($senha)) {
                echo json_encode(['sucesso' => false, 'mensagem' => 'Digite sua senha para confirmar']);
                exit;
            }

            // Verifica a senha
            $stmt = $pdo->prepare("SELECT senha FROM usuarios WHERE id = :id");
            $stmt->execute([':id' => $usuarioId]);
            $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$usuario || !password_verify($senha, $usuario['senha'])) {
                echo json_encode(['sucesso' => false, 'mensagem' => 'Senha incorreta']);
                exit;
            }

            // Exclui todos os dados do usuário (cascata se configurado no BD, ou manual)
            // Ordem: aparelhos -> cômodos -> residências -> usuário
            
            // Busca residências do usuário
            $resStmt = $pdo->prepare("SELECT id FROM residencias WHERE usuario_id = :uid");
            $resStmt->execute([':uid' => $usuarioId]);
            $residencias = $resStmt->fetchAll(PDO::FETCH_COLUMN);

            if (!empty($residencias)) {
                $resIds = implode(',', array_map('intval', $residencias));
                
                // Busca cômodos dessas residências
                $comStmt = $pdo->query("SELECT id FROM comodos WHERE residencia_id IN ($resIds)");
                $comodos = $comStmt->fetchAll(PDO::FETCH_COLUMN);

                if (!empty($comodos)) {
                    $comIds = implode(',', array_map('intval', $comodos));
                    // Exclui aparelhos
                    $pdo->exec("DELETE FROM aparelhos WHERE comodo_id IN ($comIds)");
                }

                // Exclui cômodos
                $pdo->exec("DELETE FROM comodos WHERE residencia_id IN ($resIds)");
                
                // Exclui residências
                $pdo->exec("DELETE FROM residencias WHERE usuario_id = $usuarioId");
            }

            // Exclui aparelhos órfãos (se houver direto no usuário)
            $pdo->prepare("DELETE FROM aparelhos WHERE usuario_id = :uid")->execute([':uid' => $usuarioId]);

            // Exclui o usuário
            $pdo->prepare("DELETE FROM usuarios WHERE id = :id")->execute([':id' => $usuarioId]);

            // Destrói a sessão
            session_destroy();

            echo json_encode(['sucesso' => true, 'mensagem' => 'Conta excluída com sucesso']);
            break;

        default:
            echo json_encode(['sucesso' => false, 'mensagem' => 'Ação inválida']);
    }

} catch (PDOException $e) {
    error_log("Erro atualizar_perfil: " . $e->getMessage());
    echo json_encode(['sucesso' => false, 'mensagem' => 'Erro interno do servidor']);
}
?>