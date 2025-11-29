// ========== RELATÓRIOS.JS ==========

// Variáveis globais
let usuarioLogado = {};
let residencias = [];
let relatorioAtual = null;
let chartComodos = null;
let chartTendencias = null;

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', function() {
    // Dark Mode Toggle
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
            
            // Atualizar gráficos com novas cores
            if (chartComodos) atualizarCoresGrafico(chartComodos);
            if (chartTendencias) atualizarCoresGrafico(chartTendencias);
        });
    }

    // Carregar dados
    carregarDadosUsuario();
    setupUserDropdown();
    setupModals();
});

// ========== CARREGAR DADOS DO USUÁRIO ==========
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
            preencherDadosUsuario(data);
            carregarResidencias();
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

function preencherDadosUsuario(data) {
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
}

// ========== CARREGAR RESIDÊNCIAS ==========
function carregarResidencias() {
    fetch('php/get_residencias.php', { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
            if (data.sucesso) {
                residencias = data.residencias;
                preencherSelectResidencias();
                gerarRelatorio();
            }
        })
        .catch(err => console.error('Erro ao carregar residências:', err));
}

function preencherSelectResidencias() {
    const select = document.getElementById('selectResidencia');
    const selectMeta = document.getElementById('selectResidenciaMeta');
    
    residencias.forEach(r => {
        const option = new Option(r.nome, r.id);
        select.add(option.cloneNode(true));
        if (selectMeta) selectMeta.add(option);
    });
    
    select.addEventListener('change', () => gerarRelatorio());
}

// ========== GERAR RELATÓRIO ==========
function gerarRelatorio() {
    const residenciaId = document.getElementById('selectResidencia').value;
    
    const params = new URLSearchParams({ acao: 'gerar_relatorio' });
    if (residenciaId) params.append('residencia_id', residenciaId);
    
    fetch(`php/api_relatorios.php?${params}`, { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
            if (data.sucesso) {
                relatorioAtual = data;
                renderizarRelatorio(data);
            } else {
                console.error('Erro:', data.mensagem);
            }
        })
        .catch(err => {
            console.error('Erro ao gerar relatório:', err);
        });
}

// ========== RENDERIZAR RELATÓRIO ==========
function renderizarRelatorio(relatorio) {
    renderizarResumo(relatorio.resumo);
    renderizarMeta(relatorio.meta);
    renderizarTopAparelhos(relatorio.top_aparelhos);
    renderizarConsumoPorComodo(relatorio.consumo_comodos);
    renderizarComparativo(relatorio.comparativo);
    renderizarTendencias(relatorio.tendencias);
    renderizarImpactoAparelhos(relatorio.impacto_aparelhos);
    renderizarRecomendacoes(relatorio.recomendacoes);
    renderizarPrevisoes(relatorio.previsoes);
    renderizarAlertas(relatorio.alertas);
}

// ========== RENDERIZAR RESUMO ==========
function renderizarResumo(resumo) {
    document.getElementById('consumoAtualKwh').textContent = formatNumber(resumo.consumo_kwh_atual);
    document.getElementById('custoAtual').textContent = formatCurrency(resumo.custo_atual);
    document.getElementById('previsaoFimMes').textContent = formatCurrency(resumo.custo_projetado);
}

// ========== RENDERIZAR META ==========
function renderizarMeta(meta) {
    const cardMeta = document.getElementById('cardMeta');
    const progressFill = document.getElementById('metaProgressFill');
    const progressLabel = document.getElementById('metaProgressLabel');
    const mensagemEl = document.getElementById('metaMensagem');
    const detalhesEl = document.getElementById('metaDetalhes');
    
    // Remover classes anteriores
    cardMeta.classList.remove('excedido', 'alerta', 'dentro');
    progressFill.classList.remove('warning', 'danger');
    mensagemEl.classList.remove('warning', 'danger');
    
    if (!meta.tem_meta) {
        document.getElementById('percentualMeta').textContent = '--%';
        document.getElementById('valorMeta').textContent = 'Sem meta definida';
        progressFill.style.width = '0%';
        progressLabel.textContent = 'Meta: R$ 0';
        mensagemEl.innerHTML = '<p>Configure uma meta para começar a acompanhar seus gastos.</p>';
        detalhesEl.style.display = 'none';
        return;
    }
    
    // Atualizar card
    document.getElementById('percentualMeta').textContent = `${meta.percentual_atual}%`;
    document.getElementById('valorMeta').textContent = `de ${formatCurrency(meta.valor_meta)}`;
    
    // Progress bar
    const percentual = Math.min(meta.percentual_atual, 100);
    progressFill.style.width = `${percentual}%`;
    progressLabel.textContent = `Meta: ${formatCurrency(meta.valor_meta)}`;
    
    // Cores baseadas no status
    if (meta.status === 'excedido') {
        cardMeta.classList.add('excedido');
        progressFill.classList.add('danger');
        mensagemEl.classList.add('danger');
    } else if (meta.status === 'alerta' || meta.status === 'risco') {
        cardMeta.classList.add('alerta');
        progressFill.classList.add('warning');
        mensagemEl.classList.add('warning');
    } else {
        cardMeta.classList.add('dentro');
    }
    
    // Mensagem
    mensagemEl.innerHTML = `<p>${meta.mensagem}</p>`;
    
    // Detalhes
    detalhesEl.style.display = 'grid';
    document.getElementById('metaGastoAtual').textContent = formatCurrency(meta.custo_atual);
    document.getElementById('metaDisponivel').textContent = formatCurrency(Math.max(0, meta.valor_meta - meta.custo_atual));
    document.getElementById('metaMediaDiaria').textContent = `${formatCurrency(meta.valor_diario_permitido)}/dia`;
    document.getElementById('metaDiasRestantes').textContent = `${meta.dias_restantes} dias`;
}

// ========== RENDERIZAR TOP APARELHOS ==========
function renderizarTopAparelhos(aparelhos) {
    const container = document.getElementById('topAparelhosLista');
    
    if (!aparelhos || aparelhos.length === 0) {
        container.innerHTML = '<div class="loading-placeholder">Nenhum aparelho cadastrado</div>';
        return;
    }
    
    let html = '';
    aparelhos.slice(0, 10).forEach((ap, index) => {
        const rankClass = index < 3 ? `top${index + 1}` : '';
        
        html += `
            <div class="aparelho-item">
                <div class="aparelho-rank ${rankClass}">${index + 1}</div>
                <div class="aparelho-info">
                    <div class="aparelho-nome">${ap.nome}</div>
                    <div class="aparelho-local">${ap.comodo_nome || 'Sem cômodo'} • ${ap.residencia_nome || ''}</div>
                </div>
                <div class="aparelho-consumo">
                    <div class="aparelho-kwh">${formatNumber(ap.consumo_kwh_mes)} kWh</div>
                    <div class="aparelho-custo">${formatCurrency(ap.custo_mes)}</div>
                </div>
                <div class="aparelho-percentual">
                    <span class="percentual-valor">${ap.percentual_total}%</span>
                    <span class="percentual-label">do total</span>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// ========== RENDERIZAR CONSUMO POR CÔMODO ==========
function renderizarConsumoPorComodo(comodos) {
    const ctx = document.getElementById('chartComodos').getContext('2d');
    
    if (chartComodos) {
        chartComodos.destroy();
    }
    
    if (!comodos || comodos.length === 0) {
        return;
    }
    
    const cores = [
        '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
        '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'
    ];
    
    chartComodos = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: comodos.map(c => c.nome),
            datasets: [{
                data: comodos.map(c => c.consumo_kwh_mes),
                backgroundColor: cores.slice(0, comodos.length),
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-color').trim(),
                        padding: 16,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${formatNumber(value)} kWh (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// ========== RENDERIZAR COMPARATIVO ==========
function renderizarComparativo(comparativo) {
    const container = document.getElementById('comparativoContent');
    
    if (!comparativo.tem_dados_anteriores) {
        container.innerHTML = `
            <div class="comparativo-mensagem">
                <p>${comparativo.mensagem}</p>
            </div>
        `;
        return;
    }
    
    const setaClass = comparativo.tendencia === 'aumento' ? 'aumento' : 
                      comparativo.tendencia === 'reducao' ? 'reducao' : '';
    const setaIcon = comparativo.tendencia === 'aumento' ? '📈' : 
                     comparativo.tendencia === 'reducao' ? '📉' : '➡️';
    
    const variacaoClass = comparativo.diferenca_custo > 0 ? 'negativo' : '';
    const sinal = comparativo.diferenca_custo > 0 ? '+' : '';
    
    container.innerHTML = `
        <div class="comparativo-visual">
            <div class="comparativo-mes">
                <div class="comparativo-mes-label">Mês Anterior</div>
                <div class="comparativo-mes-valor">${formatCurrency(comparativo.custo_anterior)}</div>
            </div>
            <div class="comparativo-seta ${setaClass}">${setaIcon}</div>
            <div class="comparativo-mes">
                <div class="comparativo-mes-label">Este Mês (projetado)</div>
                <div class="comparativo-mes-valor">${formatCurrency(comparativo.custo_atual)}</div>
            </div>
        </div>
        <div class="comparativo-variacao ${variacaoClass}">
            <span class="variacao-valor">${sinal}${formatCurrency(comparativo.diferenca_custo)} (${sinal}${comparativo.percentual_variacao}%)</span>
            <span class="variacao-label">variação em relação ao mês anterior</span>
        </div>
        <div class="comparativo-mensagem">
            <p>${comparativo.mensagem}</p>
        </div>
    `;
}

// ========== RENDERIZAR TENDÊNCIAS ==========
function renderizarTendencias(tendencias) {
    const ctx = document.getElementById('chartTendencias').getContext('2d');
    const mensagemEl = document.getElementById('tendenciaMensagem');
    
    if (chartTendencias) {
        chartTendencias.destroy();
    }
    
    if (!tendencias.tem_dados_suficientes) {
        mensagemEl.innerHTML = `<p>${tendencias.mensagem}</p>`;
        return;
    }
    
    mensagemEl.innerHTML = `<p>${tendencias.mensagem}</p>`;
    
    const historico = tendencias.historico;
    const labels = historico.map(h => {
        const date = new Date(h.mes);
        return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    });
    
    chartTendencias = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Consumo (kWh)',
                data: historico.map(h => h.consumo_kwh),
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(128, 128, 128, 0.1)'
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-light').trim()
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-light').trim()
                    }
                }
            }
        }
    });
}

// ========== RENDERIZAR IMPACTO DE APARELHOS ==========
function renderizarImpactoAparelhos(impacto) {
    const container = document.getElementById('impactoLista');
    const secao = document.getElementById('secaoImpacto');
    
    if (!impacto.tem_alteracoes) {
        secao.style.display = 'none';
        return;
    }
    
    secao.style.display = 'block';
    
    let html = '';
    impacto.analises.forEach(analise => {
        const icon = analise.acao === 'ADICIONADO' ? '➕' : 
                     analise.acao === 'REMOVIDO' ? '➖' : '✏️';
        const classe = analise.acao === 'REMOVIDO' ? 'removido' : '';
        
        html += `
            <div class="impacto-item ${classe}">
                <div class="impacto-icon">${icon}</div>
                <div class="impacto-content">
                    <div class="impacto-titulo">${analise.aparelho}</div>
                    <div class="impacto-data">${analise.data}</div>
                    <div class="impacto-mensagem">${analise.mensagem}</div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// ========== RENDERIZAR RECOMENDAÇÕES ==========
function renderizarRecomendacoes(recomendacoes) {
    const container = document.getElementById('recomendacoesLista');
    
    if (!recomendacoes || recomendacoes.length === 0) {
        container.innerHTML = '<div class="loading-placeholder">Nenhuma recomendação no momento</div>';
        return;
    }
    
    let html = '';
    recomendacoes.forEach(rec => {
        const classe = rec.severidade === 'critico' ? 'critico' : 
                       rec.severidade === 'aviso' ? 'aviso' : '';
        
        html += `
            <div class="recomendacao-item ${classe}">
                <div class="recomendacao-icon">${rec.icone}</div>
                <div class="recomendacao-content">
                    <div class="recomendacao-titulo">${rec.titulo}</div>
                    <div class="recomendacao-mensagem">${rec.mensagem}</div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// ========== RENDERIZAR PREVISÕES ==========
function renderizarPrevisoes(previsoes) {
    const container = document.getElementById('previsoesContent');
    
    if (!previsoes.tem_previsao) {
        container.innerHTML = '<div class="loading-placeholder">Dados insuficientes para previsões</div>';
        return;
    }
    
    let classeMeta = '';
    let textoMeta = 'Dentro da meta';
    
    if (previsoes.vai_estourar) {
        classeMeta = 'perigo';
        textoMeta = `Estouro em ${previsoes.dias_para_estourar_meta || 0} dias`;
    }
    
    container.innerHTML = `
        <div class="previsao-card">
            <div class="previsao-icon">💰</div>
            <div class="previsao-titulo">Média Diária</div>
            <div class="previsao-valor">${formatCurrency(previsoes.media_diaria)}</div>
            <div class="previsao-sublabel">por dia</div>
        </div>
        <div class="previsao-card">
            <div class="previsao-icon">📅</div>
            <div class="previsao-titulo">Previsão Fim do Mês</div>
            <div class="previsao-valor">${formatCurrency(previsoes.previsao_fim_mes)}</div>
            <div class="previsao-sublabel">estimativa total</div>
        </div>
        <div class="previsao-card">
            <div class="previsao-icon">⏳</div>
            <div class="previsao-titulo">Dias Restantes</div>
            <div class="previsao-valor">${previsoes.dias_restantes}</div>
            <div class="previsao-sublabel">até fim do mês</div>
        </div>
        <div class="previsao-card ${classeMeta}">
            <div class="previsao-icon">🎯</div>
            <div class="previsao-titulo">Status da Meta</div>
            <div class="previsao-valor">${textoMeta}</div>
            ${previsoes.data_previsao_estouro ? `<div class="previsao-sublabel">Previsão: ${previsoes.data_previsao_estouro}</div>` : ''}
        </div>
    `;
}

// ========== RENDERIZAR ALERTAS ==========
function renderizarAlertas(alertas) {
    const container = document.getElementById('alertasContainer');
    const lista = document.getElementById('alertasList');
    
    if (!alertas || alertas.length === 0) {
        container.style.display = 'none';
        return;
    }
    
    container.style.display = 'block';
    
    let html = '';
    alertas.forEach(alerta => {
        const classe = alerta.severidade === 'CRITICO' || alerta.severidade === 'ALERTA' ? '' :
                       alerta.severidade === 'AVISO' ? 'aviso' : 'info';
        
        html += `
            <div class="alerta-item ${classe}">
                <div class="alerta-icon">⚠️</div>
                <div class="alerta-content">
                    <div class="alerta-titulo">${alerta.titulo}</div>
                    <div class="alerta-mensagem">${alerta.mensagem}</div>
                </div>
            </div>
        `;
    });
    
    lista.innerHTML = html;
}

// ========== META ==========
function abrirModalMeta() {
    document.getElementById('modalMeta').classList.add('active');
    
    // Sugestão de meta baseada no consumo atual
    if (relatorioAtual && relatorioAtual.resumo) {
        const sugestao = Math.ceil(relatorioAtual.resumo.custo_projetado * 1.1 / 10) * 10;
        document.getElementById('sugestaoMeta').textContent = formatCurrency(sugestao);
    }
}

function fecharModalMeta() {
    document.getElementById('modalMeta').classList.remove('active');
}

function salvarMeta(event) {
    event.preventDefault();
    
    const valorMeta = document.getElementById('inputValorMeta').value;
    const residenciaId = document.getElementById('selectResidenciaMeta').value;
    
    const formData = new FormData();
    formData.append('acao', 'salvar_meta');
    formData.append('valor_meta', valorMeta);
    if (residenciaId) formData.append('residencia_id', residenciaId);
    
    fetch('php/api_relatorios.php', {
        method: 'POST',
        body: formData,
        credentials: 'include'
    })
    .then(res => res.json())
    .then(data => {
        if (data.sucesso) {
            alert('Meta salva com sucesso!');
            fecharModalMeta();
            gerarRelatorio();
        } else {
            alert(data.mensagem || 'Erro ao salvar meta');
        }
    })
    .catch(err => {
        console.error('Erro:', err);
        alert('Erro ao salvar meta');
    });
}

// ========== ALERTAS ==========
function marcarTodosLidos() {
    // Implementar se necessário
    document.getElementById('alertasContainer').style.display = 'none';
}

// ========== UTILITÁRIOS ==========
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value || 0);
}

function formatNumber(value) {
    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value || 0);
}

function atualizarCoresGrafico(chart) {
    if (!chart) return;
    
    const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-color').trim();
    const textLight = getComputedStyle(document.documentElement).getPropertyValue('--text-light').trim();
    
    if (chart.options.plugins.legend) {
        chart.options.plugins.legend.labels.color = textColor;
    }
    
    if (chart.options.scales) {
        if (chart.options.scales.y) {
            chart.options.scales.y.ticks.color = textLight;
        }
        if (chart.options.scales.x) {
            chart.options.scales.x.ticks.color = textLight;
        }
    }
    
    chart.update();
}

// ========== USER DROPDOWN ==========
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

// ========== MODALS ==========
function setupModals() {
    // Fechar modal ao clicar fora
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
    
    // Fechar modal ao pressionar ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.active').forEach(modal => {
                modal.classList.remove('active');
            });
        }
    });
}

// ========== LOGOUT ==========
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
