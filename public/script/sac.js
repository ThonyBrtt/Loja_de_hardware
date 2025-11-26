document.addEventListener('DOMContentLoaded', () => {
    

    const style = document.createElement('style');
    style.innerHTML = `
        #sac-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.5); z-index: 20000;
            display: none; justify-content: center; align-items: center;
            opacity: 0; transition: opacity 0.3s ease;
        }
        #sac-overlay.visible { display: flex; opacity: 1; }

        .sac-modal {
            background: white; width: 90%; max-width: 400px;
            padding: 25px; border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            position: relative; font-family: Arial, sans-serif;
            transform: translateY(20px); transition: transform 0.3s ease;
        }
        #sac-overlay.visible .sac-modal { transform: translateY(0); }

        .sac-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .sac-header h2 { margin: 0; color: #ff6600; font-size: 20px; }
        .close-sac { cursor: pointer; font-size: 24px; font-weight: bold; color: #333; }
        
        .sac-form label { display: block; margin-bottom: 5px; font-weight: bold; color: #333; font-size: 14px; }
        .sac-form select, .sac-form textarea {
            width: 100%; padding: 10px; margin-bottom: 15px;
            border: 1px solid #ddd; border-radius: 5px;
            font-family: inherit; box-sizing: border-box;
        }
        .sac-form textarea { height: 100px; resize: vertical; }
        
        .sac-btn {
            width: 100%; background: #084c8c; color: white;
            border: none; padding: 12px; border-radius: 5px;
            font-weight: bold; cursor: pointer; transition: background 0.3s;
        }
        .sac-btn:hover { background: #063a6b; }
    `;
    document.head.appendChild(style);

    const modalHTML = `
        <div id="sac-overlay">
            <div class="sac-modal">
                <div class="sac-header">
                    <h2>Relatar um Bug 🐛</h2>
                    <span id="close-sac" class="close-sac">&times;</span>
                </div>
                <p style="font-size:13px; color:#666; margin-bottom:15px;">
                    Olá, <strong id="sac-user-name">Usuário</strong>! Ajude a melhorar o BoomBum Beta.
                </p>
                
                <form id="sac-form" class="sac-form">
                    <label for="bug-page">Onde ocorreu?</label>
                    <select id="bug-page" required>
                        <option value="Home">Página Inicial</option>
                        <option value="Ofertas">Página de Ofertas</option>
                        <option value="Hardware">Hardware</option>
                        <option value="PC Gamer">PC Gamer</option>
                        <option value="Perifericos">Periféricos</option>
                        <option value="Carrinho">Carrinho / Checkout</option>
                        <option value="Outro">Outro</option>
                    </select>

                    <label for="bug-desc">Descrição do Erro:</label>
                    <textarea id="bug-desc" placeholder="Descreva o que aconteceu..." required></textarea>

                    <button type="submit" class="sac-btn">Enviar Report</button>
                </form>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const sacIcon = document.getElementById('abrir-sac');
    const overlay = document.getElementById('sac-overlay');
    const closeBtn = document.getElementById('close-sac');
    const form = document.getElementById('sac-form');
    const userNameSpan = document.getElementById('sac-user-name');

    function toggleSac() {
        if (overlay.classList.contains('visible')) {
            overlay.classList.remove('visible');
            setTimeout(() => { overlay.style.display = 'none'; }, 300);
        } else {
            overlay.style.display = 'flex';
            setTimeout(() => { overlay.classList.add('visible'); }, 10);
        }
    }

    if (sacIcon) {
        sacIcon.addEventListener('click', () => {
            const user = firebase.auth().currentUser;

            if (!user) {
                alert(" Para participar do Beta e relatar bugs, você precisa fazer login primeiro!");
                window.location.href = "login.html";
                return;
            }
            
            userNameSpan.textContent = user.email;
            toggleSac();
        });
    }

    if (closeBtn) closeBtn.addEventListener('click', toggleSac);
    
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) toggleSac();
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (typeof db === 'undefined') {
            alert("Erro: Banco de dados não conectado.");
            return;
        }

        const user = firebase.auth().currentUser;
        if (!user) return;

        const page = document.getElementById('bug-page').value;
        const description = document.getElementById('bug-desc').value;

        const bugData = {
            page: page,
            description: description,
            userEmail: user.email, 
            userId: user.uid,
            date: firebase.firestore.FieldValue.serverTimestamp(),
            status: "pendente"
        };

        try {
            const btn = form.querySelector('button');
            const originalText = btn.innerText;
            btn.innerText = "Enviando...";
            btn.disabled = true;

            await db.collection('bugs').add(bugData);

            alert("Bug reportado com sucesso! A equipe BoomBum agradece.");
            form.reset();
            toggleSac();
            
            btn.innerText = originalText;
            btn.disabled = false;

        } catch (error) {
            console.error("Erro ao enviar bug:", error);
            alert("Erro ao enviar. Tente novamente.");
        }
    });
});