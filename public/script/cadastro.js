
const firebaseConfig = {
    apiKey: "AIzaSyB_Pd9n5VzXloRQvqusZUIhwZVmJvnKfQc",
    authDomain: "boombum-eaf32.firebaseapp.com",
    projectId: "boombum-eaf32",
    storageBucket: "boombum-eaf32.firebasestorage.app",
    messagingSenderId: "827065363375",
    appId: "1:827065363375:web:913f128e651fcdbe145d5a"
};


firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();


document.addEventListener("DOMContentLoaded", function () {
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

    form.addEventListener("submit", async (e) => {
        e.preventDefault(); 

        const fullName = document.getElementById("full-name").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirm-password").value;
        const acceptTerms = form.querySelector('input[type="checkbox"][required]');
        const isTermsChecked = acceptTerms ? acceptTerms.checked : false;

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

            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;


            await user.updateProfile({ displayName: fullName });

            await user.sendEmailVerification();


            showMessage("Conta criada! Verifique seu e-mail para ativar sua conta.", "success");
            setTimeout(() => {
                window.location.href = "login.html";
            }, 3000);

        } catch (error) {
            console.error("Erro no cadastro:", error);
            
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
            loading.style.display = "none";
        }
    });
});