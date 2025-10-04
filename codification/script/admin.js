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

function redirectToLogin() {
    window.location.href = "/codification/login.html"; 
}

auth.onAuthStateChanged(user => {
    if (user) {
        db.collection('users').doc(user.uid).get().then(doc => {
            if (doc.exists && doc.data().role === 'admin') {
                if (adminUserEmail) adminUserEmail.textContent = user.email;
                setupEventListeners();
                loadAdminProducts();

            } else {
                alert("Acesso negado. Você não é um administrador.");
                redirectToLogin();
            }
        });
    } else {
        redirectToLogin();
    }
});

if (adminLogoutBtn) {
    adminLogoutBtn.addEventListener('click', () => {
        auth.signOut().then(() => redirectToLogin());
    });
}

function setupEventListeners() {
    if (productForm) {
        productForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const name = document.getElementById('product-name').value;
            const price = parseFloat(document.getElementById('product-price').value);
            const stock = parseInt(document.getElementById('product-stock').value);
            const imageFile = document.getElementById('product-image').files[0];

            const saveProductData = (imageUrl) => {
                db.collection('products').add({
                    name: name,
                    price: price,
                    stock: stock,
                    imageUrl: imageUrl, 
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                }).then(() => {
                    alert("Produto salvo com sucesso!");
                    productForm.reset();
                    if (uploadProgress) uploadProgress.style.display = 'none';
                }).catch(error => {
                    console.error("Erro ao salvar produto no Firestore:", error);
                    alert("Erro ao salvar produto.");
                });
            };

            if (imageFile) {
                const storageRef = storage.ref(`product-images/${Date.now()}_${imageFile.name}`);
                const uploadTask = storageRef.put(imageFile);

                uploadTask.on('state_changed', (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    uploadProgress.style.display = 'block';
                    uploadProgress.textContent = `Enviando imagem... ${Math.round(progress)}%`;
                }, 
                (error) => {
                    console.error("Erro no upload da imagem:", error);
                    alert("Erro ao enviar imagem.");
                }, 
                () => {
                    uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
                        saveProductData(downloadURL);
                    });
                });
            } else {
                console.log("Nenhuma imagem selecionada. Usando placeholder.");
                const placeholderImageUrl = "https://via.placeholder.com/300x300.png?text=Sem+Imagem";
                saveProductData(placeholderImageUrl);
            }
        });
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
                <span class="product-list-item-name">${product.name}</span>
                <button class="btn-delete" data-id="${doc.id}">Deletar</button>
            `;
            adminProductList.appendChild(productItem);
        });
    });
    adminProductList.addEventListener('click', (e) => {
        if (e.target && e.target.classList.contains('btn-delete')) {
            const id = e.target.dataset.id;
            if (confirm("Tem certeza que deseja deletar este produto?")) {
                db.collection('products').doc(id).delete()
                  .then(() => alert("Produto deletado!"))
                  .catch(error => console.error("Erro ao deletar:", error));
            }
        }
    });
}