        const loginSection = document.getElementById('login');
        const cadastroSection = document.getElementById('cadastro');
        const btnLogin = document.querySelector('.btn-login');
        const btnCadastro = document.querySelector('.btn-cadastro');
        const formSwitches = document.querySelectorAll('.form-switch a');

        function showForm(formToShow) {
            loginSection.style.display = 'none';
            cadastroSection.style.display = 'none';
            formToShow.style.display = 'block';
            formToShow.scrollIntoView({ behavior: 'smooth' });
        }

        btnLogin.addEventListener('click', (e) => {
            e.preventDefault();
            showForm(loginSection);
        });

        btnCadastro.addEventListener('click', (e) => {
            e.preventDefault();
            showForm(cadastroSection);
        });
        
        document.querySelector('.btn-principal').addEventListener('click', (e) => {
            e.preventDefault();
            showForm(cadastroSection);
        });

        formSwitches.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                if (e.target.getAttribute('href') === '#login') {
                    showForm(loginSection);
                } else {
                    showForm(cadastroSection);
                }
            });
        });


        
document.addEventListener('DOMContentLoaded', () => {
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const navMenu = document.getElementById('nav-menu');

    hamburgerBtn.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        
        const isExpanded = navMenu.classList.contains('active');
        hamburgerBtn.setAttribute('aria-expanded', isExpanded);
    });

    navMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            if (navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                hamburgerBtn.setAttribute('aria-expanded', 'false');
            }
        });
    });
});