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

const adminUserEmail = document.getElementById('admin-user-email');
const adminLogoutBtn = document.getElementById('admin-logout-btn');
const productForm = document.getElementById('product-form');
const adminProductList = document.getElementById('admin-product-list');
const uploadProgress = document.getElementById('upload-progress');
const saveProductBtn = document.getElementById('save-product-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const formTitle = document.getElementById('form-title');
let currentEditingId = null; 

auth.onAuthStateChanged(user => {
    if (user) {
        db.collection('users').doc(user.uid).get().then(doc => {
            if (doc.exists && doc.data().role === 'admin') {
                if (adminUserEmail) adminUserEmail.textContent = user.email;
                loadAdminProducts(); 
            } else {
                alert("Acesso negado. Você não é um administrador.");
                window.location.href = "/paginas/login.html";
            }
        });
    } else {
        window.location.href = "/paginas/login.html";
    }
});

if (adminLogoutBtn) {
    adminLogoutBtn.addEventListener('click', () => {
        auth.signOut().then(() => window.location.href = "/paginas/login.html");
    });
}

productForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const productData = {
        name: document.getElementById('product-name').value,
        price: parseFloat(document.getElementById('product-price').value),
        stock: parseInt(document.getElementById('product-stock').value),
        category: document.getElementById('product-category').value,
        isOnOffer: document.getElementById('product-offer').checked
    };
    const imageFile = document.getElementById('product-image').files[0];



    if (imageFile) {
        const storageRef = storage.ref(`product-images/${Date.now()}_${imageFile.name}`);
        const uploadTask = storageRef.put(imageFile);

        uploadTask.on('state_changed', 
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                uploadProgress.style.display = 'block';
                uploadProgress.textContent = `Enviando imagem... ${Math.round(progress)}%`;
            }, 
            (error) => console.error("Erro no upload:", error), 
            () => {
                uploadTask.snapshot.ref.getDownloadURL().then(downloadURL => {
                    productData.imageUrl = downloadURL;
                    saveOrUpdateProduct(productData);
                });
            }
        );
    } else {
        saveOrUpdateProduct(productData);
    }
});

function saveOrUpdateProduct(productData) {
    if (currentEditingId) {
        db.collection('products').doc(currentEditingId).update(productData).then(() => {
            alert("Produto atualizado com sucesso!");
            resetForm();
        }).catch(error => console.error("Erro ao atualizar:", error));
    } else {
        productData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        db.collection('products').add(productData).then(() => {
            alert("Produto salvo com sucesso!");
            resetForm();
        }).catch(error => console.error("Erro ao salvar:", error));
    }
}

function loadAdminProducts() {
    db.collection('products').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
        adminProductList.innerHTML = '';
        snapshot.forEach(doc => {
            const product = doc.data();
            const productItem = document.createElement('div');
            productItem.className = 'product-list-item';
            productItem.innerHTML = `
                <img src="${product.imageUrl}" alt="${product.name}">
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

adminProductList.addEventListener('click', (e) => {
    const target = e.target;
    const id = target.dataset.id;

    if (target.classList.contains('btn-edit')) {
        db.collection('products').doc(id).get().then(doc => {
            if (doc.exists) {
                const product = doc.data();
                document.getElementById('product-name').value = product.name;
                document.getElementById('product-price').value = product.price;
                document.getElementById('product-stock').value = product.stock;
                document.getElementById('product-category').value = product.category;
                
                document.getElementById('product-offer').checked = product.isOnOffer || false;
                
                currentEditingId = id;
                formTitle.textContent = "Editando Produto";
                saveProductBtn.textContent = "Atualizar Produto";
                cancelEditBtn.style.display = "inline-block";
                window.scrollTo(0, 0);
            }
        });
    }

    if (target.classList.contains('btn-delete')) {
        if (confirm("Tem certeza que deseja deletar este produto?")) {
            db.collection('products').doc(id).delete()
              .then(() => alert("Produto deletado!"))
              .catch(error => console.error("Erro ao deletar:", error));
        }
    }
});

cancelEditBtn.addEventListener('click', resetForm);

function resetForm() {
    productForm.reset();
    currentEditingId = null;
    formTitle.textContent = "Adicionar Novo Produto";
    saveProductBtn.textContent = "Salvar Produto";
    cancelEditBtn.style.display = "none";
    if (uploadProgress) uploadProgress.style.display = 'none';
}