// --- 1. CONFIGURAÇÃO FIREBASE ---
const firebaseConfig = {
    apiKey: "AIzaSyB_Pd9n5VzXloRQvqusZUIhwZVmJvnKfQc",
    authDomain: "boombum-eaf32.firebaseapp.com",
    projectId: "boombum-eaf32",
    storageBucket: "boombum-eaf32.firebasestorage.app",
    messagingSenderId: "827065363375",
    appId: "1:827065363375:web:913f128e651fcdbe145d5a",
    measurementId: "G-D7CBRK53E0"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

// --- 2. SELETORES DOM ---
// Navegação
const linkDashboard = document.getElementById('link-dashboard');
const linkProducts = document.getElementById('link-products');
const viewDashboard = document.getElementById('view-dashboard');
const viewProducts = document.getElementById('view-products');

// Elementos Gerais
const adminUserEmail = document.getElementById('admin-user-email');
const adminLogoutBtn = document.getElementById('admin-logout-btn');

// Elementos do Formulário e Lista
const productForm = document.getElementById('product-form');
const adminProductList = document.getElementById('admin-product-list');
const saveProductBtn = document.getElementById('save-product-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const formTitleDisplay = document.getElementById('form-title-display');

let currentEditingId = null;

// --- 3. LÓGICA DE NAVEGAÇÃO (ABAS) ---

function showDashboard() {
    viewDashboard.style.display = 'block';
    viewProducts.style.display = 'none';
    
    if(linkDashboard) linkDashboard.classList.add('active');
    if(linkProducts) linkProducts.classList.remove('active');
}

function showProducts() {
    viewDashboard.style.display = 'none';
    viewProducts.style.display = 'block';
    
    if(linkDashboard) linkDashboard.classList.remove('active');
    if(linkProducts) linkProducts.classList.add('active');
}

window.irParaAdicionar = function() {
    resetForm();
    showDashboard();
};

if(linkDashboard) {
    linkDashboard.addEventListener('click', (e) => {
        e.preventDefault();
        showDashboard();
    });
}

if(linkProducts) {
    linkProducts.addEventListener('click', (e) => {
        e.preventDefault();
        showProducts();
    });
}

// --- 4. AUTENTICAÇÃO ---
auth.onAuthStateChanged(user => {
    if (user) {
        db.collection('users').doc(user.uid).get().then(doc => {
            if (doc.exists && doc.data().role === 'admin') {
                if (adminUserEmail) adminUserEmail.textContent = user.email;
                loadAdminProducts(); 
            } else {
                alert("Acesso negado. Apenas administradores.");
                auth.signOut();
                window.location.href = "login.html";
            }
        }).catch(err => {
            console.error("Erro admin:", err);
        });
    } else {
        window.location.href = "login.html";
    }
});

if (adminLogoutBtn) {
    adminLogoutBtn.addEventListener('click', () => {
        auth.signOut().then(() => window.location.href = "login.html");
    });
}

// --- 5. SALVAR / ATUALIZAR PRODUTO ---
productForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const productData = {
        name: document.getElementById('product-name').value,
        price: parseFloat(document.getElementById('product-price').value),
        stock: parseInt(document.getElementById('product-stock').value),
        category: document.getElementById('product-category').value,
        // CORREÇÃO AQUI: Salvando como imageUrl1 para bater com seu banco
        imageUrl1: document.getElementById('product-image').value, 
        isOnOffer: document.getElementById('product-offer').checked
    };

    if (currentEditingId) {
        db.collection('products').doc(currentEditingId).update(productData).then(() => {
            alert("Produto atualizado com sucesso!");
            resetForm();
        }).catch(error => {
            console.error("Erro ao atualizar:", error);
            alert("Erro ao atualizar.");
        });
    } else {
        productData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        db.collection('products').add(productData).then(() => {
            alert("Produto salvo com sucesso!");
            resetForm();
        }).catch(error => {
            console.error("Erro ao salvar:", error);
            alert("Erro ao salvar.");
        });
    }
});

// --- 6. LISTAR PRODUTOS ---
function loadAdminProducts() {
    db.collection('products').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
        adminProductList.innerHTML = '';
        
        if (snapshot.empty) {
            adminProductList.innerHTML = '<p>Nenhum produto cadastrado.</p>';
            return;
        }

        snapshot.forEach(doc => {
            const product = doc.data();
            const precoFormatado = product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

            // CORREÇÃO AQUI: Buscando imageUrl1 (com fallback para imageUrl antiga se houver)
            const imgUrl = product.imageUrl1 || product.imageUrl || 'https://via.placeholder.com/150';

            const productItem = document.createElement('div');
            productItem.className = 'product-list-item';
            
            productItem.innerHTML = `
                <img src="${imgUrl}" alt="${product.name}" style="object-fit: cover;">
                <div style="flex: 1; padding: 0 15px;">
                    <strong>${product.name}</strong> <br>
                    <span style="font-size: 14px; color: #666;">${product.category} | Estoque: ${product.stock}</span> <br>
                    <span style="color: #084c8c; font-weight: bold;">${precoFormatado}</span>
                </div>
                <div class="product-list-actions">
                    <button class="btn-edit btn-secondary-admin" onclick="prepararEdicao('${doc.id}')">Editar</button>
                    <button class="btn-delete btn-danger-admin" onclick="deletarProduto('${doc.id}')" style="background-color: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; margin-left: 5px;">Excluir</button>
                </div>
            `;
            adminProductList.appendChild(productItem);
        });
    });
}

// --- 7. FUNÇÕES DE AÇÃO ---

window.prepararEdicao = function(id) {
    db.collection('products').doc(id).get().then(doc => {
        if (doc.exists) {
            const product = doc.data();
            
            document.getElementById('product-name').value = product.name;
            document.getElementById('product-price').value = product.price;
            document.getElementById('product-stock').value = product.stock;
            document.getElementById('product-category').value = product.category;
            // CORREÇÃO AQUI: Carregando do campo imageUrl1
            document.getElementById('product-image').value = product.imageUrl1 || product.imageUrl || '';
            document.getElementById('product-offer').checked = product.isOnOffer || false;
            document.getElementById('product-id').value = id;

            currentEditingId = id;
            if(formTitleDisplay) formTitleDisplay.textContent = "Editando: " + product.name;
            saveProductBtn.textContent = "Atualizar Produto";
            cancelEditBtn.style.display = "inline-block";

            showDashboard();
        }
    });
};

window.deletarProduto = function(id) {
    if (confirm("Tem certeza que deseja deletar este produto?")) {
        db.collection('products').doc(id).delete()
          .then(() => alert("Produto deletado!"))
          .catch(error => console.error("Erro ao deletar:", error));
    }
};

// --- 8. RESETAR FORMULÁRIO ---
function resetForm() {
    productForm.reset();
    currentEditingId = null;
    document.getElementById('product-id').value = '';
    
    if(formTitleDisplay) formTitleDisplay.textContent = "Gerenciamento de Produtos";
    saveProductBtn.textContent = "Salvar Produto";
    cancelEditBtn.style.display = "none";
}

if(cancelEditBtn) {
    cancelEditBtn.addEventListener('click', resetForm);
}