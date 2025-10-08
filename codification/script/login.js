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

// Inicializa os serviços do Firebase com a configuração acima.
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ==========================================================
// SELEÇÃO DE ELEMENTOS DO HTML
// ==========================================================

const loginForm = document.getElementById("login-form");
const emailInput = document.getElementById("login-email");
const passwordInput = document.getElementById("login-password");
const messageBox = document.getElementById("message");
const loading = document.getElementById("loading");

// ==========================================================
// FUNÇÕES AUXILIARES
// ==========================================================

function showMessage(text, type = "error") {
    messageBox.style.display = "block";
    messageBox.className = "message " + type;
    messageBox.innerText = text;
    setTimeout(() => {
        messageBox.style.display = "none";
    }, 5000);
}

function simpleErrorMessage(error) {
    if (error && error.code) {
        if (error.code === "auth/wrong-password" || error.code === "auth/user-not-found" || error.code === "auth/invalid-credential") {
            return "E-mail ou senha incorretos.";
        }
        if (error.code === "auth/invalid-email") {
            return "E-mail inválido.";
        }
        if (error.code === "auth/too-many-requests") {
            return "Muitas tentativas. Tente novamente mais tarde.";
        }
    }
    return "Ocorreu um erro. Tente novamente.";
}

function validateInputs(email, password) {
    if (!email) return "Informe o e-mail.";
    if (!password) return "Informe a senha.";
    return null;
}

// ==========================================================
// LÓGICA PRINCIPAL DE LOGIN E REDIRECIONAMENTO
// ==========================================================

function checkAdminRoleAndRedirect(user) {
    // Busca o documento do usuário na coleção 'users' usando seu UID.
    const userDocRef = db.collection('users').doc(user.uid);

    userDocRef.get().then((doc) => {
        // Verifica se o documento existe e se o campo 'role' é 'admin'.
        if (doc.exists && doc.data().role === 'admin') {
            showMessage("Bem-vindo(a), Admin!", "success");
            setTimeout(() => window.location.href = "admin.html", 1200);
        } else {
            // Se não for admin ou o documento não existir, trata como usuário comum.
            showMessage("Login realizado com sucesso!", "success");
            setTimeout(() => window.location.href = "index.html", 1200);
        }
    }).catch((error) => {
        // Em caso de erro na leitura do Firestore, redireciona para a página principal por segurança.
        console.error("Erro ao verificar permissão:", error);
        showMessage("Login realizado com sucesso!", "success");
        setTimeout(() => window.location.href = "index.html", 1200);
    }).finally(() => {
        // Garante que o indicador de "carregando" seja escondido.
        if (loading) {
            loading.style.display = "none";
        }
    });
}

// ==========================================================
// EVENT LISTENERS (OUVINTES DE EVENTOS)
// ==========================================================

// --- Login com E-mail e Senha ---
if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
        e.preventDefault(); // Impede o recarregamento da página.
        loading.style.display = "block";

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        // Valida os campos antes de prosseguir.
        const invalid = validateInputs(email, password);
        if (invalid) {
            showMessage(invalid);
            loading.style.display = "none";
            return;
        }

        // Tenta fazer o login com o Firebase Auth.
        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                const user = userCredential.user;

                // Verifica se o email do usuário foi verificado.
                if (!user.emailVerified) {
                    showMessage("Por favor, verifique seu e-mail antes de entrar.");
                    auth.signOut();
                    loading.style.display = "none";
                    return;
                }
                
                // Se o login for bem-sucedido, chama a função para verificar a permissão.
                checkAdminRoleAndRedirect(user);
            })
            .catch((error) => {
                // Se o login falhar, exibe uma mensagem de erro.
                showMessage(simpleErrorMessage(error));
                loading.style.display = "none";
            });
    });
}

// --- Login com Google ---
const googleLoginButton = document.getElementById("google-login");
if (googleLoginButton) {
    googleLoginButton.addEventListener("click", () => {
        loading.style.display = "block";
        const provider = new firebase.auth.GoogleAuthProvider();

        // Abre o pop-up de login do Google.
        auth.signInWithPopup(provider)
            .then((result) => {
                // Se o login for bem-sucedido, chama a função para verificar a permissão.
                checkAdminRoleAndRedirect(result.user);
            })
            .catch((error) => {
                // Se falhar, exibe uma mensagem de erro.
                showMessage(simpleErrorMessage(error));
                loading.style.display = "none";
            });
    });
}