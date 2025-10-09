const firebase = require('firebase/compat/app');
require('firebase/compat/firestore');

// ================================
// CONFIGURAÇÃO FIREBASE
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
// VARIÁVEIS GERAIS
// ================================
let currentQuery = null;

// ================================
// FUNÇÕES
// ================================

// A função agora recebe um array de objetos de produto simples
function renderProducts(products) {
  const productGrid = document.getElementById('product-grid');
  if (!productGrid) return;

  if (!products.length) {
    productGrid.innerHTML = '<p class="empty-category-message">Nenhum produto encontrado nesta categoria.</p>';
    return;
  }
  productGrid.innerHTML = '';

  products.forEach(product => {
    const productId = product.id;
    const images = [product.imageUrl1, product.imageUrl2, product.imageUrl3].filter(Boolean);
    const formattedPrice = product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const installmentPrice = (product.price / 12).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const carouselImages = images.map((img, i) =>
      `<img src="${img}" class="carousel-img ${i === 0 ? 'active' : ''}" alt="${product.name}">`
    ).join('');

    const cardHTML = `
      <div class="product-card">
        <div class="carousel-container" data-current="0">
          ${carouselImages}
          ${images.length > 1 ? `
            <button class="carousel-btn left">❮</button>
            <button class="carousel-btn right">❯</button>
          ` : ''}
        </div>
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

  initCarousels();
  addButtonEvents();
}

function initCarousels() {
  document.querySelectorAll('.carousel-container').forEach(container => {
    const imgs = container.querySelectorAll('.carousel-img');
    const left = container.querySelector('.carousel-btn.left');
    const right = container.querySelector('.carousel-btn.right');
    if (!imgs.length) return;
    let current = 0;
    function showImage(index) {
      imgs.forEach((img, i) => img.classList.toggle('active', i === index));
      container.dataset.current = index;
    }
    left?.addEventListener('click', () => {
      current = (current - 1 + imgs.length) % imgs.length;
      showImage(current);
    });
    right?.addEventListener('click', () => {
      current = (current + 1) % imgs.length;
      showImage(current);
    });
  });
}

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
      // Lógica para adicionar ao carrinho (se houver)
    });
  });
}

function comprarProduto(produtoId) {
  localStorage.setItem('produtoSelecionado', produtoId);
  window.location.href = 'comprar.html';
}

function aplicarFiltro(db, tipoFiltro) {
  const pageIdentifier = document.body.dataset.category;
  const productGrid = document.getElementById('product-grid');
  if (!pageIdentifier) return;

  let query = db.collection('products');

  if (pageIdentifier === 'ofertas') {
    query = query.where('isOnOffer', '==', true);
  } else {
    query = query.where('category', '==', pageIdentifier);
  }

  if (currentQuery) currentQuery();

  currentQuery = query.onSnapshot(snapshot => {
    let produtos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    switch (tipoFiltro) {
      case 'precoMenor': produtos.sort((a, b) => a.price - b.price); break;
      case 'precoMaior': produtos.sort((a, b) => b.price - a.price); break;
      case 'alfabetico': produtos.sort((a, b) => a.name.localeCompare(b.name)); break;
      default: produtos.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds); break;
    }
    // Passa o array de produtos simples diretamente para a função de renderização
    renderProducts(produtos);
  }, error => {
    console.error("Erro ao aplicar filtro:", error);
    if(productGrid) {
        productGrid.innerHTML = `<p class="error-message">Erro ao aplicar filtro. Veja o console.</p>`;
    }
  });
}

function finalizarCompra(db) {
  const produtoId = localStorage.getItem('produtoSelecionado');
  if (!produtoId) return alert("Nenhum produto selecionado!");

  const quantidade = parseInt(document.getElementById('quantidade').value);
  const pagamento = document.getElementById('pagamento').value;
  const produtoRef = db.collection('products').doc(produtoId);

  return produtoRef.get().then(doc => {
    if (!doc.exists) return alert("Produto não encontrado.");
    const estoqueAtual = doc.data().stock || 0;
    if (quantidade > estoqueAtual) return alert("Quantidade maior que o estoque!");
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

function inicializarPaginaDeProdutos() {
  const filterSelect = document.getElementById('filterSelect');
  if (!filterSelect) {
    console.error("Elemento do filtro #filterSelect não encontrado!");
    return;
  }

  filterSelect.addEventListener('change', e => aplicarFiltro(db, e.target.value));
  aplicarFiltro(db, 'recentes');
}

module.exports = {
  renderProducts,
  aplicarFiltro,
  finalizarCompra,
  inicializarPaginaDeProdutos,
  comprarProduto, 
  initCarousels, 
  addButtonEvents
};