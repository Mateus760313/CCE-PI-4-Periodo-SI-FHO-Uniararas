document.addEventListener('DOMContentLoaded', () => {
    // Aplicar tema salvo (sincroniza com home.html)
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.setAttribute('data-theme', 'dark');
    }

    const form = document.getElementById('redefinirForm');
    const tokenInput = document.getElementById('token');
    
    // Pegar o token da URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (!token) {
        showError('Token de recuperação não encontrado.');
        return;
    }
    
    tokenInput.value = token;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const novaSenha = document.getElementById('nova-senha').value;
        const confirmarSenha = document.getElementById('confirmar-senha').value;
        
        if (novaSenha !== confirmarSenha) {
            showError('As senhas não coincidem.');
            return;
        }
        
        const formData = new FormData(form);
        
        try {
            const response = await fetch('php/redefinir_senha.php', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.sucesso) {
                showSuccess(data.mensagem);
                setTimeout(() => {
                    window.location.href = 'home.html#login';
                }, 2000);
            } else {
                showError(data.mensagem);
            }
        } catch (error) {
            showError('Erro ao processar a requisição.');
        }
    });
});

function showError(message) {
    const feedback = document.querySelector('.form-feedback');
    feedback.textContent = message;
    feedback.className = 'form-feedback error';
}

function showSuccess(message) {
    const feedback = document.querySelector('.form-feedback');
    feedback.textContent = message;
    feedback.className = 'form-feedback success';
}