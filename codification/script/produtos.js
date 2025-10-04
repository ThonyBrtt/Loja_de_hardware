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
const db = firebase.firestore();

const productGrid = document.getElementById('product-grid');

function renderProducts(docs) {
    productGrid.innerHTML = ''; 
    docs.forEach(doc => {
        const product = doc.data();
        const formattedPrice = product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const installmentPrice = (product.price / 12).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        const cardHTML = `
            <div class="product-card">
                <img src="${product.imageUrl}" alt="${product.name}">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-price-old"></p> <p class="product-price-new">${formattedPrice}</p>
                <p class="product-installments">12x de ${installmentPrice} sem juros</p>
                <div class="product-buttons">
                    <button class="btn btn-add-cart">ADICIONAR AO CARRINHO</button>
                    <button class="btn btn-buy">COMPRAR</button>
                </div>
            </div>
        `;
        productGrid.innerHTML += cardHTML;
    });
}

db.collection('products').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
    console.log("Dados do Firestore atualizados!");
    renderProducts(snapshot.docs);
}, error => {
    console.error("Erro ao buscar produtos:", error);
    productGrid.innerHTML = 'Erro ao carregar produtos. Tente novamente mais tarde.';
});