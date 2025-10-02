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
    const form = document.getElementById('login-form');
    const message = document.getElementById('message');

    if (!message) {
        const messageDiv = document.createElement('div');
        messageDiv.id = 'message';
        messageDiv.className = 'message';
        messageDiv.style.display = 'none';
        form.parentNode.insertBefore(messageDiv, form);
    }

    function showMessage(text, type) {
        const message = document.getElementById('message');
        message.textContent = text;
        message.className = `message ${type}`;
        message.style.display = 'block';
        
        setTimeout(() => {
            message.style.display = 'none';
        }, 5000);
    }

    auth.onAuthStateChanged((user) => {
        if (user && user.emailVerified) {
            window.location.href = 'dashboard.html';
        }
    });

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const identifier = document.getElementById('login-identifier').value;
        const password = document.getElementById('login-password').value;

        let email = identifier;
        if (!identifier.includes('@')) {
            
            email = identifier;
        }

        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;

            if (!user.emailVerified) {
                showMessage('Por favor, verifique seu email antes de fazer login.', 'error');
                await auth.signOut();
                return;
            }

            showMessage('Login realizado com sucesso!', 'success');
            
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);

        } catch (error) {
            console.error('Erro no login:', error);
            
            let errorMessage = 'Erro ao fazer login: ';
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage += 'Usuário não encontrado.';
                    break;
                case 'auth/wrong-password':
                    errorMessage += 'Senha incorreta.';
                    break;
                case 'auth/invalid-email':
                    errorMessage += 'Email inválido.';
                    break;
                case 'auth/user-disabled':
                    errorMessage += 'Esta conta foi desativada.';
                    break;
                default:
                    errorMessage += error.message;
            }
            
            showMessage(errorMessage, 'error');
        }
    });
    document.querySelector('.btn-social.google').addEventListener('click', async function() {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            const result = await auth.signInWithPopup(provider);
            
            showMessage('Login com Google realizado com sucesso!', 'success');
            
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);

        } catch (error) {
            console.error('Erro no login com Google:', error);
            showMessage('Erro ao fazer login com Google.', 'error');
        }
    });

    document.querySelector('.btn-social.apple').addEventListener('click', async function() {
        try {
            const provider = new firebase.auth.OAuthProvider('apple.com');
            const result = await auth.signInWithPopup(provider);
            
            showMessage('Login com Apple realizado com sucesso!', 'success');
            
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);

        } catch (error) {
            console.error('Erro no login com Apple:', error);
            showMessage('Erro ao fazer login com Apple.', 'error');
        }
    });

document.querySelector('.forgot-password a').addEventListener('click', function(e) {
    e.preventDefault();
    
    const identifier = document.getElementById('login-identifier').value;
    let url = 'esqueci-senha.html';
    
    if (identifier && identifier.includes('@')) {
        url += `?email=${encodeURIComponent(identifier)}`;
    }
    
    window.location.href = url;
});
});