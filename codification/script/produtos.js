// ================================
// 🔥 CONFIGURAÇÃO FIREBASE
// ================================
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

// ================================
// 📦 VARIÁVEIS GERAIS
// ================================
const productGrid = document.getElementById('product-grid');
const pageIdentifier = document.body.dataset.category; 
let currentQuery = null;

// ================================
// 🧩 FUNÇÃO PARA RENDERIZAR PRODUTOS
// ================================
function renderProducts(docs) {
  if (!docs.length) {
    productGrid.innerHTML = '<p class="empty-category-message">Nenhum produto encontrado nesta categoria.</p>';
    return;
  }

  productGrid.innerHTML = '';

  docs.forEach(doc => {
    const product = doc.data();
    const productId = doc.id;
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
          <button class="btn btn-add-cart" data-id="${productId}">ADICIONAR AO CARRINHO</button>
          <button class="btn btn-buy" data-id="${productId}">COMPRAR</button>
        </div>
      </div>
    `;

    productGrid.innerHTML += cardHTML;
  });

  // Adiciona eventos aos botões após renderizar
  addButtonEvents();
}

// ================================
// 🛒 FUNÇÃO DE EVENTOS DOS BOTÕES
// ================================
function addButtonEvents() {
  document.querySelectorAll('.btn-buy').forEach(btn => {
    btn.addEventListener('click', e => {
      const id = e.target.dataset.id;
      comprarProduto(id);
    });
  });

  document.querySelectorAll('.btn-add-cart').forEach(btn => {
    btn.addEventListener('click', e => {
      const id = e.target.dataset.id;
      adicionarAoCarrinho(id);
    });
  });
}

// ================================
// 🛍️ FUNÇÃO DE COMPRAR
// ================================
function comprarProduto(produtoId) {
  localStorage.setItem('produtoSelecionado', produtoId);
  window.location.href = 'comprar.html';
}

// ================================
// 🔍 FILTROS E BUSCA DO FIRESTORE
// ================================
if (!pageIdentifier) {
  console.error("Identificador de página não encontrado! Adicione data-category='...' na tag <body>.");
} else {
  let query = db.collection('products');

  if (pageIdentifier === 'ofertas') {
    query = query.where('isOnOffer', '==', true);
  } else {
    query = query.where('category', '==', pageIdentifier);
  }
  
  query.orderBy('createdAt', 'desc').onSnapshot(snapshot => {
    renderProducts(snapshot.docs);
  }, error => {
    console.error("Erro ao buscar produtos:", error);
    productGrid.innerHTML = `<p class="error-message">Erro ao carregar produtos. Verifique o console (F12) para criar índice no Firestore.</p>`;
  });
}

// ================================
// ⚙️ FILTRO DE PRODUTOS
// ================================
const filterSelect = document.getElementById('filterSelect');

function aplicarFiltro(tipoFiltro) {
  if (!pageIdentifier) return;

  let query = db.collection('products');

  if (pageIdentifier === 'ofertas') {
    query = query.where('isOnOffer', '==', true);
  } else {
    query = query.where('category', '==', pageIdentifier);
  }

  if (currentQuery) currentQuery(); // cancela listener anterior

  currentQuery = query.onSnapshot(snapshot => {
    let produtos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

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
      default:
        produtos.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
        break;
    }

    renderProducts(produtos.map(p => ({ id: p.id, data: () => p })));
  }, error => {
    console.error("Erro ao aplicar filtro:", error);
    productGrid.innerHTML = `<p class="error-message">Erro ao aplicar filtro. Veja o console.</p>`;
  });
}

filterSelect.addEventListener('change', e => aplicarFiltro(e.target.value));
aplicarFiltro('recentes');

// ================================
// 🏦 FUNÇÃO PARA FINALIZAR COMPRA (comprar.html)
// ================================
function finalizarCompra() {
  const produtoId = localStorage.getItem('produtoSelecionado');
  if (!produtoId) return alert("Nenhum produto selecionado!");

  const quantidade = parseInt(document.getElementById('quantidade').value);
  const pagamento = document.getElementById('pagamento').value;

  const produtoRef = db.collection('products').doc(produtoId);

  // Buscar estoque atualizado direto no Firestore
  produtoRef.get().then(doc => {
    if (!doc.exists) return alert("Produto não encontrado.");
    const estoqueAtual = doc.data().stock || 0;

    if (quantidade > estoqueAtual) return alert("Quantidade maior que o estoque!");

    // Atualiza estoque
    return produtoRef.update({ stock: estoqueAtual - quantidade });
  }).then(() => {
    alert(`Compra finalizada com sucesso!\nMétodo: ${pagamento}\nQuantidade: ${quantidade}`);
    localStorage.removeItem('produtoSelecionado');
    window.location.href = '/index.html';
  }).catch(err => {
    console.error(err);
    alert("Erro ao finalizar compra.");
  });
}
