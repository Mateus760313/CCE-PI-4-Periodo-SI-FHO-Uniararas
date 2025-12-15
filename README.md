# ⚡ CCE - Controle de Consumo Energético

Bem-vindo ao repositório do **CCE (Controle de Consumo Energético)**. Este projeto foi desenvolvido como parte do Projeto Interdisciplinar do 4º Período do curso de Sistemas de Informação da FHO - Uniararas.

O sistema permite que usuários gerenciem residências, cômodos e aparelhos elétricos, simulando o consumo de energia e gerando relatórios detalhados para auxiliar na economia e conscientização.

---

## 📋 Funcionalidades

*   **Autenticação de Usuários**: Login seguro e cadastro de novos usuários.
*   **Gestão de Residências**: Cadastre múltiplas residências.
*   **Gestão de Cômodos e Aparelhos**: Organize seus aparelhos por cômodos.
*   **Simulação de Consumo**: Calcule o consumo estimado com base na potência e tempo de uso.
*   **Dashboard Interativo**: Visualize gráficos de consumo e custos.
*   **Relatórios**: Exporte dados de consumo para análise.
*   **Recuperação de Senha**: Sistema de redefinição de senha via e-mail.

---

## 🚀 Tecnologias Utilizadas

*   **Frontend**: HTML5, CSS3, JavaScript (Vanilla).
*   **Backend**: PHP (Vanilla).
*   **Banco de Dados**: PostgreSQL.
*   **Bibliotecas**:
    *   [PHPMailer](https://github.com/PHPMailer/PHPMailer) (para envio de e-mails).
    *   [Chart.js](https://www.chartjs.org/) (para gráficos).
    *   [html2pdf](https://github.com/spipu/html2pdf) (para geração de PDF).

---

## ⚙️ Pré-requisitos

Antes de começar, você precisará ter instalado em sua máquina:

1.  **XAMPP** (ou outro servidor web com suporte a PHP).
2.  **PostgreSQL** (Sistema Gerenciador de Banco de Dados).
3.  **Git** (opcional, para clonar o repositório).

---

## 🛠️ Instalação e Configuração

Siga os passos abaixo para configurar o ambiente de desenvolvimento.

### 1. Configuração do Banco de Dados (PostgreSQL)

1.  Abra o **pgAdmin** ou seu cliente SQL preferido.
2.  Crie um novo banco de dados chamado `cce` (ou outro nome de sua preferência).
3.  Execute o script de criação das tabelas localizado em:
    `BD PostgreSQL/setup_banco_completo.sql`
4.  Certifique-se de que as tabelas (`usuarios`, `residencias`, `comodos`, `aparelhos`, etc.) foram criadas corretamente.

### 2. Configuração do Projeto no XAMPP

1.  Navegue até a pasta de instalação do XAMPP, geralmente em `C:\xampp\htdocs`.
2.  Crie uma pasta com o nome exato: **`CCE-PI-4-Periodo-SI-FHO-Uniararas-main`**.
    *   ⚠️ **Importante**: O nome da pasta deve ser exatamente este para que os links de recuperação de senha funcionem corretamente.
3.  Copie todos os arquivos deste projeto para dentro dessa pasta.

A estrutura final deve ficar assim:
```
C:\xampp\htdocs\CCE-PI-4-Periodo-SI-FHO-Uniararas-main\
├── area-logada.html
├── home.html
├── php\
├── scripts\
├── styles\
└── ...
```

### 3. Configuração da Conexão com o Banco (PHP)

1.  Abra o arquivo `php/conexao.php`.
2.  Edite as credenciais de conexão para corresponder ao seu PostgreSQL local:
    ```php
    $host = "localhost";
    $port = "5432";
    $dbname = "cce";      // Nome do seu banco de dados
    $user = "postgres";   // Seu usuário do Postgres
    $password = "senha";  // Sua senha do Postgres
    ```

### 4. Configuração de E-mail (SMTP)

⚠️ **Atenção**: O arquivo `php/config.php` contendo as credenciais reais de e-mail **não está incluído** no código fonte por questões de segurança. Ele contém informações sensíveis como e-mail e senha do remetente.

Para que a recuperação de senha funcione, você precisará configurar este arquivo manualmente:

1.  Abra o arquivo `php/config.php` (ou crie um novo baseado no exemplo).
2.  Insira as credenciais de um servidor SMTP válido (ex: Gmail, Outlook).
    ```php
    define('SMTP_HOST', 'smtp.gmail.com');
    define('SMTP_USER', 'seu-email@gmail.com');
    define('SMTP_PASS', 'sua-senha-de-aplicativo'); // Use senha de app se usar 2FA
    define('SMTP_PORT', 587);
    ```

---

## ▶️ Como Executar

1.  Inicie o servidor **Apache** no painel de controle do XAMPP.
2.  Abra seu navegador e acesse:
    [http://localhost/CCE-PI-4-Periodo-SI-FHO-Uniararas-main/home.html](http://localhost/CCE-PI-4-Periodo-SI-FHO-Uniararas-main/home.html)

---

## 📂 Estrutura de Pastas

*   `BD PostgreSQL/`: Scripts SQL para criação do banco.
*   `php/`: Scripts backend (API, conexão, lógica de negócios).
    *   `PHPMailer/`: Biblioteca de envio de e-mails.
*   `scripts/`: Arquivos JavaScript para lógica do frontend.
*   `styles/`: Arquivos CSS para estilização.
*   `src/images/`: Imagens e ícones do projeto.
*   `uploads/`: Pasta para armazenamento de fotos de perfil.

---

## 👨‍💻 Autores

Projeto desenvolvido pelos alunos do 4º Período de Sistemas de Informação da FHO - Uniararas.
