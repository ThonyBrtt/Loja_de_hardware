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
const pageIdentifier = document.body.dataset.category; 
function renderProducts(docs) {
    if (!docs.length) {
        productGrid.innerHTML = '<p class="empty-category-message">Nenhum produto encontrado nesta categoria.</p>';
        return;
    }
    productGrid.innerHTML = '';
    docs.forEach(doc => {
        const product = doc.data();
        const imageUrl = product.imageUrl || "https://via.placeholder.com/300x300.png?text=Sem+Imagem";
        const formattedPrice = product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const installmentPrice = (product.price / 12).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        const cardHTML = `
            <div class="product-card">
                <img src="${imageUrl}" alt="${product.name}">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-price-new">${formattedPrice}</p>
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

if (!pageIdentifier) {
    console.error("Identificador de página não encontrado! Adicione data-category='...' na tag <body>.");
} else {
    let query = db.collection('products');

    if (pageIdentifier === 'ofertas') {
        console.log("Filtrando por produtos em oferta...");
        query = query.where('isOnOffer', '==', true);
    } else {
        console.log(`Filtrando por categoria: ${pageIdentifier}`);
        query = query.where('category', '==', pageIdentifier);
    }
    
    query.orderBy('createdAt', 'desc').onSnapshot(snapshot => {
        renderProducts(snapshot.docs);
    }, error => {
        console.error("Erro ao buscar produtos:", error);
        productGrid.innerHTML = `<p class="error-message">Erro ao carregar produtos. Verifique o console (F12) para um link de criação de índice no Firestore.</p>`;
    });
}

const filterSelect = document.getElementById('filterSelect');
let currentQuery = null;

function aplicarFiltro(tipoFiltro) {
  if (!pageIdentifier) return;

  let query = db.collection('products');

  // Base do filtro: categoria ou ofertas
  if (pageIdentifier === 'ofertas') {
    query = query.where('isOnOffer', '==', true);
  } else {
    query = query.where('category', '==', pageIdentifier);
  }

  // Mantém o listener principal
  if (currentQuery) currentQuery();

  currentQuery = query.onSnapshot(snapshot => {
    let produtos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Aplica a ordenação local (sem precisar de índice)
    switch (tipoFiltro) {
      case 'precoMenor':
        produtos.sort((a, b) => a.price - b.price);
        break;
      case 'precoMaior':
        produtos.sort((a, b) => b.price - a.price);
        break;
      case 'alfabetico':
        produtos.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'ofertas':
        produtos = produtos.filter(p => p.isOnOffer === true);
        break;
      default:
        produtos.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
        break;
    }

    renderProducts(produtos.map(p => ({ data: () => p })));
  }, error => {
    console.error("Erro ao aplicar filtro:", error);
    productGrid.innerHTML = `<p class="error-message">Erro ao aplicar filtro. Veja o console.</p>`;
  });
}

filterSelect.addEventListener('change', e => aplicarFiltro(e.target.value));
aplicarFiltro('recentes');
