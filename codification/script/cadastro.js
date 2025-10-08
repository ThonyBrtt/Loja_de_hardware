// ==========================================================
// CONFIGURAÇÃO E INICIALIZAÇÃO DO FIREBASE
// ==========================================================
const firebaseConfig = {
    apiKey: "AIzaSyB_Pd9n5VzXloRQvqusZUIhwZVmJvnKfQc",
    authDomain: "boombum-eaf32.firebaseapp.com",
    projectId: "boombum-eaf32",
    storageBucket: "boombum-eaf32.firebasestorage.app",
    messagingSenderId: "827065363375",
    appId: "1:827065363375:web:913f128e651fcdbe145d5a"
};

// Inicializa o Firebase para que possamos usar seus serviços.
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// ==========================================================
// LÓGICA DA PÁGINA DE CADASTRO
// ==========================================================

// Garante que o script só rode após o carregamento completo do HTML.
document.addEventListener("DOMContentLoaded", function () {
    // Seleciona os elementos da página que serão manipulados.
    const form = document.getElementById("register-form");
    const messageBox = document.getElementById("message");
    const loading = document.getElementById("loading");

    function showMessage(text, type = "success") {
        messageBox.style.display = "block";
        messageBox.innerText = text;
        messageBox.className = `message ${type}`;
        setTimeout(() => {
            messageBox.style.display = "none";
        }, 5000);
    }

    // Adiciona o evento de envio ao formulário de cadastro.
    form.addEventListener("submit", async (e) => {
        e.preventDefault(); // Impede o recarregamento da página.

        // Coleta e limpa os valores dos campos do formulário.
        const fullName = document.getElementById("full-name").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirm-password").value;
        const acceptTerms = form.querySelector('input[type="checkbox"][required]');
        const isTermsChecked = acceptTerms ? acceptTerms.checked : false;

        // Bloco de validações dos dados inseridos pelo usuário.
        if (!fullName || !email || !password || !confirmPassword) {
            showMessage("Preencha todos os campos obrigatórios!", "error");
            return;
        }
        if (password !== confirmPassword) {
            showMessage("As senhas não coincidem!", "error");
            return;
        }
        if (!isTermsChecked) {
            showMessage("Você deve aceitar os termos de uso!", "error");
            return;
        }
        if (password.length < 6) {
            showMessage("A senha deve ter pelo menos 6 caracteres!", "error");
            return;
        }

        try {
            loading.style.display = "block";

            // 1. Usa o Firebase Auth para criar um novo usuário com email e senha.
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // 2. Atualiza o perfil do usuário recém-criado com o nome completo.
            await user.updateProfile({ displayName: fullName });

            // 3. Envia o email de verificação para o usuário.
            await user.sendEmailVerification();

            // Exibe mensagem de sucesso e redireciona para a página de login.
            showMessage("Conta criada! Verifique seu e-mail para ativar sua conta.", "success");
            setTimeout(() => {
                window.location.href = "login.html";
            }, 3000);

        } catch (error) {
            console.error("Erro no cadastro:", error);
            
            // Traduz erros comuns do Firebase para mensagens amigáveis.
            let errorMessage = "Erro ao criar conta: ";
            switch (error.code) {
                case "auth/email-already-in-use":
                    errorMessage += "Este e-mail já está em uso.";
                    break;
                case "auth/invalid-email":
                    errorMessage += "E-mail inválido.";
                    break;
                case "auth/weak-password":
                    errorMessage += "Senha muito fraca.";
                    break;
                default:
                    errorMessage += "Ocorreu um erro inesperado.";
            }
            showMessage(errorMessage, "error");
        } finally {
            // Garante que o indicador de "carregando" seja escondido, mesmo se der erro.
            loading.style.display = "none";
        }
    });
});