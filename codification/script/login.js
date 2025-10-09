// ==========================================================
// IMPORTS DO FIREBASE (versão modular)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

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
async function checkAdminRoleAndRedirect(user) {
    try {
        const userRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userRef);

        if (docSnap.exists() && docSnap.data().role === 'admin') {
            showMessage("Bem-vindo(a), Admin!", "success");
            setTimeout(() => window.location.href = "admin.html", 1200);
        } else {
            showMessage("Login realizado com sucesso!", "success");
            setTimeout(() => window.location.href = "index.html", 1200);
        }
    } catch (error) {
        console.error("Erro ao verificar permissão:", error);
        showMessage("Login realizado com sucesso!", "success");
        setTimeout(() => window.location.href = "index.html", 1200);
    } finally {
        if (loading) loading.style.display = "none";
    }
}

// ==========================================================
// EVENT LISTENERS
// ==========================================================
if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        loading.style.display = "block";

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        const invalid = validateInputs(email, password);
        if (invalid) {
            showMessage(invalid);
            loading.style.display = "none";
            return;
        }

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            if (!user.emailVerified) {
                showMessage("Por favor, verifique seu e-mail antes de entrar.");
                await signOut(auth);
                loading.style.display = "none";
                return;
            }

            await checkAdminRoleAndRedirect(user);
        } catch (error) {
            showMessage(simpleErrorMessage(error));
            loading.style.display = "none";
        }
    });
}

const googleLoginButton = document.getElementById("google-login");
if (googleLoginButton) {
    googleLoginButton.addEventListener("click", async () => {
        loading.style.display = "block";
        const provider = new GoogleAuthProvider();

        try {
            const result = await signInWithPopup(auth, provider);
            await checkAdminRoleAndRedirect(result.user);
        } catch (error) {
            showMessage(simpleErrorMessage(error));
            loading.style.display = "none";
        }
    });
}