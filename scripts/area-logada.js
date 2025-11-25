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
    // Dark Mode Toggle
    const themeToggle = document.getElementById('themeToggle');
    const savedTheme = localStorage.getItem('theme');
    
    // Aplica tema salvo ou detecta preferência do sistema
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
    
    // Listener para toggle de tema
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }
    
    carregarDadosUsuario(); // Carrega o nome e verifica a sessão
    setupImageSelector();
    setupModalCloseOnOutsideClick();
    setupLogoutListener(); // Configura o botão de sair
    setupTimeSelector(); // Configura os botões de tempo
});

function setupTimeSelector() {
    const timeBtns = document.querySelectorAll('.time-btn');
    const customTimeBtn = document.getElementById('btnCustomTime');
    const customTimeInputDiv = document.getElementById('customTimeInput');
    const customTimeValue = document.getElementById('customTimeValue');
    const customTimeUnit = document.getElementById('customTimeUnit');
    const horasUsoInput = document.getElementById('horasUso');

    // Função para atualizar o valor hidden
    function updateHiddenValue(hours) {
        horasUsoInput.value = hours;
    }

    // Listener para botões predefinidos
    timeBtns.forEach(btn => {
        if (btn.classList.contains('custom-time-btn')) return;

        btn.addEventListener('click', () => {
            // Remove active de todos
            timeBtns.forEach(b => b.classList.remove('active'));
            // Adiciona active ao clicado
            btn.classList.add('active');
            
            // Esconde input personalizado
            customTimeInputDiv.style.display = 'none';
            
            // Calcula horas e atualiza hidden
            const minutes = parseInt(btn.dataset.minutes);
            const hours = minutes / 60;
            updateHiddenValue(hours);
        });
    });

    // Listener para botão personalizado
    if (customTimeBtn) {
        customTimeBtn.addEventListener('click', () => {
            timeBtns.forEach(b => b.classList.remove('active'));
            customTimeBtn.classList.add('active');
            customTimeInputDiv.style.display = 'flex';
            
            // Recalcula baseado no input atual (se houver valor)
            if (customTimeValue.value) {
                calculateCustomTime();
            } else {
                horasUsoInput.value = ''; // Limpa se não tiver valor
            }
        });
    }

    // Lógica do input personalizado
    function calculateCustomTime() {
        const val = parseFloat(customTimeValue.value);
        const unit = customTimeUnit.value;
        
        if (isNaN(val) || val < 0) {
            horasUsoInput.value = '';
            return;
        }

        let hours = 0;
        if (unit === 'min') {
            hours = val / 60;
        } else {
            hours = val;
        }
        updateHiddenValue(hours);
    }

    if (customTimeValue && customTimeUnit) {
        customTimeValue.addEventListener('input', calculateCustomTime);
        customTimeUnit.addEventListener('change', calculateCustomTime);
    }
}

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
            <div class="card-actions">
                <button class="btn-edit-residencia" onclick="openModalResidencia(${residencia.id}, event)" title="Editar">
                    &#9998;
                </button>
                <button class="btn-delete-residencia" onclick="deletarResidencia(${residencia.id}, event)" title="Excluir">
                    &times;
                </button>
            </div>
            
            <img class="residencia-image" src="${imagemUrl}" alt="${residencia.nome}">
            <div class="residencia-info">
                <div class="residencia-nome">${residencia.nome}</div>
                <div class="residencia-meta">
                    <div>${residencia.total_aparelhos || 0} aparelhos</div>
                    <div style="font-size: 0.9em; color: var(--primary-color); font-weight: 600;">
                        R$ ${(parseFloat(residencia.total_custo_mensal) || 0).toFixed(2).replace('.', ',')} / mês
                    </div>
                </div>
            </div>
        `;
        grid.insertBefore(card, addCard);
    });
}

function deletarResidencia(id, event) {
    if (event) event.stopPropagation();
    
    if (!confirm('Tem certeza que deseja excluir esta residência? Todos os cômodos e aparelhos vinculados serão excluídos permanentemente.')) {
        return;
    }

    const formData = new FormData();
    formData.append('id', id);

    fetch('php/delete_residencia.php', {
        method: 'POST',
        body: formData,
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.sucesso) {
            alert('Residência excluída com sucesso!');
            carregarResidencias(); // Recarrega a lista
        } else {
            alert(data.mensagem || 'Erro ao excluir residência');
        }
    })
    .catch(error => {
        console.error('Erro ao excluir residência:', error);
        alert('Erro ao excluir residência');
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

    // Configura os listeners de tarifa
    setupTarifaCalculator();

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
        // Tenta inferir a bandeira ou deixa padrão
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
        
        // Dispara o cálculo inicial para preencher a tarifa padrão
        document.getElementById('cidadeResidencia').dispatchEvent(new Event('change'));
    }

    modal.classList.add('active');
}

function setupTarifaCalculator() {
    const cidadeSelect = document.getElementById('cidadeResidencia');
    const tarifaInput = document.getElementById('tarifaResidencia');

    // Configuração Global da Bandeira (Alterar aqui quando mudar a bandeira)
    const BANDEIRA_ATUAL = 'vermelha1'; 

    const tarifasBase = {
        'Araras': 0.70,
        'Rio Claro': 0.70,
        'Leme': 0.70,
        'Mogi-Guaçu': 0.70,
        'Conchal': 0.70,
        'Engenheiro Coelho': 0.70,
        'Limeira': 0.70,
        'Cordeirópolis': 0.70,
        'Santa Gertrudes': 0.70
    };

    const adicionaisBandeira = {
        'verde': 0,
        'amarela': 0.01885,
        'vermelha1': 0.04463,
        'vermelha2': 0.07877
    };

    function calcularTarifa() {
        const cidade = cidadeSelect.value;
        
        if (cidade && tarifasBase[cidade] !== undefined) {
            const base = tarifasBase[cidade];
            const adicional = adicionaisBandeira[BANDEIRA_ATUAL] || 0;
            const total = base + adicional;
            
            // Arredonda para 4 casas decimais para precisão
            tarifaInput.value = total.toFixed(4);
        }
    }

    cidadeSelect.onchange = calcularTarifa;
    // Removemos o listener da bandeira pois agora é fixa
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
    console.log('🔍 === CARREGANDO CÔMODOS ===');
    console.log('🔍 Residência ID:', residenciaId);
    
    fetch(`php/get_comodos.php?residencia_id=${residenciaId}`, {
        method: 'GET',
        credentials: 'include'
    })
    .then(response => {
        console.log('🔍 Response status:', response.status);
        console.log('🔍 Response OK?', response.ok);
        return response.json();
    })
    .then(data => {
        console.log('🔍 === RESPOSTA DO PHP ===');
        console.log('🔍 Dados completos:', data);
        console.log('🔍 data.sucesso:', data.sucesso);
        console.log('🔍 data.comodos:', data.comodos);
        
        if (data.sucesso) {
            comodos = data.comodos;
            console.log('✅ Variável comodos atualizada:', comodos);
            console.log('✅ Número de cômodos:', comodos.length);
            renderizarComodos();
        } else {
            console.error('❌ Erro retornado pelo PHP:', data.mensagem);
            comodos = [];
            renderizarComodos();
        }
    })
    .catch(error => {
        console.error('❌ Erro na requisição fetch:', error);
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
    console.log('🔍 Tentando abrir cômodo ID:', id);
    console.log('🔍 Cômodos disponíveis:', comodos);
    
    comodoAtual = comodos.find(c => Number(c.id) === Number(id));
    
    console.log('🔍 Cômodo encontrado:', comodoAtual);
    
    if (!comodoAtual) {
        console.error('❌ Cômodo não encontrado! ID buscado:', id);
        alert('Erro: Cômodo não encontrado');
        return;
    }
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
    console.log('🎨 === INICIANDO RENDERIZAÇÃO ===');
    console.log('🎨 Array comodos:', comodos);
    console.log('🎨 Quantidade de cômodos:', comodos ? comodos.length : 0);
    
    const grid = document.getElementById('comodosGrid');
    const emptyState = document.getElementById('emptyStateComodos');
    
    console.log('🎨 Elemento grid encontrado?', grid !== null);
    console.log('🎨 Elemento emptyState encontrado?', emptyState !== null);
    
    grid.innerHTML = '';

    let totalKWhResidencia = 0;
    let totalReaisResidencia = 0;
    let comodoMaisConsumo = { nome: '--', consumo: 0 };

    if (!comodos || comodos.length === 0) {
        console.log('⚠️ NENHUM CÔMODO PARA RENDERIZAR');
        emptyState.style.display = 'block';
    } else {
        console.log('✅ Iniciando loop de renderização. Total:', comodos.length);
        emptyState.style.display = 'none';
        
        comodos.forEach(comodo => {
            const comodoId = Number(comodo.id);
            console.log('📦 Renderizando cômodo:', comodo.nome, 'ID:', comodoId);
            
            const custoComodo = parseFloat(comodo.custo_total_reais || 0);
            const consumoComodo = parseFloat(comodo.consumo_total_kwh || 0);
            const aparelhoCount = parseInt(comodo.aparelho_count || 0);

            console.log('   💰 Custo:', custoComodo, '| Consumo:', consumoComodo, '| Aparelhos:', aparelhoCount);

            // Soma para os KPIs da Residência
            totalKWhResidencia += consumoComodo;
            totalReaisResidencia += custoComodo;
            
            if (consumoComodo > comodoMaisConsumo.consumo) {
                comodoMaisConsumo = { nome: comodo.nome, consumo: consumoComodo };
            }

            const card = document.createElement('div');
            card.className = 'comodo-card';
            
            // Evento de clique
            card.onclick = (e) => {
                e.stopPropagation();
                console.log('🖱️ Clique no cômodo ID:', comodoId);
                abrirComodo(comodoId);
            };
            
            const imagemUrl = 'https://img.icons8.com/fluency/96/room.png';
            
            // Verifica se há um vilão
            let vilaoHtml = '';
            if (comodo.vilao_nome && parseFloat(comodo.vilao_custo) > 0) {
                vilaoHtml = `
                    <div class="comodo-vilao" title="Aparelho com maior consumo">
                        <span class="vilao-icon">⚠️</span>
                        <span class="vilao-info">
                            <strong>${comodo.vilao_nome}</strong>
                            <small>R$ ${parseFloat(comodo.vilao_custo).toFixed(2).replace('.', ',')}</small>
                        </span>
                    </div>
                `;
            }

            card.innerHTML = `
                <img class="comodo-image" src="${imagemUrl}" alt="${comodo.nome}">
                <div class="comodo-info">
                    <div class="comodo-nome">${comodo.nome}</div>
                    <div class="comodo-meta">${aparelhoCount} aparelhos</div>
                    ${vilaoHtml}
                </div>
                <div class="comodo-kpi">
                    <span>${custoComodo.toFixed(2).replace('.', ',')} R$/mês</span>
                </div>
                <div class="comodo-actions">
                    <button class="btn-edit-comodo">✏️</button>
                    <button class="btn-delete-comodo">🗑️</button>
                </div>
            `;
            // Clique no card abre o cômodo
            card.addEventListener('click', function(e) {
                if (e.target.classList.contains('btn-edit-comodo') || e.target.classList.contains('btn-delete-comodo')) return;
                abrirComodo(comodoId);
            });
            // Botão editar
            card.querySelector('.btn-edit-comodo').addEventListener('click', function(e) {
                e.stopPropagation();
                openModalEditarComodo(comodoId, comodo.nome);
            });
            // Botão excluir
            card.querySelector('.btn-delete-comodo').addEventListener('click', function(e) {
                e.stopPropagation();
                deletarComodo(comodoId);
            });
            grid.appendChild(card);
        });
        
        console.log('🎨 Total de cards adicionados:', grid.children.length);
    }

    // Atualiza os KPIs da Residência
    console.log('📊 Atualizando KPIs - kWh:', totalKWhResidencia, '| R$:', totalReaisResidencia);
    document.getElementById('totalKWhResidencia').textContent = `${totalKWhResidencia.toFixed(2)} kWh`;
    document.getElementById('totalReaisResidencia').textContent = `R$ ${totalReaisResidencia.toFixed(2).replace('.', ',')}`;
    
    console.log('🎨 === RENDERIZAÇÃO CONCLUÍDA ===');
}

// ========== FUNÇÕES AUXILIARES DE CÔMODO ==========
function openModalEditarComodo(id, nomeAtual) {
    const modal = document.getElementById('modalComodo');
    const form = document.getElementById('formComodo');
    modal.classList.add('active');
    form.reset();
    document.getElementById('nomeComodo').value = nomeAtual;
    form.dataset.editId = id;
    // Troca o submit handler para edição
    form.onsubmit = function(event) {
        event.preventDefault();
        const novoNome = document.getElementById('nomeComodo').value;
        if (!novoNome) {
            alert('Digite o novo nome do cômodo');
            return;
        }
        const formData = new FormData();
        formData.append('id', id);
        formData.append('nome', novoNome);
        fetch('php/update_comodo.php', {
            method: 'POST',
            body: formData,
            credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
            if (data.sucesso) {
                carregarComodos(residenciaAtual.id);
                closeModalComodo();
                alert('Cômodo atualizado com sucesso!');
            } else {
                alert(data.mensagem || 'Erro ao atualizar cômodo');
            }
        })
        .catch(error => {
            console.error('Erro ao atualizar cômodo:', error);
            alert('Erro ao atualizar cômodo');
        });
        // Restaura o submit padrão ao fechar
        setTimeout(() => { form.onsubmit = cadastrarComodo; }, 500);
    };
}

function deletarComodo(id) {
    if (!confirm('Deseja realmente excluir este cômodo? Todos os aparelhos vinculados ficarão sem cômodo.')) return;
    const formData = new FormData();
    formData.append('id', id);
    fetch('php/delete_comodo.php', {
        method: 'POST',
        body: formData,
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.sucesso) {
            carregarComodos(residenciaAtual.id);
            alert('Cômodo excluído com sucesso!');
        } else {
            alert(data.mensagem || 'Erro ao excluir cômodo');
        }
    })
    .catch(error => {
        console.error('Erro ao excluir cômodo:', error);
        alert('Erro ao excluir cômodo');
    });
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
    }

    if (!aparelhos || aparelhos.length === 0) {
        emptyState.style.display = 'block';
        document.getElementById('totalKWhComodo').textContent = '0.00 kWh';
        document.getElementById('totalReaisComodo').textContent = 'R$ 0,00';
        return;
    }

    emptyState.style.display = 'none';

    // Encontra o maior custo para destacar
    let maiorCusto = 0;
    let idMaiorCusto = -1;
    
    aparelhos.forEach(a => {
        const custo = (a.potencia_watts * a.horas_uso / 1000) * 30 * tarifa;
        if (custo > maiorCusto) {
            maiorCusto = custo;
            idMaiorCusto = a.id;
        }
    });

    aparelhos.forEach(aparelho => {
        // Usar dados do backend
        const consumoMensal = parseFloat(aparelho.consumo_mensal_kwh || 0);
        const custoMensal = parseFloat(aparelho.custo_mensal_reais || 0);

        // Soma para os KPIs do Cômodo
        totalKWhComodo += consumoMensal;
        totalReaisComodo += custoMensal;
        
        const card = document.createElement('div');
        card.className = 'aparelho-card';
        
        // Aplica destaque se for o vilão
        if (aparelho.id === idMaiorCusto && maiorCusto > 0) {
            card.classList.add('destaque-vilao');
            card.innerHTML += `<div class="badge-vilao">Maior Gasto</div>`;
        }
        
        card.innerHTML += `
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
                <button class="btn-edit">Editar</button>
                <button class="btn-delete">Remover</button>
            </div>
        `;
        // Adiciona listeners aos botões
        const btnEdit = card.querySelector('.btn-edit');
        const btnDelete = card.querySelector('.btn-delete');
        btnEdit.addEventListener('click', function() {
            abrirModalEditarAparelho(aparelho);
        });
        btnDelete.addEventListener('click', function() {
            deletarAparelho(aparelho.id);
        });
        grid.appendChild(card);
    });

    // [ALTERADO] Atualiza os KPIs do Cômodo (no cabeçalho da comodoView)
    document.getElementById('totalKWhComodo').textContent = `${totalKWhComodo.toFixed(2)} kWh`;
    if (tarifa > 0) {
        document.getElementById('totalReaisComodo').textContent = `R$ ${totalReaisComodo.toFixed(2).replace('.', ',')}`;
    }
}

// ========== FUNÇÕES AUXILIARES DE APARELHO ==========
function abrirModalEditarAparelho(aparelho) {
    // Abre o modal e preenche os campos
    document.getElementById('modalAparelho').classList.add('active');
    document.getElementById('nomeAparelho').value = aparelho.nome;
    document.getElementById('potenciaAparelho').value = aparelho.potencia_watts;
    
    const horasUso = parseFloat(aparelho.horas_uso);
    document.getElementById('horasUso').value = horasUso;

    // Lógica para selecionar o botão de tempo correto
    const minutes = Math.round(horasUso * 60);
    const timeBtns = document.querySelectorAll('.time-btn');
    const customTimeBtn = document.getElementById('btnCustomTime');
    const customTimeInputDiv = document.getElementById('customTimeInput');
    const customTimeValue = document.getElementById('customTimeValue');
    const customTimeUnit = document.getElementById('customTimeUnit');

    // Reseta estado visual
    timeBtns.forEach(b => b.classList.remove('active'));
    customTimeInputDiv.style.display = 'none';

    // Tenta encontrar botão correspondente (com margem de erro pequena para float)
    let found = false;
    timeBtns.forEach(btn => {
        if (btn.dataset.minutes && Math.abs(parseInt(btn.dataset.minutes) - minutes) < 1) {
            btn.classList.add('active');
            found = true;
        }
    });

    // Se não achou botão exato, usa o personalizado
    if (!found) {
        customTimeBtn.classList.add('active');
        customTimeInputDiv.style.display = 'flex';
        customTimeValue.value = horasUso;
        customTimeUnit.value = 'hours'; // Padrão mostrar em horas na edição
    }

    // Troca o submit do form para editar
    const form = document.getElementById('formAparelho');
    form.onsubmit = function(event) {
        event.preventDefault();
        salvarEdicaoAparelho(aparelho.id);
    };
}

function salvarEdicaoAparelho(id) {
    const nome = document.getElementById('nomeAparelho').value;
    const potencia = parseInt(document.getElementById('potenciaAparelho').value);
    const horasUso = parseFloat(document.getElementById('horasUso').value);

    if (!comodoAtual || !comodoAtual.id) {
        alert('Erro: selecione um cômodo antes de editar o aparelho');
        return;
    }

    const formData = new FormData();
    formData.append('id', id);
    formData.append('nome', nome);
    formData.append('potencia', potencia);
    formData.append('horas', horasUso);
    formData.append('comodo_id', comodoAtual.id);

    fetch('php/update_aparelho.php', {
        method: 'POST',
        body: formData,
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.sucesso) {
            carregarAparelhos(comodoAtual.id);
            closeModalAparelho();
            alert('Aparelho editado com sucesso!');
        } else {
            alert(data.mensagem || 'Erro ao editar aparelho');
        }
    })
    .catch(error => {
        console.error('Erro ao editar aparelho:', error);
        alert('Erro ao editar aparelho');
    });

    // Restaura o submit padrão ao fechar
    setTimeout(() => {
        document.getElementById('formAparelho').onsubmit = cadastrarAparelho;
    }, 500);
}

// ========== MODAL COMODO ==========
function openModalComodo() {
    if (!residenciaAtual) {
        alert('Selecione uma residência primeiro');
        return;
    }
    document.getElementById('modalComodo').classList.add('active');
    document.getElementById('formComodo').reset();
    // [CORREÇÃO] Restaura o onsubmit para cadastrar
    document.getElementById('formComodo').onsubmit = cadastrarComodo;
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
    
    // Reseta visual dos botões de tempo
    document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('customTimeInput').style.display = 'none';

    // [CORREÇÃO] Restaura o onsubmit para cadastrar, caso tenha sido alterado por edição
    document.getElementById('formAparelho').onsubmit = cadastrarAparelho;
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