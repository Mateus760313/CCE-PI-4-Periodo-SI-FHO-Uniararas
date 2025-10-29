document.addEventListener('DOMContentLoaded', () => {
    // VARIÁVEIS DE ELEMENTOS
    const loginSection = document.getElementById('login');
    const cadastroSection = document.getElementById('cadastro');
    // Adicionados IDs 'loginForm' e 'cadastroForm' no HTML corrigido
    const loginForm = document.getElementById('loginForm'); 
    const cadastroForm = document.getElementById('cadastroForm'); 
    
    // Variáveis de navegação e UI
    const navMenu = document.getElementById('nav-menu');
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const formSwitches = document.querySelectorAll('.form-switch a');
    const btnLogin = document.querySelector('.btn-login');
    const btnCadastro = document.querySelector('.btn-cadastro');
    const btnPrincipal = document.querySelector('.btn-principal'); 


    // --- FUNÇÕES DE UI (Mostrar Formulário e Menu) ---

    function showForm(formToShow) {
        // Oculta ambas as seções
        loginSection.style.display = 'none';
        cadastroSection.style.display = 'none';
        
        // Exibe a seção desejada e rola até ela
        formToShow.style.display = 'block';
        formToShow.scrollIntoView({ behavior: 'smooth' });
        
        // Limpa o feedback ao trocar de formulário
        const feedbackElement = formToShow.querySelector('.form-feedback');
        if (feedbackElement) {
             feedbackElement.textContent = '';
             feedbackElement.classList.remove('success', 'error', 'loading');
        }
    }

    function toggleMenu() {
        navMenu.classList.toggle('active');
        const isExpanded = navMenu.classList.contains('active');
        hamburgerBtn.setAttribute('aria-expanded', isExpanded);
    }

    function closeMenu() {
        navMenu.classList.remove('active');
        hamburgerBtn.setAttribute('aria-expanded', 'false');
    }

    // --- LISTENERS DE UI ---

    hamburgerBtn.addEventListener('click', toggleMenu);
    
    // Fecha o menu ao clicar em um link
    navMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', closeMenu);
    });

    // Mostra o formulário de Login
    btnLogin.addEventListener('click', (e) => {
        e.preventDefault();
        showForm(loginSection);
    });

    // Mostra o formulário de Cadastro (navbar)
    btnCadastro.addEventListener('click', (e) => {
        e.preventDefault();
        showForm(cadastroSection);
    });
    
    // Mostra o formulário de Cadastro (botão principal)
    if (btnPrincipal) {
        btnPrincipal.addEventListener('click', (e) => {
            e.preventDefault();
            showForm(cadastroSection);
        });
    }

    // Alterne entre Login e Cadastro
    formSwitches.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = e.target.getAttribute('href') === '#login' ? loginSection : cadastroSection;
            showForm(target);
        });
    });


    // --- FUNÇÕES DE AUTENTICAÇÃO (AJAX/Fetch) ---

    function handleAuthResponse(form, data) {
        const feedbackElement = form.querySelector('.form-feedback');
        const submitButton = form.querySelector('button[type="submit"]');

        submitButton.disabled = false;
        feedbackElement.classList.remove('loading');
        
        feedbackElement.textContent = data.mensagem;

        if (data.sucesso) {
            feedbackElement.classList.remove('error');
            feedbackElement.classList.add('success');
            
            // REDIRECIONA EM CASO DE SUCESSO
            setTimeout(() => {
                window.location.href = 'area-logada.html';
            }, 1000); 

        } else {
            feedbackElement.classList.remove('success');
            feedbackElement.classList.add('error');
        }
    }

    // Função principal que envia os dados para o PHP
    async function submitAuthForm(e, form) {
        e.preventDefault();
        
        const formData = new FormData(form);
        // Define a ação (login ou cadastro) com base no ID do formulário
        const acao = form.id === 'loginForm' ? 'login' : 'cadastro';
        formData.append('acao', acao); 

        const feedbackElement = form.querySelector('.form-feedback');
        const submitButton = form.querySelector('button[type="submit"]');

        // Estado de "Carregando"
        feedbackElement.classList.remove('success', 'error');
        feedbackElement.classList.add('loading');
        feedbackElement.textContent = 'Processando...';
        submitButton.disabled = true; // Desabilita para evitar cliques múltiplos

        try {
            // Requisição Fetch para o arquivo PHP
            const response = await fetch('php/processar_auth.php', {
                method: 'POST',
                body: formData
            });

            // O PHP deve retornar um JSON
            const data = await response.json();
            handleAuthResponse(form, data);

        } catch (error) {
            console.error('Erro de conexão ou JSON inválido:', error);
            feedbackElement.classList.remove('loading');
            feedbackElement.classList.add('error');
            feedbackElement.textContent = 'Erro ao conectar com o servidor. Verifique o console ou sua conexão.';
            submitButton.disabled = false;
        }
    }

    // --- LISTENERS DE SUBMIT ---

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => submitAuthForm(e, loginForm));
    } else {
        console.error("Elemento 'loginForm' não encontrado. Verifique seu home.html.");
    }
    
    if (cadastroForm) {
        cadastroForm.addEventListener('submit', (e) => submitAuthForm(e, cadastroForm));
    } else {
        console.error("Elemento 'cadastroForm' não encontrado. Verifique seu home.html.");
    }
});