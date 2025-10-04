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
const db = firebase.firestore();

const loginForm = document.getElementById("login-form");
const emailInput = document.getElementById("login-email");
const passwordInput = document.getElementById("login-password");
const messageBox = document.getElementById("message");
const loading = document.getElementById("loading");

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

function checkAdminRoleAndRedirect(user) {
    console.log("Iniciando verificação de admin para o UID:", user.uid);
    const userDocRef = db.collection('users').doc(user.uid);
    userDocRef.get().then((doc) => {
        if (doc.exists) {
            const userRole = doc.data().role;
            if (userRole === 'admin') {
                showMessage("Bem-vindo(a), Admin!", "success");
                setTimeout(() => window.location.href = "admin.html", 1200);
            } else {
                showMessage("Login realizado com sucesso!", "success");
                setTimeout(() => window.location.href = "index.html", 1200);
            }
        } else {
            showMessage("Login realizado com sucesso!", "success");
            setTimeout(() => window.location.href = "index.html", 1200);
        }
    }).catch((error) => {
        showMessage("Login realizado com sucesso!", "success");
        setTimeout(() => window.location.href = "index.html", 1200);
    }).finally(() => {
        if (loading) {
            loading.style.display = "none";
        }
    });
}

loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    loading.style.display = "block";
    messageBox.style.display = "none";

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    const invalid = validateInputs(email, password);
    if (invalid) {
        showMessage(invalid);
        loading.style.display = "none";
        return;
    }

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;

            if (!user.emailVerified) {
                showMessage("Por favor, verifique seu e-mail antes de entrar.");
                auth.signOut();
                loading.style.display = "none";
                return;
            }
            checkAdminRoleAndRedirect(user);
        })
        .catch((error) => {
            console.error("Erro de login:", error);
            showMessage(simpleErrorMessage(error));
            loading.style.display = "none";
        });
});

document.getElementById("google-login").addEventListener("click", () => {
    loading.style.display = "block";
    const provider = new firebase.auth.GoogleAuthProvider();

    auth.signInWithPopup(provider)
        .then((result) => {
            const user = result.user;
            console.log("Logado com Google:", user.email);
            checkAdminRoleAndRedirect(user);
        })
        .catch((error) => {
            console.error("Erro login Google:", error);
            showMessage(simpleErrorMessage(error));
            loading.style.display = "none";
        });
});