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

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// ==========================================================
// SELEÇÃO DE ELEMENTOS DO HTML
// ==========================================================
const adminUserEmail = document.getElementById('admin-user-email');
const adminLogoutBtn = document.getElementById('admin-logout-btn');
const productForm = document.getElementById('product-form');
const adminProductList = document.getElementById('admin-product-list');
const uploadProgress = document.getElementById('upload-progress');
const saveProductBtn = document.getElementById('save-product-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const formTitle = document.getElementById('form-title');

// Variável para controlar se o formulário está em modo de criação (null) ou edição (com um ID).
let currentEditingId = null; 

// ==========================================================
// SEGURANÇA E GERENCIAMENTO DE SESSÃO
// ==========================================================

// Verifica o estado de autenticação do usuário em tempo real.
auth.onAuthStateChanged(user => {
    if (user) {
        // Se o usuário estiver logado, verifica se ele é um administrador.
        db.collection('users').doc(user.uid).get().then(doc => {
            if (doc.exists && doc.data().role === 'admin') {
                // Se for admin, exibe o email e carrega os produtos.
                if (adminUserEmail) adminUserEmail.textContent = user.email;
                loadAdminProducts(); 
            } else {
                // Se não for admin, nega o acesso e redireciona.
                alert("Acesso negado. Você não é um administrador.");
                window.location.href = "/paginas/login.html";
            }
        });
    } else {
        // Se não houver usuário logado, redireciona para o login.
        window.location.href = "/paginas/login.html";
    }
});

// Adiciona a funcionalidade de logout ao botão "Sair".
if (adminLogoutBtn) {
    adminLogoutBtn.addEventListener('click', () => {
        auth.signOut().then(() => window.location.href = "/paginas/login.html");
    });
}

// ==========================================================
// LÓGICA DO FORMULÁRIO (CRIAR E ATUALIZAR)
// ==========================================================

// Ouve o evento de envio do formulário de produtos.
productForm.addEventListener('submit', (e) => {
    e.preventDefault(); // Impede o recarregamento da página.

    // Coleta todos os dados do formulário.
    const productData = {
        name: document.getElementById('product-name').value,
        price: parseFloat(document.getElementById('product-price').value),
        stock: parseInt(document.getElementById('product-stock').value),
        category: document.getElementById('product-category').value,
        isOnOffer: document.getElementById('product-offer').checked
    };
    const imageFile = document.getElementById('product-image').files[0];

    // Se uma imagem foi selecionada, faz o upload primeiro.
    if (imageFile) {
        const storageRef = storage.ref(`product-images/${Date.now()}_${imageFile.name}`);
        const uploadTask = storageRef.put(imageFile);

        // Acompanha o progresso do upload da imagem.
        uploadTask.on('state_changed', 
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                uploadProgress.style.display = 'block';
                uploadProgress.textContent = `Enviando imagem... ${Math.round(progress)}%`;
            }, 
            (error) => console.error("Erro no upload:", error), 
            () => {
                // Ao concluir o upload, pega a URL da imagem e chama a função para salvar.
                uploadTask.snapshot.ref.getDownloadURL().then(downloadURL => {
                    productData.imageUrl = downloadURL;
                    saveOrUpdateProduct(productData);
                });
            }
        );
    } else {
        // Se nenhuma imagem foi selecionada (em modo de edição), salva os outros dados.
        saveOrUpdateProduct(productData);
    }
});

function saveOrUpdateProduct(productData) {
    if (currentEditingId) {
        // Se estiver em modo de edição, atualiza o documento existente.
        db.collection('products').doc(currentEditingId).update(productData).then(() => {
            alert("Produto atualizado com sucesso!");
            resetForm();
        }).catch(error => console.error("Erro ao atualizar:", error));
    } else {
        // Se não, cria um novo documento.
        productData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        db.collection('products').add(productData).then(() => {
            alert("Produto salvo com sucesso!");
            resetForm();
        }).catch(error => console.error("Erro ao salvar:", error));
    }
}

// ==========================================================
// LISTAGEM, EDIÇÃO E EXCLUSÃO (READ, UPDATE, DELETE)
// ==========================================================

/** Carrega e exibe a lista de produtos em tempo real. */
function loadAdminProducts() {
    db.collection('products').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
        adminProductList.innerHTML = ''; // Limpa a lista para redesenhar.
        snapshot.forEach(doc => {
            const product = doc.data();
            const productItem = document.createElement('div');
            productItem.className = 'product-list-item';
            // Cria o HTML para cada item da lista.
            productItem.innerHTML = `
                <img src="${product.imageUrl || 'https://via.placeholder.com/150'}" alt="${product.name}">
                <span class="product-list-item-name">${product.name} (${product.category})</span>
                <div class="product-list-actions">
                    <button class="btn-edit" data-id="${doc.id}">Editar</button>
                    <button class="btn-delete" data-id="${doc.id}">Deletar</button>
                </div>
            `;
            adminProductList.appendChild(productItem);
        });
    });
}

// Usa "Event Delegation" para ouvir cliques nos botões de editar e deletar.
adminProductList.addEventListener('click', (e) => {
    const target = e.target;
    const id = target.dataset.id;

    // Se o botão de "Editar" for clicado...
    if (target.classList.contains('btn-edit')) {
        // Busca os dados do produto no Firestore e preenche o formulário.
        db.collection('products').doc(id).get().then(doc => {
            if (doc.exists) {
                const product = doc.data();
                document.getElementById('product-name').value = product.name;
                document.getElementById('product-price').value = product.price;
                document.getElementById('product-stock').value = product.stock;
                document.getElementById('product-category').value = product.category;
                document.getElementById('product-offer').checked = product.isOnOffer || false;
                
                // Entra no modo de edição.
                currentEditingId = id;
                formTitle.textContent = "Editando Produto";
                saveProductBtn.textContent = "Atualizar Produto";
                cancelEditBtn.style.display = "inline-block";
                window.scrollTo(0, 0); // Rola a página para o topo.
            }
        });
    }

    // Se o botão de "Deletar" for clicado...
    if (target.classList.contains('btn-delete')) {
        if (confirm("Tem certeza que deseja deletar este produto?")) {
            db.collection('products').doc(id).delete()
              .then(() => alert("Produto deletado!"))
              .catch(error => console.error("Erro ao deletar:", error));
        }
    }
});

// Adiciona o evento ao botão de cancelar edição.
cancelEditBtn.addEventListener('click', resetForm);

/** Reseta o formulário para o estado inicial de "Adicionar Produto". */
function resetForm() {
    productForm.reset();
    currentEditingId = null; // Sai do modo de edição.
    formTitle.textContent = "Adicionar Novo Produto";
    saveProductBtn.textContent = "Salvar Produto";
    cancelEditBtn.style.display = "none";
    if (uploadProgress) uploadProgress.style.display = 'none';
}