const firebaseConfig = {
    apiKey: "sua-api-key-aqui",
    authDomain: "seu-projeto.firebaseapp.com",
    projectId: "seu-projeto-id",
    storageBucket: "seu-projeto.appspot.com",
    messagingSenderId: "seu-sender-id",
    appId: "seu-app-id"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('recovery-form');
    const loading = document.getElementById('loading');
    const message = document.getElementById('message');
    const instructions = document.getElementById('instructions');
    const emailInput = document.getElementById('email');

    function showMessage(text, type) {
        message.textContent = text;
        message.className = `message ${type}`;
        message.style.display = 'block';
        
        setTimeout(() => {
            message.style.display = 'none';
        }, 5000);
    }

    function showInstructions() {
        instructions.style.display = 'block';
        form.style.display = 'none';
    }

    function hideInstructions() {
        instructions.style.display = 'none';
        form.style.display = 'block';
    }

    document.querySelector('.login-link a').addEventListener('click', function(e) {
        if (instructions.style.display === 'block') {
            e.preventDefault();
            hideInstructions();
            emailInput.value = '';
        }
    });

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = emailInput.value.trim();

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
            
            await auth.sendPasswordResetEmail(email);
            
            loading.style.display = 'none';
            showInstructions();
            
        } catch (error) {
            loading.style.display = 'none';
            console.error('Erro ao enviar email de recuperação:', error);
            
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
                    errorMessage += error.message;
            }
            
            showMessage(errorMessage, 'error');
        }
    });

    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get('email');
    if (emailParam) {
        emailInput.value = emailParam;
    }
});