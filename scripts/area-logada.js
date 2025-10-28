// ========== DADOS SIMULADOS (SUBSTITUIR POR PHP/POSTGRESQL) ==========

// TODO: Buscar do PHP/PostgreSQL via sessão
const usuarioLogado = {
    id: 1,
    nome: "João Silva", // Virá do PHP via $_SESSION
    email: "joao@email.com"
};

// TODO: Buscar do banco de dados
let residencias = [];
let residenciaAtual = null;
let aparelhos = [];

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', function() {
    carregarDadosUsuario();
    carregarResidencias();
    setupImageSelector();
    setupModalCloseOnOutsideClick();
});

function carregarDadosUsuario() {
    // TODO: Pegar dados do PHP via AJAX ou variável JavaScript injetada no HTML
    /*
    fetch('php/get_usuario_logado.php')
        .then(response => response.json())
        .then(data => {
            usuarioLogado.nome = data.nome;
            usuarioLogado.email = data.email;
            document.getElementById('userName').textContent = data.nome;
            document.getElementById('userAvatar').textContent = data.nome.charAt(0).toUpperCase();
        });
    */
    
    document.getElementById('userName').textContent = usuarioLogado.nome;
    document.getElementById('userAvatar').textContent = usuarioLogado.nome.charAt(0).toUpperCase();
}

function carregarResidencias() {
    // TODO: Fazer requisição AJAX para buscar residências do banco
    /*
    fetch('php/get_residencias.php')
        .then(response => response.json())
        .then(data => {
            residencias = data.residencias;
            renderizarResidencias();
        })
        .catch(error => {
            console.error('Erro ao carregar residências:', error);
        });
    */
    
    // Por enquanto, carrega do localStorage
    const saved = localStorage.getItem('residencias');
    if (saved) {
        residencias = JSON.parse(saved);
    }
    renderizarResidencias();
}

function renderizarResidencias() {
    const grid = document.getElementById('residenciasGrid');
    const addCard = grid.querySelector('.add-residencia-card');
    
    // Limpa cards existentes (exceto o de adicionar)
    grid.querySelectorAll('.residencia-card:not(.add-residencia-card)').forEach(card => card.remove());

    residencias.forEach(residencia => {
        const card = document.createElement('div');
        card.className = 'residencia-card';
        card.onclick = () => abrirResidencia(residencia.id);
        
        const imagemUrl = getImagemUrl(residencia.imagem);
        
        card.innerHTML = `
            <img class="residencia-image" src="${imagemUrl}" alt="${residencia.nome}">
            <div class="residencia-info">
                <div class="residencia-nome">${residencia.nome}</div>
                <div class="residencia-meta">${contarAparelhos(residencia.id)} aparelhos cadastrados</div>
            </div>
        `;
        
        grid.insertBefore(card, addCard);
    });
}

function getImagemUrl(tipo) {
    const imagens = {
        'casa': 'https://img.icons8.com/fluency/96/home.png',
        'apartamento': 'https://img.icons8.com/fluency/96/building.png',
        'sitio': 'https://img.icons8.com/fluency/96/cottage.png',
        'comercial': 'https://img.icons8.com/fluency/96/shop.png',
        'escritorio': 'https://img.icons8.com/fluency/96/office.png'
    };
    return imagens[tipo] || imagens['casa'];
}

function contarAparelhos(residenciaId) {
    // TODO: Contar do banco de dados
    const todosAparelhos = JSON.parse(localStorage.getItem('aparelhos') || '[]');
    return todosAparelhos.filter(a => a.residenciaId === residenciaId).length;
}

// ========== MODAL RESIDÊNCIA ==========
function openModalResidencia() {
    document.getElementById('modalResidencia').classList.add('active');
    document.getElementById('formResidencia').reset();
    // Remove seleção visual dos ícones
    document.querySelectorAll('.image-option').forEach(opt => opt.classList.remove('selected'));
}

function closeModalResidencia() {
    document.getElementById('modalResidencia').classList.remove('active');
}

function setupImageSelector() {
    document.querySelectorAll('.image-option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('.image-option').forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            this.querySelector('input').checked = true;
        });
    });
}

function cadastrarResidencia(event) {
    event.preventDefault();
    
    const nome = document.getElementById('nomeResidencia').value;
    const imagemSelecionada = document.querySelector('input[name="imagemResidencia"]:checked');
    
    if (!imagemSelecionada) {
        alert('Por favor, selecione um ícone para a residência');
        return;
    }

    const novaResidencia = {
        id: Date.now(),
        nome: nome,
        imagem: imagemSelecionada.value,
        usuarioId: usuarioLogado.id // Para vincular ao usuário
    };

    // TODO: Enviar para o banco via AJAX
    /*
    fetch('php/salvar_residencia.php', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(novaResidencia)
    })
    .then(response => response.json())
    .then(data => {
        if(data.sucesso) {
            residencias.push(data.residencia);
            renderizarResidencias();
            closeModalResidencia();
            alert('Residência cadastrada com sucesso!');
        } else {
            alert('Erro ao cadastrar residência: ' + data.mensagem);
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('Erro ao cadastrar residência');
    });
    */

    // Por enquanto salva no localStorage
    residencias.push(novaResidencia);
    localStorage.setItem('residencias', JSON.stringify(residencias));
    
    renderizarResidencias();
    closeModalResidencia();
    
    alert('Residência cadastrada com sucesso!');
}

// ========== VISUALIZAÇÃO DA RESIDÊNCIA ==========
function abrirResidencia(id) {
    residenciaAtual = residencias.find(r => r.id === id);
    
    if (!residenciaAtual) return;

    // TODO: Carregar aparelhos do banco
    carregarAparelhos(id);

    document.getElementById('dashboardView').style.display = 'none';
    document.getElementById('residenciaView').classList.add('active');
    
    document.getElementById('residenciaNomeDetalhe').textContent = residenciaAtual.nome;
    document.getElementById('residenciaImagemDetalhe').src = getImagemUrl(residenciaAtual.imagem);
    
    renderizarAparelhos();
}

function voltarDashboard() {
    document.getElementById('residenciaView').classList.remove('active');
    document.getElementById('dashboardView').style.display = 'block';
    residenciaAtual = null;
}

function carregarAparelhos(residenciaId) {
    // TODO: Buscar do banco via AJAX
    /*
    fetch('php/get_aparelhos.php?residencia_id=' + residenciaId)
        .then(response => response.json())
        .then(data => {
            aparelhos = data.aparelhos;
            renderizarAparelhos();
        })
        .catch(error => {
            console.error('Erro ao carregar aparelhos:', error);
        });
    */
    
    // Por enquanto busca do localStorage
    const saved = localStorage.getItem('aparelhos');
    if (saved) {
        aparelhos = JSON.parse(saved).filter(a => a.residenciaId === residenciaId);
    } else {
        aparelhos = [];
    }
}

function renderizarAparelhos() {
    const grid = document.getElementById('aparelhosGrid');
    const emptyState = document.getElementById('emptyState');
    
    grid.innerHTML = '';

    if (aparelhos.length === 0) {
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';

    aparelhos.forEach(aparelho => {
        const consumoDiario = (aparelho.potencia * aparelho.horasUso) / 1000; // kWh
        const consumoMensal = consumoDiario * 30;
        
        const card = document.createElement('div');
        card.className = 'aparelho-card';
        card.innerHTML = `
            <div class="aparelho-icon">⚡</div>
            <div class="aparelho-nome">${aparelho.nome}</div>
            <div class="aparelho-info">
                <div class="aparelho-info-item">
                    <span class="aparelho-info-label">Potência:</span>
                    <span>${aparelho.potencia}W</span>
                </div>
                <div class="aparelho-info-item">
                    <span class="aparelho-info-label">Uso diário:</span>
                    <span>${aparelho.horasUso}h</span>
                </div>
                <div class="aparelho-info-item">
                    <span class="aparelho-info-label">Consumo/dia:</span>
                    <span>${consumoDiario.toFixed(2)} kWh</span>
                </div>
                <div class="aparelho-info-item">
                    <span class="aparelho-info-label">Consumo/mês:</span>
                    <span>${consumoMensal.toFixed(2)} kWh</span>
                </div>
            </div>
            <div class="aparelho-actions">
                <button class="btn-delete" onclick="deletarAparelho(${aparelho.id})">Remover</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

// ========== MODAL APARELHO ==========
function openModalAparelho() {
    if (!residenciaAtual) {
        alert('Selecione uma residência primeiro');
        return;
    }
    document.getElementById('modalAparelho').classList.add('active');
    document.getElementById('formAparelho').reset();
}

function closeModalAparelho() {
    document.getElementById('modalAparelho').classList.remove('active');
}

function cadastrarAparelho(event) {
    event.preventDefault();
    
    const nome = document.getElementById('nomeAparelho').value;
    const potencia = parseInt(document.getElementById('potenciaAparelho').value);
    const horasUso = parseFloat(document.getElementById('horasUso').value);

    const novoAparelho = {
        id: Date.now(),
        nome: nome,
        potencia: potencia,
        horasUso: horasUso,
        residenciaId: residenciaAtual.id
    };

    // TODO: Salvar no banco via AJAX
    /*
    fetch('php/salvar_aparelho.php', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(novoAparelho)
    })
    .then(response => response.json())
    .then(data => {
        if(data.sucesso) {
            aparelhos.push(data.aparelho);
            renderizarAparelhos();
            closeModalAparelho();
            renderizarResidencias(); // Atualiza contador
            alert('Aparelho cadastrado com sucesso!');
        } else {
            alert('Erro ao cadastrar aparelho: ' + data.mensagem);
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('Erro ao cadastrar aparelho');
    });
    */

    // Por enquanto salva no localStorage
    aparelhos.push(novoAparelho);
    const todosAparelhos = JSON.parse(localStorage.getItem('aparelhos') || '[]');
    todosAparelhos.push(novoAparelho);
    localStorage.setItem('aparelhos', JSON.stringify(todosAparelhos));
    
    renderizarAparelhos();
    closeModalAparelho();
    renderizarResidencias(); // Atualiza contador
    
    alert('Aparelho cadastrado com sucesso!');
}

function deletarAparelho(id) {
    if (!confirm('Deseja realmente remover este aparelho?')) return;

    // TODO: Deletar do banco via AJAX
    /*
    fetch('php/deletar_aparelho.php', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({id: id})
    })
    .then(response => response.json())
    .then(data => {
        if(data.sucesso) {
            aparelhos = aparelhos.filter(a => a.id !== id);
            renderizarAparelhos();
            renderizarResidencias();
            alert('Aparelho removido com sucesso!');
        } else {
            alert('Erro ao remover aparelho: ' + data.mensagem);
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('Erro ao remover aparelho');
    });
    */

    // Por enquanto remove do localStorage
    aparelhos = aparelhos.filter(a => a.id !== id);
    const todosAparelhos = JSON.parse(localStorage.getItem('aparelhos') || '[]');
    const atualizados = todosAparelhos.filter(a => a.id !== id);
    localStorage.setItem('aparelhos', JSON.stringify(atualizados));
    
    renderizarAparelhos();
    renderizarResidencias();
    
    alert('Aparelho removido com sucesso!');
}

// ========== LOGOUT ==========
function logout() {
    if (confirm('Deseja realmente sair?')) {
        // TODO: Destruir sessão PHP
        /*
        fetch('php/logout.php')
            .then(() => {
                window.location.href = 'index.html';
            })
            .catch(error => {
                console.error('Erro ao fazer logout:', error);
                window.location.href = 'index.html';
            });
        */
        
        // Por enquanto apenas redireciona
        window.location.href = 'index.html';
    }
}

// ========== FECHAR MODAIS AO CLICAR FORA ==========
function setupModalCloseOnOutsideClick() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
            }
        });
    });
}