import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

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

const loginForm = document.getElementById("login-form");
const emailInput = document.getElementById("login-email");
const passwordInput = document.getElementById("login-password");
const messageBox = document.getElementById("message");
const loading = document.getElementById("loading");

function showMessage(text, type = "error") {
    if (!messageBox) return;
    messageBox.style.display = "block";
    messageBox.className = "message " + type;
    messageBox.innerText = text;
    setTimeout(() => {
        messageBox.style.display = "none";
    }, 6000);
}

function simpleErrorMessage(error) {
    console.error("Erro Firebase Detalhado:", error.code, error.message);

    if (error && error.code) {
        switch (error.code) {
            case "auth/invalid-credential":
            case "auth/invalid-login-credentials": 
            case "auth/wrong-password":
            case "auth/user-not-found":
                return "E-mail ou senha incorretos. (Se criou com Google, use o botão Google)";
            
            case "auth/invalid-email":
                return "O formato do e-mail é inválido.";
            
            case "auth/user-disabled":
                return "Esta conta foi desativada pelo administrador.";
            
            case "auth/too-many-requests":
                return "Muitas tentativas falhas. Aguarde alguns minutos ou redefina sua senha.";
                
            case "auth/network-request-failed":
                return "Erro de conexão. Verifique sua internet.";
                
            default:
                return "Erro ao entrar (" + error.code + "). Tente novamente.";
        }
    }
    return "Ocorreu um erro inesperado. Tente novamente.";
}

function validateInputs(email, password) {
    if (!email) return "Informe o e-mail.";
    if (!password) return "Informe a senha.";
    return null;
}

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

if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const recaptchaResponse = grecaptcha.getResponse();
        if (recaptchaResponse.length === 0) {
            showMessage("Por favor, marque a caixa 'Não sou um robô'.");
            return;
        }

        if (loading) loading.style.display = "block";

        const email = emailInput.value.trim(); 
        const password = passwordInput.value.trim();

        const invalid = validateInputs(email, password);
        if (invalid) {
            showMessage(invalid);
            if (loading) loading.style.display = "none";
            return;
        }

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            if (!user.emailVerified) {
                showMessage("Por favor, verifique seu e-mail antes de entrar.");
                await signOut(auth);
                if (loading) loading.style.display = "none";
                return;
            }

            await checkAdminRoleAndRedirect(user);
        } catch (error) {
            showMessage(simpleErrorMessage(error));
            if (loading) loading.style.display = "none";
            grecaptcha.reset(); 
        }
    });
}

const googleLoginButton = document.getElementById("google-login");
if (googleLoginButton) {
    googleLoginButton.addEventListener("click", async () => {
        
        const recaptchaResponse = grecaptcha.getResponse();
        if (recaptchaResponse.length === 0) {
            showMessage("Por favor, marque a caixa 'Não sou um robô' antes de conectar com o Google.");
            return; 
        }

        if (loading) loading.style.display = "block";
        const provider = new GoogleAuthProvider();

        try {
            const result = await signInWithPopup(auth, provider);
            await checkAdminRoleAndRedirect(result.user);
        } catch (error) {
            console.error("Erro Google:", error);
            showMessage(simpleErrorMessage(error));
            if (loading) loading.style.display = "none";
            grecaptcha.reset();
        }
    });
}