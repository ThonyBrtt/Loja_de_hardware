// ==========================================================
// CONFIGURAÇÃO E INICIALIZAÇÃO DO FIREBASE
// ==========================================================
const firebaseConfig = {
    apiKey: "AIzaSyB_Pd9n5VzXloRQvqusZUIhwZVmJvnKfQc",
    authDomain: "boombum-eaf32.firebaseapp.com",
    projectId: "boombum-eaf32",
    storageBucket: "boombum-eaf32.firebasestorage.app",
    messagingSenderId: "827065363375",
    appId: "1:827065363375:web:913f128e651fcdbe145d5a",
    measurementId: "G-D7CBRK53E0"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// ==========================================================
// LÓGICA DA PÁGINA DE RECUPERAÇÃO DE SENHA
// ==========================================================

// Garante que o script só rode após o carregamento completo do HTML.
document.addEventListener('DOMContentLoaded', function() {
    // Seleciona os elementos da página que serão manipulados.
    const form = document.getElementById('recovery-form');
    const loading = document.getElementById('loading');
    const message = document.getElementById('message');
    const instructions = document.getElementById('instructions');
    const emailInput = document.getElementById('email');

    function showMessage(text, type) {
        message.textContent = text;
        message.className = `message ${type}`;
        message.style.display = 'block';
        setTimeout(() => { message.style.display = 'none'; }, 5000);
    }

    /** Exibe a tela de instruções e esconde o formulário. */
    function showInstructions() {
        instructions.style.display = 'block';
        form.style.display = 'none';
    }

    /** Esconde a tela de instruções e exibe o formulário. */
    function hideInstructions() {
        instructions.style.display = 'none';
        form.style.display = 'block';
    }

    // Adiciona um evento ao link 'Voltar' para retornar à tela do formulário.
    document.querySelector('.login-link a').addEventListener('click', function(e) {
        if (instructions.style.display === 'block') {
            e.preventDefault();
            hideInstructions();
            emailInput.value = ''; // Limpa o campo de email ao voltar.
        }
    });

    // Adiciona o evento de envio ao formulário de recuperação.
    form.addEventListener('submit', async function(e) {
        e.preventDefault(); // Impede o recarregamento da página.
        
        const email = emailInput.value.trim();

        // Validações básicas do campo de email.
        if (!email) {
            showMessage('Por favor, digite seu email.', 'error');
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showMessage('Por favor, digite um email válido.', 'error');
            return;
        }

        try {
            loading.style.display = 'block';
            
            // Chama a função do Firebase para enviar o email de redefinição de senha.
            await auth.sendPasswordResetEmail(email);
            
            // Se o envio for bem-sucedido, esconde o formulário e mostra as instruções.
            loading.style.display = 'none';
            showInstructions();
            
        } catch (error) {
            loading.style.display = 'none';
            console.error('Erro ao enviar email de recuperação:', error);
            
            // Traduz erros comuns do Firebase para mensagens amigáveis.
            let errorMessage = 'Erro ao enviar email: ';
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage += 'Nenhuma conta encontrada com este email.';
                    break;
                case 'auth/invalid-email':
                    errorMessage += 'Email inválido.';
                    break;
                case 'auth/too-many-requests':
                    errorMessage += 'Muitas tentativas. Tente novamente mais tarde.';
                    break;
                default:
                    errorMessage += 'Ocorreu um erro inesperado.';
            }
            showMessage(errorMessage, 'error');
        }
    });

    // Verifica se a URL da página contém um parâmetro 'email' (ex: vindo da página de login).
    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get('email');
    if (emailParam) {
        // Se houver, preenche automaticamente o campo de email.
        emailInput.value = emailParam;
    }
});