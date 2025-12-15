let usuarioLogado = {};
let modoEdicao = false;

document.addEventListener('DOMContentLoaded', function() {
    const themeToggle = document.getElementById('themeToggle');
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme && savedTheme !== 'auto') {
        document.documentElement.setAttribute('data-theme', savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
    
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }

    carregarDadosUsuario();
    setupTabs();
    setupFormDados();
    setupPasswordStrength();
    setupUserDropdown();
    atualizarTemaVisual();
    setupUploadFoto();
    setupPreferencias();
});

function carregarDadosUsuario() {
    fetch('php/get_usuario_logado.php', {
        method: 'POST',
        body: new URLSearchParams({ acao: 'me' }),
        credentials: 'include'
    })
    .then(response => {
        if (!response.ok) throw new Error('Sessão inválida');
        return response.json();
    })
    .then(data => {
        if (data.sucesso) {
            usuarioLogado = data;
            preencherDadosPerfil(data);
            carregarEstatisticas();
        } else {
            throw new Error(data.mensagem || 'Erro ao carregar dados');
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('Sessão expirada. Redirecionando para login...');
        window.location.href = 'home.html';
    });
}

function preencherDadosPerfil(data) {
    const inicial = data.nome.charAt(0).toUpperCase();
    const temFoto = data.foto_perfil && data.foto_perfil.length > 0;
    
    const userAvatar = document.getElementById('userAvatar');
    const userAvatarImg = document.getElementById('userAvatarImg');
    const dropdownAvatar = document.getElementById('dropdownAvatar');
    const dropdownAvatarImg = document.getElementById('dropdownAvatarImg');
    const dropdownName = document.getElementById('dropdownName');
    const dropdownEmail = document.getElementById('dropdownEmail');
    
    if (temFoto) {
        if (userAvatar) userAvatar.style.display = 'none';
        if (userAvatarImg) {
            userAvatarImg.src = data.foto_perfil;
            userAvatarImg.style.display = 'block';
        }
        if (dropdownAvatar) dropdownAvatar.style.display = 'none';
        if (dropdownAvatarImg) {
            dropdownAvatarImg.src = data.foto_perfil;
            dropdownAvatarImg.style.display = 'block';
        }
    } else {
        if (userAvatar) {
            userAvatar.textContent = inicial;
            userAvatar.style.display = 'flex';
        }
        if (userAvatarImg) userAvatarImg.style.display = 'none';
        if (dropdownAvatar) {
            dropdownAvatar.textContent = inicial;
            dropdownAvatar.style.display = 'flex';
        }
        if (dropdownAvatarImg) dropdownAvatarImg.style.display = 'none';
    }
    
    if (dropdownName) dropdownName.textContent = data.nome;
    if (dropdownEmail) dropdownEmail.textContent = data.email;
    
    const perfilAvatar = document.getElementById('perfilAvatar');
    const perfilAvatarImg = document.getElementById('perfilAvatarImg');
    const perfilNome = document.getElementById('perfilNome');
    const perfilEmail = document.getElementById('perfilEmail');
    const btnRemoverFoto = document.getElementById('btnRemoverFoto');
    
    if (temFoto) {
        if (perfilAvatar) perfilAvatar.style.display = 'none';
        if (perfilAvatarImg) {
            perfilAvatarImg.src = data.foto_perfil;
            perfilAvatarImg.style.display = 'block';
        }
        if (btnRemoverFoto) btnRemoverFoto.style.display = 'flex';
    } else {
        if (perfilAvatar) {
            perfilAvatar.textContent = inicial;
            perfilAvatar.style.display = 'flex';
        }
        if (perfilAvatarImg) perfilAvatarImg.style.display = 'none';
        if (btnRemoverFoto) btnRemoverFoto.style.display = 'none';
    }
    
    if (perfilNome) perfilNome.textContent = data.nome;
    if (perfilEmail) perfilEmail.textContent = data.email;
    
    document.getElementById('inputNome').value = data.nome;
    document.getElementById('inputEmail').value = data.email;
    document.getElementById('inputTelefone').value = data.telefone || '';

    const checkRelatorio = document.getElementById('relatorioSemanal');
    const checkAlertas = document.getElementById('alertaConsumo');

    if (checkRelatorio) checkRelatorio.checked = data.receber_email_semanal === true || data.receber_email_semanal === 't';
    if (checkAlertas) checkAlertas.checked = data.receber_alertas === true || data.receber_alertas === 't';
    
    if (data.criado_em) {
        const dataCriacao = new Date(data.criado_em);
        const mesAno = dataCriacao.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
        const statMembro = document.getElementById('statMembro');
        if (statMembro) statMembro.textContent = mesAno;
    }
}

function carregarEstatisticas() {
    fetch('php/get_residencias.php', { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
            if (data.sucesso) {
                const residencias = data.residencias;
                document.getElementById('statResidencias').textContent = residencias.length;
                
                let totalAparelhos = 0;
                residencias.forEach(r => {
                    totalAparelhos += parseInt(r.total_aparelhos || 0);
                });
                document.getElementById('statAparelhos').textContent = totalAparelhos;
            }
        })
        .catch(err => console.error('Erro ao carregar estatísticas:', err));
}

function setupTabs() {
    const tabs = document.querySelectorAll('.perfil-tab');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetId = tab.dataset.tab;
            
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            document.getElementById(`tab-${targetId}`).classList.add('active');
        });
    });
}

function setupFormDados() {
    const btnEditar = document.getElementById('btnEditarDados');
    const form = document.getElementById('formDadosPessoais');
    
    btnEditar.addEventListener('click', () => {
        habilitarEdicao(true);
    });
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        salvarDadosPessoais();
    });
}

function habilitarEdicao(habilitar) {
    modoEdicao = habilitar;
    const inputs = ['inputNome', 'inputEmail', 'inputTelefone'];
    const actions = document.getElementById('actionsEditarDados');
    const btnEditar = document.getElementById('btnEditarDados');
    
    inputs.forEach(id => {
        document.getElementById(id).disabled = !habilitar;
    });
    
    actions.style.display = habilitar ? 'flex' : 'none';
    btnEditar.style.display = habilitar ? 'none' : 'flex';
    
    if (habilitar) {
        document.getElementById('inputNome').focus();
    }
}

function cancelarEdicaoDados() {
    document.getElementById('inputNome').value = usuarioLogado.nome;
    document.getElementById('inputEmail').value = usuarioLogado.email;
    document.getElementById('inputTelefone').value = usuarioLogado.telefone || '';
    
    habilitarEdicao(false);
}

function salvarDadosPessoais() {
    const nome = document.getElementById('inputNome').value.trim();
    const email = document.getElementById('inputEmail').value.trim();
    const telefone = document.getElementById('inputTelefone').value.trim();
    
    if (!nome || !email) {
        alert('Nome e e-mail são obrigatórios');
        return;
    }
    
    const formData = new FormData();
    formData.append('acao', 'atualizar');
    formData.append('nome', nome);
    formData.append('email', email);
    formData.append('telefone', telefone);
    
    fetch('php/atualizar_perfil.php', {
        method: 'POST',
        body: formData,
        credentials: 'include'
    })
    .then(res => res.json())
    .then(data => {
        if (data.sucesso) {
            alert('Dados atualizados com sucesso!');
            usuarioLogado.nome = nome;
            usuarioLogado.email = email;
            usuarioLogado.telefone = telefone;
            preencherDadosPerfil(usuarioLogado);
            habilitarEdicao(false);
        } else {
            alert(data.mensagem || 'Erro ao atualizar dados');
        }
    })
    .catch(err => {
        console.error('Erro:', err);
        alert('Erro ao atualizar dados');
    });
}

function setupPasswordStrength() {
    const novaSenha = document.getElementById('novaSenha');
    const strengthDiv = document.getElementById('passwordStrength');
    
    novaSenha.addEventListener('input', () => {
        const senha = novaSenha.value;
        const strength = calcularForcaSenha(senha);
        
        strengthDiv.className = 'password-strength ' + strength.class;
        strengthDiv.querySelector('.strength-text').textContent = strength.text;
    });
}

function calcularForcaSenha(senha) {
    if (senha.length === 0) {
        return { class: '', text: 'Digite uma senha' };
    }
    
    let pontos = 0;
    
    if (senha.length >= 6) pontos++;
    if (senha.length >= 10) pontos++;
    if (/[A-Z]/.test(senha)) pontos++;
    if (/[0-9]/.test(senha)) pontos++;
    if (/[^A-Za-z0-9]/.test(senha)) pontos++;
    
    if (pontos <= 2) {
        return { class: 'weak', text: 'Senha fraca' };
    } else if (pontos <= 4) {
        return { class: 'medium', text: 'Senha média' };
    } else {
        return { class: 'strong', text: 'Senha forte' };
    }
}

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    input.type = input.type === 'password' ? 'text' : 'password';
}

function alterarSenha(event) {
    event.preventDefault();
    
    const senhaAtual = document.getElementById('senhaAtual').value;
    const novaSenha = document.getElementById('novaSenha').value;
    const confirmarSenha = document.getElementById('confirmarSenha').value;
    
    if (novaSenha !== confirmarSenha) {
        alert('As senhas não coincidem');
        return;
    }
    
    if (novaSenha.length < 6) {
        alert('A nova senha deve ter pelo menos 6 caracteres');
        return;
    }
    
    const formData = new FormData();
    formData.append('acao', 'alterar_senha');
    formData.append('senha_atual', senhaAtual);
    formData.append('nova_senha', novaSenha);
    
    fetch('php/atualizar_perfil.php', {
        method: 'POST',
        body: formData,
        credentials: 'include'
    })
    .then(res => res.json())
    .then(data => {
        if (data.sucesso) {
            alert('Senha alterada com sucesso!');
            document.getElementById('formAlterarSenha').reset();
            document.getElementById('passwordStrength').className = 'password-strength';
            document.getElementById('passwordStrength').querySelector('.strength-text').textContent = 'Digite uma senha';
        } else {
            alert(data.mensagem || 'Erro ao alterar senha');
        }
    })
    .catch(err => {
        console.error('Erro:', err);
        alert('Erro ao alterar senha');
    });
}

function setTheme(theme) {
    document.querySelectorAll('.theme-option').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.theme === theme) {
            btn.classList.add('active');
        }
    });
    
    if (theme === 'auto') {
        localStorage.removeItem('theme');
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
        }
    } else {
        localStorage.setItem('theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
    }
}

function atualizarTemaVisual() {
    const savedTheme = localStorage.getItem('theme');
    const theme = savedTheme || 'auto';
    
    document.querySelectorAll('.theme-option').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.theme === theme) {
            btn.classList.add('active');
        }
    });
}

function confirmarExclusaoConta() {
    document.getElementById('modalExcluirConta').classList.add('active');
}

function fecharModalExcluirConta() {
    document.getElementById('modalExcluirConta').classList.remove('active');
    document.getElementById('formExcluirConta').reset();
}

function excluirConta(event) {
    event.preventDefault();
    
    const senha = document.getElementById('senhaConfirmacaoExclusao').value;
    const texto = document.getElementById('textoConfirmacaoExclusao').value;
    
    if (texto !== 'EXCLUIR') {
        alert('Digite "EXCLUIR" para confirmar');
        return;
    }
    
    const formData = new FormData();
    formData.append('acao', 'excluir_conta');
    formData.append('senha', senha);
    
    fetch('php/atualizar_perfil.php', {
        method: 'POST',
        body: formData,
        credentials: 'include'
    })
    .then(res => res.json())
    .then(data => {
        if (data.sucesso) {
            alert('Sua conta foi excluída. Você será redirecionado.');
            window.location.href = 'home.html';
        } else {
            alert(data.mensagem || 'Erro ao excluir conta');
        }
    })
    .catch(err => {
        console.error('Erro:', err);
        alert('Erro ao excluir conta');
    });
}

function setupUserDropdown() {
    const trigger = document.getElementById('userTrigger');
    const dropdown = document.getElementById('userDropdown');

    if (trigger && dropdown) {
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('active');
        });

        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target) && !trigger.contains(e.target)) {
                dropdown.classList.remove('active');
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                dropdown.classList.remove('active');
            }
        });
    }
}

function logout() {
    if (confirm('Deseja realmente sair?')) {
        fetch('php/logout.php', { method: 'POST', credentials: 'include' })
            .then(() => {
                localStorage.removeItem('residencias');
                localStorage.removeItem('aparelhos');
                window.location.href = 'home.html';
            })
            .catch(() => {
                window.location.href = 'home.html';
            });
    }
}

document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});

function setupUploadFoto() {
    const inputFoto = document.getElementById('inputFotoPerfil');
    const btnRemover = document.getElementById('btnRemoverFoto');
    
    if (inputFoto) {
        inputFoto.addEventListener('change', handleFotoUpload);
    }
    
    if (btnRemover) {
        btnRemover.addEventListener('click', removerFoto);
    }
}

function handleFotoUpload(event) {
    const file = event.target.files[0];
    
    if (!file) return;
    
    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const tamanhoMaximo = 5 * 1024 * 1024; // 5MB
    
    if (!tiposPermitidos.includes(file.type)) {
        alert('Tipo de arquivo não permitido. Use JPG, PNG, GIF ou WebP.');
        event.target.value = '';
        return;
    }
    
    if (file.size > tamanhoMaximo) {
        alert('Arquivo muito grande. Máximo: 5MB');
        event.target.value = '';
        return;
    }
    
    mostrarLoadingFoto(true);
    
    const formData = new FormData();
    formData.append('foto', file);
    
    fetch('php/upload_foto_perfil.php', {
        method: 'POST',
        body: formData,
        credentials: 'include'
    })
    .then(res => res.json())
    .then(data => {
        mostrarLoadingFoto(false);
        
        if (data.sucesso) {
            usuarioLogado.foto_perfil = data.foto_url;
            preencherDadosPerfil(usuarioLogado);
            alert('Foto atualizada com sucesso!');
        } else {
            alert(data.mensagem || 'Erro ao enviar foto');
        }
    })
    .catch(err => {
        mostrarLoadingFoto(false);
        console.error('Erro:', err);
        alert('Erro ao enviar foto. Tente novamente.');
    })
    .finally(() => {
        event.target.value = '';
    });
}

function removerFoto() {
    if (!confirm('Deseja remover sua foto de perfil?')) return;
    
    mostrarLoadingFoto(true);
    
    fetch('php/remover_foto_perfil.php', {
        method: 'POST',
        credentials: 'include'
    })
    .then(res => res.json())
    .then(data => {
        mostrarLoadingFoto(false);
        
        if (data.sucesso) {
            usuarioLogado.foto_perfil = null;
            preencherDadosPerfil(usuarioLogado);
            alert('Foto removida com sucesso!');
        } else {
            alert(data.mensagem || 'Erro ao remover foto');
        }
    })
    .catch(err => {
        mostrarLoadingFoto(false);
        console.error('Erro:', err);
        alert('Erro ao remover foto. Tente novamente.');
    });
}

function mostrarLoadingFoto(mostrar) {
    const wrapper = document.querySelector('.perfil-avatar-wrapper');
    
    if (!wrapper) return;
    
    const loadingExistente = wrapper.querySelector('.upload-loading');
    if (loadingExistente) {
        loadingExistente.remove();
    }
    
    if (mostrar) {
        const loading = document.createElement('div');
        loading.className = 'upload-loading';
        wrapper.appendChild(loading);
    }
}

function setupPreferencias() {
    const checkRelatorio = document.getElementById('relatorioSemanal');
    const checkAlertas = document.getElementById('alertaConsumo');

    if (checkRelatorio) {
        checkRelatorio.addEventListener('change', (e) => {
            salvarPreferencia('relatorio_semanal', e.target.checked);
        });
    }

    if (checkAlertas) {
        checkAlertas.addEventListener('change', (e) => {
            salvarPreferencia('alertas', e.target.checked);
        });
    }
}

function salvarPreferencia(tipo, valor) {
    const formData = new FormData();
    formData.append('tipo', tipo);
    formData.append('valor', valor);

    fetch('php/update_preferencias.php', {
        method: 'POST',
        body: formData,
        credentials: 'include'
    })
    .then(res => res.json())
    .then(data => {
        if (data.sucesso) {
            console.log('Preferência salva:', tipo, valor);
            if (tipo === 'relatorio_semanal' && valor === true) {
                if (confirm('Relatório semanal ativado! Deseja receber um email de teste agora?')) {
                    enviarEmailTeste();
                }
            }
        } else {
            console.error('Erro ao salvar preferência:', data.mensagem);
            alert('Erro ao salvar preferência. Tente novamente.');
            if (tipo === 'relatorio_semanal') {
                document.getElementById('relatorioSemanal').checked = !valor;
            } else if (tipo === 'alertas') {
                document.getElementById('alertaConsumo').checked = !valor;
            }
        }
    })
    .catch(err => {
        console.error('Erro:', err);
        alert('Erro de conexão.');
    });
}

function enviarEmailTeste() {
    const formData = new FormData();
    formData.append('acao', 'enviar_relatorio_email');
    
    fetch('php/api_relatorios.php', {
        method: 'POST',
        body: formData,
        credentials: 'include'
    })
    .then(res => res.json())
    .then(data => {
        if (data.sucesso) {
            alert('Email de teste enviado com sucesso!');
        } else {
            alert('Erro ao enviar email: ' + data.mensagem);
        }
    })
    .catch(err => console.error(err));
}

function simularConsumo() {
    if (!confirm('Isso irá substituir a potência e horas de uso de TODOS os seus aparelhos por valores de teste. Continuar?')) {
        return;
    }

    const btn = document.querySelector('button[onclick="simularConsumo()"]');
    const originalText = btn ? btn.innerHTML : 'Simular';
    
    if(btn) {
        btn.innerHTML = '<span>⏳</span> Processando...';
        btn.disabled = true;
    }

    fetch('php/simular_consumo.php', {
        method: 'POST',
        credentials: 'include'
    })
    .then(res => res.json())
    .then(data => {
        if (data.sucesso) {
            alert(data.mensagem + '\n' + (data.detalhes || ''));
            carregarEstatisticas();
        } else {
            alert('Erro: ' + data.mensagem);
        }
    })
    .catch(err => {
        console.error(err);
        alert('Erro ao conectar com o servidor.');
    })
    .finally(() => {
        if(btn) {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });
}
