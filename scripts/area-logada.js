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
            
            // RECRIA O GRÁFICO COM AS NOVAS CORES DO TEMA
            atualizarGraficoParaTema();
        });
    }
    
    carregarDadosUsuario(); // Carrega o nome e verifica a sessão
    setupImageSelector();
    setupModalCloseOnOutsideClick();
    setupUserDropdown(); // Configura o menu dropdown do usuário
    setupTimeSelector(); // Configura os botões de tempo
    initCharts(); // Inicializa os gráficos
});

function setupUserDropdown() {
    const trigger = document.getElementById('userTrigger');
    const dropdown = document.getElementById('userDropdown');

    if (trigger && dropdown) {
        // Toggle dropdown ao clicar no avatar
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('active');
        });

        // Fechar ao clicar fora
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target) && !trigger.contains(e.target)) {
                dropdown.classList.remove('active');
            }
        });

        // Fechar ao pressionar ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                dropdown.classList.remove('active');
            }
        });
    }
}

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
            
            // Preenche o avatar do header (trigger)
            const inicial = data.nome.charAt(0).toUpperCase();
            const temFoto = data.foto_perfil && data.foto_perfil.length > 0;
            
            const userAvatar = document.getElementById('userAvatar');
            const userAvatarImg = document.getElementById('userAvatarImg');
            
            if (temFoto) {
                if (userAvatar) userAvatar.style.display = 'none';
                if (userAvatarImg) {
                    userAvatarImg.src = data.foto_perfil;
                    userAvatarImg.style.display = 'block';
                }
            } else {
                if (userAvatar) {
                    userAvatar.textContent = inicial;
                    userAvatar.style.display = 'flex';
                }
                if (userAvatarImg) userAvatarImg.style.display = 'none';
            }
            
            // Preenche o dropdown
            const dropdownAvatar = document.getElementById('dropdownAvatar');
            const dropdownAvatarImg = document.getElementById('dropdownAvatarImg');
            const dropdownName = document.getElementById('dropdownName');
            const dropdownEmail = document.getElementById('dropdownEmail');

            if (temFoto) {
                if (dropdownAvatar) dropdownAvatar.style.display = 'none';
                if (dropdownAvatarImg) {
                    dropdownAvatarImg.src = data.foto_perfil;
                    dropdownAvatarImg.style.display = 'block';
                }
            } else {
                if (dropdownAvatar) {
                    dropdownAvatar.textContent = inicial;
                    dropdownAvatar.style.display = 'flex';
                }
                if (dropdownAvatarImg) dropdownAvatarImg.style.display = 'none';
            }
            
            if (dropdownName) dropdownName.textContent = data.nome;
            if (dropdownEmail) dropdownEmail.textContent = data.email || 'Email não disponível';

            // Preenche a saudação com o nome do usuário
            const welcomeGreeting = document.getElementById('welcomeGreeting');
            if (welcomeGreeting) {
                const primeiroNome = data.nome.split(' ')[0];
                welcomeGreeting.textContent = `Olá, ${primeiroNome}! 👋`;
            }

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

    // Atualiza as estatísticas do dashboard
    const totalResidenciasEl = document.getElementById('totalResidencias');
    const totalAparelhosGeralEl = document.getElementById('totalAparelhosGeral');
    
    let totalAparelhos = 0;
    residencias.forEach(r => {
        totalAparelhos += parseInt(r.total_aparelhos || 0);
    });

    if (totalResidenciasEl) totalResidenciasEl.textContent = residencias.length;
    if (totalAparelhosGeralEl) totalAparelhosGeralEl.textContent = totalAparelhos;

    // Aplica classes para centralização
    grid.classList.remove('single-residence', 'empty-grid');
    if (residencias.length === 0) {
        grid.classList.add('empty-grid');
    } else if (residencias.length === 1) {
        grid.classList.add('single-residence');
    }

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

    function calcularTarifa() {
        const cidade = cidadeSelect.value;
        
        if (cidade) {
            // Mostra que está carregando (opcional, visual feedback)
            tarifaInput.style.opacity = '0.5';
            
            // Chama nossa nova API
            fetch(`php/api_tarifa.php?cidade=${encodeURIComponent(cidade)}&uf=SP`)
                .then(response => response.json())
                .then(data => {
                    if (data.sucesso) {
                        tarifaInput.value = data.tarifa_final.toFixed(4);
                        console.log(`Tarifa carregada: ${data.tarifa_final} (${data.fonte_dados}) - Bandeira: ${data.bandeira.tipo}`);
                    } else {
                        console.error('Erro na API de tarifas');
                    }
                })
                .catch(err => console.error('Erro ao buscar tarifa:', err))
                .finally(() => {
                    tarifaInput.style.opacity = '1';
                });
        }
    }

    cidadeSelect.onchange = calcularTarifa;
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
    const comodo = comodos.find(c => Number(c.id) === Number(id));
    if (!comodo) return;

    const temAparelhos = parseInt(comodo.aparelho_count || 0) > 0;

    if (!temAparelhos) {
        // Se não tem aparelhos, exclui direto (com confirmação simples)
        if (!confirm('Deseja realmente excluir este cômodo?')) return;
        executarExclusaoComodo(id, 'delete_all');
    } else {
        // Se tem aparelhos, abre o modal de decisão
        abrirModalExcluirComodo(id);
    }
}

function abrirModalExcluirComodo(id) {
    const modal = document.getElementById('modalExcluirComodo');
    const select = document.getElementById('selectComodoDestino');
    const inputId = document.getElementById('idComodoExcluir');
    
    inputId.value = id;
    
    // Preenche o select com outros cômodos da mesma residência
    select.innerHTML = '<option value="" disabled selected>Selecione um cômodo...</option>';
    const outrosComodos = comodos.filter(c => Number(c.id) !== Number(id));
    
    if (outrosComodos.length === 0) {
        // Se não tem outros cômodos, desabilita a opção de mover
        document.querySelector('input[value="move"]').disabled = true;
        document.querySelector('input[value="move"]').parentElement.style.opacity = '0.5';
        document.querySelector('input[value="delete_all"]').checked = true;
        toggleSelectComodo(false);
    } else {
        document.querySelector('input[value="move"]').disabled = false;
        document.querySelector('input[value="move"]').parentElement.style.opacity = '1';
        outrosComodos.forEach(c => {
            const option = document.createElement('option');
            option.value = c.id;
            option.textContent = c.nome;
            select.appendChild(option);
        });
    }

    modal.classList.add('active');
}

function closeModalExcluirComodo() {
    document.getElementById('modalExcluirComodo').classList.remove('active');
}

function toggleSelectComodo(show) {
    const container = document.getElementById('selectComodoDestinoContainer');
    const select = document.getElementById('selectComodoDestino');
    if (show) {
        container.classList.add('visible');
    } else {
        container.classList.remove('visible');
    }
    select.required = show;
}

function confirmarExclusaoComodo(event) {
    event.preventDefault();
    const id = document.getElementById('idComodoExcluir').value;
    const acao = document.querySelector('input[name="acaoExclusao"]:checked').value;
    const destinoId = document.getElementById('selectComodoDestino').value;

    if (acao === 'move' && !destinoId) {
        alert('Por favor, selecione um cômodo de destino.');
        return;
    }

    executarExclusaoComodo(id, acao, destinoId);
}

function executarExclusaoComodo(id, acao, destinoId = null) {
    const formData = new FormData();
    formData.append('id', id);
    formData.append('acao', acao); // 'delete_all' ou 'move'
    if (destinoId) {
        formData.append('target_comodo_id', destinoId);
    }

    fetch('php/delete_comodo.php', {
        method: 'POST',
        body: formData,
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.sucesso) {
            closeModalExcluirComodo();
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

// ========== GRÁFICOS (CHART.JS) ==========
let chartInstance = null;
let dashboardData = null; // Armazena os dados reais do dashboard
let currentChartType = 'mensal'; // Armazena o tipo de gráfico atual

// Função para obter a cor primária correta baseada no tema atual
function getThemeColor() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    // Verde para tema claro, Amarelo para tema escuro
    return isDark ? '#fbbf24' : '#10b981';
}

// Função para atualizar o gráfico quando o tema muda
function atualizarGraficoParaTema() {
    // Pequeno delay para garantir que as variáveis CSS foram atualizadas
    setTimeout(() => {
        if (chartInstance) {
            // Descobre qual aba está ativa
            const activeTab = document.querySelector('.chart-tab.active') || 
                              document.querySelector('.chart-extra-btn.active');
            
            // Determina o tipo atual baseado na aba ativa ou usa o armazenado
            let tipo = currentChartType;
            if (activeTab) {
                const onclick = activeTab.getAttribute('onclick');
                if (onclick) {
                    const match = onclick.match(/mudarGrafico\('(\w+)'/);
                    if (match) tipo = match[1];
                }
            }
            
            // Recria o gráfico com as novas cores
            mudarGrafico(tipo, activeTab);
        }
    }, 50);
}

function initCharts() {
    // Carrega os dados reais antes de renderizar
    carregarDadosDashboard();
}

function carregarDadosDashboard() {
    fetch('php/get_dashboard_data.php', {
        method: 'GET',
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.sucesso) {
            dashboardData = data;
            // Renderiza o gráfico padrão (Mensal) após carregar dados
            // Se o usuário já estiver em outra aba, mantém a aba (mas aqui é init, então padrão mensal)
            mudarGrafico('mensal', document.querySelector('.chart-tab.active'));
        } else {
            console.error('Erro ao carregar dados do dashboard:', data.mensagem);
            // Fallback para dados fictícios se falhar, ou apenas renderiza vazio
            mudarGrafico('mensal', document.querySelector('.chart-tab.active'));
        }
    })
    .catch(error => {
        console.error('Erro na requisição do dashboard:', error);
        mudarGrafico('mensal', document.querySelector('.chart-tab.active'));
    });
}

function mudarGrafico(tipo, element) {
    // Armazena o tipo atual para uso ao trocar tema
    currentChartType = tipo;
    
    // Atualiza UI das tabs se clicado em uma tab
    if (element && element.classList.contains('chart-tab')) {
        document.querySelectorAll('.chart-tab').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.chart-extra-btn').forEach(btn => btn.classList.remove('active'));
        element.classList.add('active');
    } else if (element && element.classList.contains('chart-extra-btn')) {
        document.querySelectorAll('.chart-tab').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.chart-extra-btn').forEach(btn => btn.classList.remove('active'));
        element.classList.add('active');
    }

    const ctx = document.getElementById('mainChart').getContext('2d');
    
    // Destrói gráfico anterior se existir
    if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
    }

    // Configuração base para cores e fontes
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textLight = isDark ? '#94a3b8' : '#64748b';
    const cardBorder = isDark ? '#334155' : '#e2e8f0';
    Chart.defaults.color = textLight;
    Chart.defaults.borderColor = cardBorder;
    
    // USA A FUNÇÃO getThemeColor() PARA GARANTIR COR CORRETA
    const primaryColor = getThemeColor();
    const dangerColor = '#ef4444';

    let config;
    let subtitle = '';
    let insight = '';
    
    // Se não tiver dados carregados ainda, usa fictícios ou vazio (tratado dentro das configs se quiser, mas aqui vamos passar null se não tiver)
    const dados = dashboardData;

    switch(tipo) {
        case 'mensal':
            config = getConfigConsumoMensal(primaryColor, dados);
            subtitle = 'Evolução mensal do consumo de energia';
            insight = '💡 Seu consumo estimado atual é de ' + (dados ? parseFloat(dados.total_mensal).toFixed(1) : '0') + ' kWh/mês.';
            break;
        case 'top5':
            config = getConfigTop5Aparelhos(primaryColor, dados);
            subtitle = 'Aparelhos com maior consumo de energia';
            if (dados && dados.top5 && dados.top5.length > 0) {
                const top1 = dados.top5[0];
                insight = `⚡ O aparelho <strong>${top1.nome}</strong> é o maior consumidor (${parseFloat(top1.consumo_kwh).toFixed(1)} kWh).`;
            } else {
                insight = '⚡ Cadastre seus aparelhos para ver o ranking de consumo.';
            }
            break;
        case 'comodos':
            config = getConfigConsumoComodos(dados);
            subtitle = 'Distribuição do consumo por cômodo';
            if (dados && dados.comodos && dados.comodos.length > 0) {
                const topComodo = dados.comodos[0];
                insight = `🏠 O cômodo <strong>${topComodo.nome}</strong> consome mais energia (${parseFloat(topComodo.consumo_kwh).toFixed(1)} kWh).`;
            } else {
                insight = '🏠 Cadastre cômodos e aparelhos para ver a distribuição.';
            }
            break;
        case 'projecao':
            config = getConfigProjecao(primaryColor, dangerColor, dados);
            subtitle = 'Projeção de consumo até o fim do mês';
            insight = '🎯 Projeção baseada no seu uso diário atual.';
            break;
        case 'comparacao':
            config = getConfigComparacao(primaryColor, dangerColor, dados);
            subtitle = 'Comparação com o mês anterior';
            insight = '⚠️ Comparativo simulado (histórico indisponível).';
            break;
        default:
            config = getConfigConsumoMensal(primaryColor, dados);
            subtitle = 'Evolução mensal do consumo de energia';
            insight = '💡 Selecione um gráfico para ver insights personalizados.';
    }

    // Atualiza subtitle e insight
    const subtitleEl = document.getElementById('chartSubtitle');
    const insightEl = document.getElementById('chartInsight');
    if (subtitleEl) subtitleEl.textContent = subtitle;
    if (insightEl) {
        insightEl.innerHTML = `<span class="insight-icon">${insight.charAt(0)}</span><span class="insight-text">${insight.substring(2)}</span>`;
    }

    chartInstance = new Chart(ctx, config);
}

// 1. Gráfico de Consumo Mensal (Line)
function getConfigConsumoMensal(primaryColor, dados) {
    // Como não temos histórico real no BD, vamos simular um histórico
    // onde o mês atual é o valor real calculado.
    
    const atual = dados ? parseFloat(dados.total_mensal) : 0;
    // Simula meses anteriores com variação aleatória pequena
    const m1 = Math.max(0, atual * 0.9);
    const m2 = Math.max(0, atual * 1.1);
    const m3 = Math.max(0, atual * 0.95);
    const m4 = Math.max(0, atual * 1.05);
    const m5 = Math.max(0, atual * 0.98);

    return {
        type: 'line',
        data: {
            labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Atual'],
            datasets: [{
                label: 'Consumo (kWh)',
                data: [m1, m2, m3, m4, m5, atual], 
                borderColor: primaryColor,
                backgroundColor: createGradient(primaryColor),
                tension: 0.4,
                fill: true,
                pointRadius: 5,
                pointHoverRadius: 8,
                pointBackgroundColor: '#fff',
                pointBorderColor: primaryColor,
                pointBorderWidth: 3,
                pointHoverBackgroundColor: primaryColor,
                pointHoverBorderColor: '#fff',
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: { 
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: { size: 12, weight: '600' }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(30, 41, 59, 0.95)',
                    titleFont: { size: 14, weight: '700' },
                    bodyFont: { size: 13 },
                    padding: 14,
                    cornerRadius: 10,
                    displayColors: true,
                    boxPadding: 6
                }
            },
            scales: {
                y: { 
                    beginAtZero: true, 
                    title: { display: true, text: 'kWh', font: { weight: '600' } },
                    grid: { color: 'rgba(0,0,0,0.05)' }
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    };
}

// Função auxiliar para criar gradiente
function createGradient(color) {
    const canvas = document.getElementById('mainChart');
    if (!canvas) return color + '30';
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, color + '40');
    gradient.addColorStop(1, color + '05');
    return gradient;
}

// 2. Gráfico Top 5 Aparelhos (Bar Horizontal)
function getConfigTop5Aparelhos(primaryColor, dados) {
    let labels = [];
    let values = [];

    if (dados && dados.top5 && dados.top5.length > 0) {
        labels = dados.top5.map(item => item.nome);
        values = dados.top5.map(item => parseFloat(item.consumo_kwh));
    } else {
        labels = ['Sem dados'];
        values = [0];
    }

    return {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Consumo (kWh)',
                data: values,
                backgroundColor: [
                    '#10b981',
                    '#3b82f6',
                    '#f59e0b',
                    '#8b5cf6',
                    '#ec4899'
                ],
                borderRadius: 8,
                borderSkipped: false,
                barThickness: 28
            }]
        },
        options: {
            indexAxis: 'y', // Barra horizontal
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(30, 41, 59, 0.95)',
                    titleFont: { size: 14, weight: '700' },
                    bodyFont: { size: 13 },
                    padding: 14,
                    cornerRadius: 10,
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const val = context.raw || 0;
                            const percent = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
                            return `${val.toFixed(2)} kWh (${percent}%)`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(0,0,0,0.05)' },
                    title: { display: true, text: 'kWh', font: { weight: '600' } }
                },
                y: {
                    grid: { display: false },
                    ticks: { font: { weight: '500' } }
                }
            }
        }
    };
}

// 3. Gráfico por Cômodo (Doughnut)
function getConfigConsumoComodos(dados) {
    let labels = [];
    let values = [];

    if (dados && dados.comodos && dados.comodos.length > 0) {
        labels = dados.comodos.map(item => item.nome);
        values = dados.comodos.map(item => parseFloat(item.consumo_kwh));
    } else {
        labels = ['Sem dados'];
        values = [1]; // Valor dummy para aparecer algo vazio
    }

    return {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: [
                    '#10b981', // Primary
                    '#3b82f6', // Blue
                    '#f59e0b', // Amber
                    '#ef4444', // Red
                    '#8b5cf6', // Purple
                    '#64748b'  // Slate
                ],
                borderWidth: 0,
                hoverOffset: 12
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { 
                    position: 'right',
                    labels: {
                        usePointStyle: true,
                        padding: 16,
                        font: { size: 12, weight: '500' },
                        generateLabels: function(chart) {
                            const data = chart.data;
                            if (data.labels.length && data.labels[0] === 'Sem dados') return [];
                            return data.labels.map((label, i) => {
                                const val = data.datasets[0].data[i];
                                const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
                                const percent = total > 0 ? ((val / total) * 100).toFixed(0) : 0;
                                return {
                                    text: `${label} (${percent}%)`,
                                    fillStyle: data.datasets[0].backgroundColor[i],
                                    hidden: false,
                                    index: i,
                                    pointStyle: 'rectRounded'
                                };
                            });
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(30, 41, 59, 0.95)',
                    titleFont: { size: 14, weight: '700' },
                    bodyFont: { size: 13 },
                    padding: 14,
                    cornerRadius: 10
                }
            },
            cutout: '65%',
            radius: '90%'
        }
    };
}

// 4. Gráfico de Projeção (Line)
function getConfigProjecao(primaryColor, dangerColor, dados) {
    // Simulação baseada no total mensal atual
    const totalAtual = dados ? parseFloat(dados.total_mensal) : 0;
    const diasNoMes = 30;
    const consumoDiario = totalAtual / diasNoMes;
    
    // Gera dados para 30 dias
    const dias = Array.from({length: 30}, (_, i) => i + 1);
    const consumoAcumulado = [];
    let acumulado = 0;
    
    // Simula que estamos no dia 20
    const diaAtual = 20;
    
    for (let i = 0; i < diaAtual; i++) {
        // Variação aleatória diária
        const variacao = (Math.random() * 0.4) + 0.8; // 0.8 a 1.2
        acumulado += consumoDiario * variacao;
        consumoAcumulado.push(acumulado);
    }

    // Projeção linear para o resto
    const projecao = [...consumoAcumulado];
    let projecaoAcumulada = acumulado;
    for (let i = diaAtual; i < 30; i++) {
        projecaoAcumulada += consumoDiario;
        projecao.push(projecaoAcumulada);
    }

    // Preenche array real com nulls
    const consumoRealCompleto = [...consumoAcumulado, ...Array(30 - diaAtual).fill(null)];

    return {
        type: 'line',
        data: {
            labels: dias,
            datasets: [{
                label: 'Consumo Real (Simulado)',
                data: consumoRealCompleto,
                borderColor: primaryColor,
                backgroundColor: primaryColor,
                tension: 0.3,
                pointRadius: 2,
                pointHoverRadius: 6,
                borderWidth: 3,
                spanGaps: false
            }, {
                label: 'Projeção',
                data: projecao,
                borderColor: '#94a3b8',
                borderDash: [6, 4],
                tension: 0.3,
                pointRadius: 0,
                fill: false,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: { size: 12, weight: '600' }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(30, 41, 59, 0.95)',
                    padding: 14,
                    cornerRadius: 10
                }
            },
            scales: {
                y: {
                    grid: { color: 'rgba(0,0,0,0.05)' },
                    title: { display: true, text: 'kWh Acumulado', font: { weight: '600' } }
                },
                x: {
                    grid: { display: false },
                    title: { display: true, text: 'Dia do Mês', font: { weight: '600' } }
                }
            }
        }
    };
}

// 5. Comparação Mês Anterior (Bar)
function getConfigComparacao(primaryColor, dangerColor, dados) {
    const atual = dados ? parseFloat(dados.total_mensal) : 0;
    // Simula mês anterior sendo 10% menor ou maior
    const anterior = atual * 0.9; 
    
    const aumentou = atual > anterior;
    const diferenca = Math.abs(atual - anterior);
    const percentual = anterior > 0 ? ((diferenca / anterior) * 100).toFixed(1) : 0;
    
    return {
        type: 'bar',
        data: {
            labels: ['Mês Anterior', 'Mês Atual'],
            datasets: [{
                label: 'Consumo Total (kWh)',
                data: [anterior, atual],
                backgroundColor: [
                    '#94a3b8', // Cinza para anterior
                    aumentou ? dangerColor : primaryColor // Vermelho se aumentou, Verde se diminuiu
                ],
                borderRadius: 12,
                barThickness: 80,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                title: { 
                    display: true, 
                    text: aumentou ? `⚠️ Aumento de ${percentual}% no consumo` : `✅ Redução de ${percentual}% no consumo`,
                    font: { size: 16, weight: '700' },
                    padding: { bottom: 20 }
                },
                tooltip: {
                    backgroundColor: 'rgba(30, 41, 59, 0.95)',
                    padding: 14,
                    cornerRadius: 10,
                    callbacks: {
                        label: function(context) {
                            return `${parseFloat(context.raw).toFixed(2)} kWh`;
                        }
                    }
                }
            },
            scales: {
                y: { 
                    beginAtZero: true,
                    grid: { color: 'rgba(0,0,0,0.05)' },
                    title: { display: true, text: 'kWh', font: { weight: '600' } }
                },
                x: {
                    grid: { display: false },
                    ticks: { font: { size: 14, weight: '600' } }
                }
            }
        }
    };
}