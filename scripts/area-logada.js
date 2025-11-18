// ========== DADOS (SERÃO PREENCHIDOS DO PHP/POSTGRESQL) ==========

// A variável 'usuarioLogado' será preenchida pelo 'fetch' no carregarDadosUsuario()
let usuarioLogado = {}; // Inicialização vazia

// Buscar do banco de dados (por enquanto, usando localStorage)
let residencias = [];
let residenciaAtual = null;
let aparelhos = [];

// [NOVO] Guarda os cômodos da residência selecionada
let comodos = []; 
// [NOVO] Guarda o cômodo selecionado
let comodoAtual = null; 


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
        
        // [HTML ALTERADO AQUI]
        card.innerHTML = `
            <button class="btn-edit-residencia" onclick="openModalResidencia(${residencia.id}, event)">
                &#9998; </button>
            
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
function openModalResidencia(id = null, event = null) {
    if (event) {
        event.stopPropagation(); // Impede que o card seja clicado junto
    }

    const modal = document.getElementById('modalResidencia');
    const form = document.getElementById('formResidencia');
    const modalTitle = modal.querySelector('h2');
    const modalDesc = modal.querySelector('p');
    const submitButton = document.getElementById('btnSalvarResidencia');
    
    form.reset(); // Limpa o formulário
    document.querySelectorAll('.image-option').forEach(opt => opt.classList.remove('selected'));
    delete form.dataset.editId; // Remove qualquer ID de edição anterior

    if (id) {
        // MODO EDIÇÃO
        const residencia = residencias.find(r => r.id === id);
        if (!residencia) {
            console.error('Residência não encontrada para edição');
            return;
        }

        modalTitle.textContent = 'Editar Residência';
        modalDesc.textContent = 'Atualize as informações da sua residência';
        submitButton.textContent = 'Salvar Alterações';
        form.dataset.editId = id; // Armazena o ID no formulário

        // Preenche o formulário
        document.getElementById('nomeResidencia').value = residencia.nome;
        document.getElementById('cidadeResidencia').value = residencia.cidade || '';
        document.getElementById('tarifaResidencia').value = residencia.tarifa_kwh || '';

        // Seleciona a imagem
        const imgInput = document.querySelector(`input[name="imagemResidencia"][value="${residencia.imagem}"]`);
        if (imgInput) {
            imgInput.checked = true;
            imgInput.closest('.image-option').classList.add('selected');
        }

    } else {
        // MODO CRIAÇÃO
        modalTitle.textContent = 'Nova Residência';
        modalDesc.textContent = 'Cadastre uma nova residência para monitoramento';
        submitButton.textContent = 'Cadastrar Residência';
    }

    modal.classList.add('active');
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

function salvarResidencia(event) {
    event.preventDefault();
    const form = document.getElementById('formResidencia');
    const id = form.dataset.editId; // Pega o ID (se for edição)

    const nome = document.getElementById('nomeResidencia').value;
    const cidade = document.getElementById('cidadeResidencia').value;
    const tarifa = parseFloat(document.getElementById('tarifaResidencia').value);
    const imagemSelecionada = document.querySelector('input[name="imagemResidencia"]:checked');

    if (!imagemSelecionada) {
        alert('Por favor, selecione um ícone para a residência');
        return;
    }

    const formData = new FormData();
    formData.append('nome', nome);
    formData.append('cidade', cidade);
    formData.append('tarifa', tarifa);
    formData.append('imagem', imagemSelecionada.value);

    let url = 'php/create_residencias.php'; // Default é criar
    if (id) {
        url = 'php/update_residencias.php'; // Mudar para atualizar se tem ID
        formData.append('id', id); // Envia o ID para o script de update
    }

    fetch(url, {
        method: 'POST',
        body: formData,
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.sucesso) {
            carregarResidencias(); // Recarrega a lista
            closeModalResidencia();
            alert(id ? 'Residência atualizada com sucesso!' : 'Residência cadastrada com sucesso!');
        } else {
            alert(data.mensagem || 'Erro ao salvar residência');
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('Erro ao salvar residência');
    });
}

// ========== VISUALIZAÇÃO DA RESIDÊNCIA ==========
function abrirResidencia(id) {
    residenciaAtual = residencias.find(r => r.id === id);
    if (!residenciaAtual) return;

    // [ALTERADO] Chama a nova função para carregar cômodos
    carregarComodos(residenciaAtual.id); 

    document.getElementById('dashboardView').style.display = 'none';
    document.getElementById('comodoView').classList.remove('active'); // [NOVO] Garante que a view de cômodo está fechada
    document.getElementById('residenciaView').classList.add('active');
    
    // Preenche o cabeçalho da residência
    document.getElementById('residenciaNomeDetalhe').textContent = residenciaAtual.nome;
    document.getElementById('residenciaImagemDetalhe').src = getImagemUrl(residenciaAtual.imagem);

    // [ALTERADO] Limpa e mostra o estado de loading para os cômodos
    document.getElementById('comodosGrid').innerHTML = '';
    document.getElementById('emptyStateComodos').style.display = 'none';
}

function voltarDashboard() {
    document.getElementById('residenciaView').classList.remove('active');
    document.getElementById('comodoView').classList.remove('active'); // [NOVO]
    document.getElementById('dashboardView').style.display = 'block';
    residenciaAtual = null;
    comodoAtual = null; // [NOVO]
}

function voltarParaResidencia() {
    document.getElementById('comodoView').classList.remove('active');
    document.getElementById('residenciaView').classList.add('active');
    comodoAtual = null;
    aparelhos = []; // Limpa os aparelhos
    
    // Recarrega os cômodos para atualizar os KPIs (ex: contagem de aparelhos)
    if (residenciaAtual) {
        carregarComodos(residenciaAtual.id);
    }
}

function carregarComodos(residenciaId) {
    // ❗️ NOTA DE BACK-END:
    // O 'get_comodos.php' deve retornar para cada cômodo:
    // { id, nome, residencia_id, aparelho_count, consumo_total_kwh, custo_total_reais }
    // Os KPIs (consumo e custo) devem vir calculados do back-end.

    fetch(`php/get_comodos.php?residencia_id=${residenciaId}`, {
        method: 'GET',
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.sucesso) {
            comodos = data.comodos;
            renderizarComodos();
        } else {
            console.error('Erro ao carregar cômodos:', data.mensagem);
            comodos = [];
            renderizarComodos();
        }
    })
    .catch(error => {
        console.error('Erro ao carregar cômodos:', error);
        comodos = [];
        renderizarComodos();
    });
}

function carregarAparelhos(comodoId) {
    // ❗️ NOTA DE BACK-END: 'get_aparelho.php' agora filtra por 'comodo_id'
    fetch(`php/get_aparelho.php?comodo_id=${comodoId}`, {
        method: 'GET',
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.sucesso) {
            aparelhos = data.aparelhos;
            renderizarAparelhos(); // Renderiza na comodoView
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


function abrirComodo(id) {
    comodoAtual = comodos.find(c => c.id === id);
    if (!comodoAtual) return;

    // Preenche o breadcrumb na comodoView
    const breadcrumb = document.getElementById('breadcrumbResidencia');
    breadcrumb.textContent = residenciaAtual.nome;

    // Preenche o cabeçalho da comodoView
    document.getElementById('comodoNomeDetalhe').textContent = comodoAtual.nome;
    document.getElementById('comodoImagemDetalhe').src = 'https://img.icons8.com/fluency/96/room.png'; // Ícone padrão

    // Esconde a view da residência e mostra a do cômodo
    document.getElementById('residenciaView').classList.remove('active');
    document.getElementById('comodoView').classList.add('active');

    // [ALTERADO] Chama a função de carregar aparelhos para este cômodo
    carregarAparelhos(comodoAtual.id);
}

function renderizarComodos() {
    const grid = document.getElementById('comodosGrid');
    const emptyState = document.getElementById('emptyStateComodos');
    grid.innerHTML = '';

    let totalKWhResidencia = 0;
    let totalReaisResidencia = 0;
    let comodoMaisConsumo = { nome: '--', consumo: 0 };

    if (!comodos || comodos.length === 0) {
        emptyState.style.display = 'block';
    } else {
        emptyState.style.display = 'none';
        
        comodos.forEach(comodo => {
            // ❗️ Assumindo que o back-end envia 'custo_total_reais' e 'consumo_total_kwh'
            const custoComodo = parseFloat(comodo.custo_total_reais || 0);
            const consumoComodo = parseFloat(comodo.consumo_total_kwh || 0);
            const aparelhoCount = parseInt(comodo.aparelho_count || 0);

            // Soma para os KPIs da Residência
            totalKWhResidencia += consumoComodo;
            totalReaisResidencia += custoComodo;
            
            if (consumoComodo > comodoMaisConsumo.consumo) {
                comodoMaisConsumo = { nome: comodo.nome, consumo: consumoComodo };
            }

            const card = document.createElement('div');
            card.className = 'comodo-card'; // [NOVO] Crie esta classe no seu CSS
            card.onclick = () => abrirComodo(comodo.id);
            
            // Um ícone padrão para cômodo
            const imagemUrl = 'https://img.icons8.com/fluency/96/room.png'; 

            card.innerHTML = `
                <img class="comodo-image" src="${imagemUrl}" alt="${comodo.nome}">
                <div class="comodo-info">
                    <div class="comodo-nome">${comodo.nome}</div>
                    <div class="comodo-meta">${aparelhoCount} aparelhos</div>
                </div>
                <div class="comodo-kpi">
                    <span>${custoComodo.toFixed(2).replace('.', ',')} R$/mês</span>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    // Atualiza os KPIs da Residência (que estão no residencia-header)
    document.getElementById('totalKWhResidencia').textContent = `${totalKWhResidencia.toFixed(2)} kWh`;
    document.getElementById('totalReaisResidencia').textContent = `R$ ${totalReaisResidencia.toFixed(2).replace('.', ',')}`;
    
    // (Opcional) Atualizar o KPI "Cômodo de Maior Consumo" (se você o adicionou)
    // document.getElementById('kpiComodoMaiorConsumo').textContent = comodoMaisConsumo.nome;
}


function renderizarAparelhos() {
    // [ALTERADO] Seleciona os elementos dentro da 'comodoView'
    const grid = document.getElementById('aparelhosGrid'); 
    const emptyState = document.getElementById('emptyStateAparelhos'); // ID do HTML novo
    
    grid.innerHTML = '';

    // Pega a tarifa da residência ATUAL (ela ainda está em 'residenciaAtual')
    const tarifa = parseFloat(residenciaAtual.tarifa_kwh || 0);

    let totalKWhComodo = 0;
    let totalReaisComodo = 0;
    
    // Alerta de tarifa (movido para cá)
    if (tarifa === 0) {
        document.getElementById('totalReaisComodo').textContent = 'R$ --';
        // ... (você pode adicionar o alerta de tarifa aqui se quiser)
    }

    if (!aparelhos || aparelhos.length === 0) {
        emptyState.style.display = 'block';
        document.getElementById('totalKWhComodo').textContent = '0.00 kWh';
        document.getElementById('totalReaisComodo').textContent = 'R$ 0,00';
        return;
    }

    emptyState.style.display = 'none';

    aparelhos.forEach(aparelho => {
        const consumoDiario = (aparelho.potencia_watts * aparelho.horas_uso) / 1000;
        const consumoMensal = consumoDiario * 30;
        const custoMensal = consumoMensal * tarifa;

        // Soma para os KPIs do Cômodo
        totalKWhComodo += consumoMensal;
        totalReaisComodo += custoMensal;
        
        const card = document.createElement('div');
        card.className = 'aparelho-card';
        // O HTML do card continua o mesmo de antes...
        card.innerHTML = `
            <div class="aparelho-icon">⚡</div>
            <div class="aparelho-nome">${aparelho.nome}</div>
            <div class="aparelho-info">
                <div class="aparelho-info-item">
                    <span class="aparelho-info-label">Consumo/mês:</span>
                    <span>${consumoMensal.toFixed(2)} kWh</span>
                </div>
                <div class="aparelho-info-item">
                    <span class="aparelho-info-label">Custo/mês:</span>
                    <span style="font-weight: 600; color: ${tarifa > 0 ? 'var(--primary-color)' : '#888'};">
                        ${tarifa > 0 ? `R$ ${custoMensal.toFixed(2).replace('.', ',')}` : 'R$ --'}
                    </span>
                </div>
            </div>
            <div class="aparelho-actions">
                <button class="btn-delete" onclick="deletarAparelho(${aparelho.id})">Remover</button>
            </div>
        `;
        grid.appendChild(card);
    });

    // [ALTERADO] Atualiza os KPIs do Cômodo (no cabeçalho da comodoView)
    document.getElementById('totalKWhComodo').textContent = `${totalKWhComodo.toFixed(2)} kWh`;
    if (tarifa > 0) {
        document.getElementById('totalReaisComodo').textContent = `R$ ${totalReaisComodo.toFixed(2).replace('.', ',')}`;
    }
}

// ========== MODAL COMODO ==========
function openModalComodo() {
    if (!residenciaAtual) {
        alert('Selecione uma residência primeiro');
        return;
    }
    document.getElementById('modalComodo').classList.add('active');
    document.getElementById('formComodo').reset();
}

function closeModalComodo() {
    document.getElementById('modalComodo').classList.remove('active');
}

function cadastrarComodo(event) {
    event.preventDefault();
    
    const nome = document.getElementById('nomeComodo').value;
    if (!residenciaAtual || !residenciaAtual.id) {
        alert('Erro: ID da residência não encontrado');
        return;
    }

    const formData = new FormData();
    formData.append('nome', nome);
    formData.append('residencia_id', residenciaAtual.id);

    // ❗️ NOTA DE BACK-END: Crie o script 'create_comodo.php'
    fetch('php/create_comodo.php', {
        method: 'POST',
        body: formData,
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.sucesso) {
            carregarComodos(residenciaAtual.id); // Recarrega a lista de cômodos
            closeModalComodo();
            alert('Cômodo cadastrado com sucesso!');
        } else {
            alert(data.mensagem || 'Erro ao cadastrar cômodo');
        }
    })
    .catch(error => {
        console.error('Erro ao cadastrar cômodo:', error);
        alert('Erro ao cadastrar cômodo');
    });
}


// ========== MODAL APARELHO ==========
function openModalAparelho() {
    // [ALTERADO] Verifica se um cômodo está selecionado
    if (!comodoAtual) { 
        alert('Selecione um cômodo primeiro');
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

    // [ALTERADO] Validação
    if (!comodoAtual || !comodoAtual.id) {
        alert('Erro: selecione um cômodo antes de cadastrar o aparelho');
        return;
    }

    const formData = new FormData();
    formData.append('nome', nome);
    formData.append('potencia', potencia);
    formData.append('horas', horasUso);
    // [ALTERADO] Envia o ID do cômodo
    formData.append('comodo_id', comodoAtual.id); 
    // ❗️ NOTA DE BACK-END: 'create_aparelho.php' deve receber 'comodo_id'

    fetch('php/create_aparelho.php', {
        method: 'POST',
        body: formData,
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.sucesso) {
            // [ALTERADO] Recarrega os aparelhos do cômodo atual
            carregarAparelhos(comodoAtual.id); 
            closeModalAparelho();
            alert('Aparelho cadastrado com sucesso!');
            // (Não precisamos mais mexer no 'residencias._aparelhosCount' aqui)
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
        credentials: 'include',
        body: new URLSearchParams({ id })
    })
    .then(response => response.json())
    .then(data => {
        if (data.sucesso) {
            // [ALTERADO] Recarrega os aparelhos do cômodo atual
            carregarAparelhos(comodoAtual.id); 
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