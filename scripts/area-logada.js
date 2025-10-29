// ========== DADOS (SERÃO PREENCHIDOS DO PHP/POSTGRESQL) ==========

// A variável 'usuarioLogado' será preenchida pelo 'fetch' no carregarDadosUsuario()
let usuarioLogado = {}; // Inicialização vazia

// Buscar do banco de dados (por enquanto, usando localStorage)
let residencias = [];
let residenciaAtual = null;
let aparelhos = [];

// ========== INICIALIZAÇÃO E LISTENERS ==========
document.addEventListener('DOMContentLoaded', function() {
    carregarDadosUsuario(); // Carrega o nome e verifica a sessão
    setupImageSelector();
    setupModalCloseOnOutsideClick();
    setupLogoutListener(); // Configura o botão de sair
});

function setupLogoutListener() {
    const logoutBtn = document.getElementById('logoutBtn') || document.querySelector('.btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
}

// ========== FUNÇÕES DE AUTENTICAÇÃO E INICIALIZAÇÃO ==========

function carregarDadosUsuario() {
    fetch('php/get_usuario_logado.php', {
        method: 'POST',
        body: new URLSearchParams({ acao: 'me' }),
        credentials: 'include' // 🔄 trocado
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Sessão inválida. Redirecionando para login.');
        }
        return response.json();
    })
    .then(data => {
        if (data.sucesso) {
            usuarioLogado = data;
            document.getElementById('userName').textContent = data.nome;
            document.getElementById('userAvatar').textContent = data.nome.charAt(0).toUpperCase();
            carregarResidencias(); 
        } else {
            throw new Error(data.mensagem || 'Falha ao obter dados do usuário.');
        }
    })
    .catch(error => {
        console.error('Erro ao carregar dados do usuário:', error);
        alert('Acesso negado. Por favor, faça login.');
        window.location.href = 'home.html'; 
    });
}

// ========== LOGOUT ==========
function logout() {
    if (confirm('Deseja realmente sair?')) {
        fetch('php/logout.php', { method: 'POST', credentials: 'include' }) // 🔄 trocado
            .then(response => response.json().catch(() => ({ sucesso: true })))
            .then(() => {
                try {
                    localStorage.removeItem('residencias');
                    localStorage.removeItem('aparelhos');
                    localStorage.setItem('logged_out', '1');
                } catch (e) {
                    console.warn('Não foi possível limpar localStorage:', e);
                }
                window.location.href = 'home.html';
            })
            .catch(error => {
                console.error('Erro ao fazer logout:', error);
                window.location.href = 'home.html';
            });
    }
}

// ========== FUNÇÕES DE RESIDÊNCIAS E APARELHOS ==========

function carregarResidencias() {
    fetch('php/get_residencias.php', {
        method: 'GET',
        credentials: 'include' // 🔄 trocado
    })
    .then(response => response.json())
    .then(async data => {
        if (data.sucesso) {
            residencias = data.residencias;
            await Promise.all(residencias.map(async (r) => {
                try {
                    const resp = await fetch(`php/get_aparelho.php?residencia_id=${r.id}`, { 
                        method: 'GET', 
                        credentials: 'include' // 🔄 trocado
                    });
                    const js = await resp.json();
                    r._aparelhosCount = js.sucesso ? (js.aparelhos || []).length : 0;
                } catch (e) {
                    console.error('Erro ao buscar aparelhos para residência', r.id, e);
                    r._aparelhosCount = 0;
                }
            }));
            renderizarResidencias();
        } else {
            console.error('Erro ao carregar residências:', data.mensagem);
        }
    })
    .catch(error => {
        console.error('Erro ao carregar residências:', error);
    });
}

function renderizarResidencias() {
    const grid = document.getElementById('residenciasGrid');
    const addCard = grid.querySelector('.add-residencia-card');
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
    const r = residencias.find(x => Number(x.id) === Number(residenciaId));
    return r && typeof r._aparelhosCount === 'number' ? r._aparelhosCount : 0;
}

// ========== MODAL RESIDÊNCIA ==========
function openModalResidencia() {
    document.getElementById('modalResidencia').classList.add('active');
    document.getElementById('formResidencia').reset();
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

    const formData = new FormData();
    formData.append('nome', nome);
    formData.append('imagem', imagemSelecionada.value);

    fetch('php/create_residencias.php', {
        method: 'POST',
        body: formData,
        credentials: 'include' // 🔄 trocado
    })
    .then(response => response.json())
    .then(data => {
        if (data.sucesso) {
            carregarResidencias();
            closeModalResidencia();
            alert('Residência cadastrada com sucesso!');
        } else {
            alert(data.mensagem || 'Erro ao cadastrar residência');
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('Erro ao cadastrar residência');
    });
}

// ========== VISUALIZAÇÃO DA RESIDÊNCIA ==========
function abrirResidencia(id) {
    residenciaAtual = residencias.find(r => r.id === id);
    if (!residenciaAtual) return;
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
    fetch(`php/get_aparelho.php?residencia_id=${residenciaId}`, {
        method: 'GET',
        credentials: 'include' // 🔄 trocado
    })
    .then(response => response.json())
    .then(data => {
        if (data.sucesso) {
            aparelhos = data.aparelhos;
            renderizarAparelhos();
        } else {
            console.error('Erro ao carregar aparelhos:', data.mensagem);
            aparelhos = [];
            renderizarAparelhos();
        }
    })
    .catch(error => {
        console.error('Erro ao carregar aparelhos:', error);
        aparelhos = [];
        renderizarAparelhos();
    });
}

function renderizarAparelhos() {
    const grid = document.getElementById('aparelhosGrid');
    const emptyState = document.getElementById('emptyState');
    
    grid.innerHTML = '';

    if (!aparelhos || aparelhos.length === 0) {
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';

    aparelhos.forEach(aparelho => {
        const consumoDiario = (aparelho.potencia_watts * aparelho.horas_uso) / 1000; // kWh
        const consumoMensal = consumoDiario * 30;
        
        const card = document.createElement('div');
        card.className = 'aparelho-card';
        card.innerHTML = `
            <div class="aparelho-icon">⚡</div>
            <div class="aparelho-nome">${aparelho.nome}</div>
            <div class="aparelho-info">
                <div class="aparelho-info-item">
                    <span class="aparelho-info-label">Potência:</span>
                    <span>${aparelho.potencia_watts}W</span>
                </div>
                <div class="aparelho-info-item">
                    <span class="aparelho-info-label">Uso diário:</span>
                    <span>${aparelho.horas_uso}h</span>
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

    if (!residenciaAtual || !residenciaAtual.id) {
        alert('Erro: selecione uma residência antes de cadastrar o aparelho');
        return;
    }

    const formData = new FormData();
    formData.append('nome', nome);
    formData.append('potencia', potencia);
    formData.append('horas', horasUso);
    formData.append('residencia_id', residenciaAtual.id);

    fetch('php/create_aparelho.php', {
        method: 'POST',
        body: formData,
        credentials: 'include' // ✅ já estava certo
    })
    .then(response => response.json())
    .then(data => {
        if (data.sucesso) {
            carregarAparelhos(residenciaAtual.id);
            closeModalAparelho();
            const r = residencias.find(x => Number(x.id) === Number(residenciaAtual.id));
            if (r) r._aparelhosCount = (r._aparelhosCount || 0) + 1;
            renderizarResidencias();
            alert('Aparelho cadastrado com sucesso!');
        } else {
            alert(data.mensagem || 'Erro ao cadastrar aparelho');
        }
    })
    .catch(error => {
        console.error('Erro ao cadastrar aparelho:', error);
        alert('Erro ao cadastrar aparelho');
    });
}

function deletarAparelho(id) {
    if (!confirm('Deseja realmente remover este aparelho?')) return;

    fetch('php/delete_aparelho.php', {
        method: 'POST',
        credentials: 'include', // 🔄 trocado
        body: new URLSearchParams({ id })
    })
    .then(response => response.json())
    .then(data => {
        if (data.sucesso) {
            carregarAparelhos(residenciaAtual.id);
            renderizarResidencias();
            alert('Aparelho removido com sucesso!');
        } else {
            alert(data.mensagem || 'Erro ao remover aparelho');
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('Erro ao remover aparelho');
    });
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