// Configuração do Firebase
const firebaseConfig = {
    apiKey: "sua-api-key-aqui",
    authDomain: "seu-projeto.firebaseapp.com",
    projectId: "seu-projeto-id",
    storageBucket: "seu-projeto.appspot.com",
    messagingSenderId: "seu-sender-id",
    appId: "seu-app-id"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('register-form');
    const loading = document.getElementById('loading');
    const message = document.getElementById('message');

    function showMessage(text, type) {
        message.textContent = text;
        message.className = `message ${type}`;
        message.style.display = 'block';
        
        setTimeout(() => {
            message.style.display = 'none';
        }, 5000);
    }

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const fullName = document.getElementById('full-name').value;
        const acceptTerms = document.querySelector('.marketing-options input[type="checkbox"]:last-child').checked;

        // Validações
        if (password !== confirmPassword) {
            showMessage('As senhas não coincidem!', 'error');
            return;
        }

        if (!acceptTerms) {
            showMessage('Você deve aceitar os termos de uso!', 'error');
            return;
        }

        if (password.length < 6) {
            showMessage('A senha deve ter pelo menos 6 caracteres!', 'error');
            return;
        }

        try {
            loading.style.display = 'block';
            
            // Criar usuário no Firebase
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Atualizar perfil do usuário
            await user.updateProfile({
                displayName: fullName
            });

            // Enviar email de verificação
            await user.sendEmailVerification();

            showMessage('Conta criada com sucesso! Verifique seu email para ativar sua conta.', 'success');
            
            // Redirecionar após 3 segundos
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 3000);

        } catch (error) {
            console.error('Erro no cadastro:', error);
            
            let errorMessage = 'Erro ao criar conta: ';
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage += 'Este email já está em uso.';
                    break;
                case 'auth/invalid-email':
                    errorMessage += 'Email inválido.';
                    break;
                case 'auth/weak-password':
                    errorMessage += 'Senha muito fraca.';
                    break;
                default:
                    errorMessage += error.message;
            }
            
            showMessage(errorMessage, 'error');
        } finally {
            loading.style.display = 'none';
        }
    });

    // Formatação dos campos (mantido do código anterior)
    const cpfInput = document.getElementById('cpf');
    cpfInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        
        if (value.length > 11) {
            value = value.substring(0, 11);
        }
        
        if (value.length > 9) {
            value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        } else if (value.length > 6) {
            value = value.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
        } else if (value.length > 3) {
            value = value.replace(/(\d{3})(\d{1,3})/, '$1.$2');
        }
        
        e.target.value = value;
    });
    
    const birthDateInput = document.getElementById('birth-date');
    birthDateInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        
        if (value.length > 8) {
            value = value.substring(0, 8);
        }
        
        if (value.length > 4) {
            value = value.replace(/(\d{2})(\d{2})(\d{1,4})/, '$1/$2/$3');
        } else if (value.length > 2) {
            value = value.replace(/(\d{2})(\d{1,2})/, '$1/$2');
        }
        
        e.target.value = value;
    });
    
    const phoneInput = document.getElementById('phone');
    phoneInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        
        if (value.length > 11) {
            value = value.substring(0, 11);
        }
        
        if (value.length > 10) {
            value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        } else if (value.length > 6) {
            value = value.replace(/(\d{2})(\d{4})(\d{1,4})/, '($1) $2-$3');
        } else if (value.length > 2) {
            value = value.replace(/(\d{2})(\d{1,4})/, '($1) $2');
        } else if (value.length > 0) {
            value = value.replace(/(\d{1,2})/, '($1');
        }
        
        e.target.value = value;
    });
});