const productGrid = document.getElementById('product-grid');

const pageIdentifier = document.body.dataset.category; 
let currentQuery = null;

function renderProducts(docs) {
  if (!docs.length) {
    productGrid.innerHTML = '<p class="empty-category-message">Nenhum produto encontrado nesta categoria.</p>';
    return;
  }

  productGrid.innerHTML = '';

  docs.forEach(doc => {
    const product = typeof doc.data === 'function' ? doc.data() : doc; 
    const productId = doc.id;

    const images = [
      product.imageUrl1,
      product.imageUrl2,
      product.imageUrl3,
      product.imageUrl 
    ].filter(Boolean); 

    if (images.length === 0) images.push('https://via.placeholder.com/250?text=Sem+Imagem');

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
        <div class="prices">
            <p class="product-price-new">${formattedPrice}</p>
            <p class="product-installments">12x de ${installmentPrice} sem juros</p>
        </div>
        <div class="product-buttons">
          <button class="btn btn-add-cart" onclick="window.adicionarAoCarrinho('${productId}')">ADICIONAR AO CARRINHO</button>
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

    left?.addEventListener('click', (e) => {
        e.stopPropagation();
        current = (current - 1 + imgs.length) % imgs.length;
        showImage(current);
    });

    right?.addEventListener('click', (e) => {
        e.stopPropagation();
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
      e.stopPropagation();
    });
  });
}

function comprarProduto(produtoId) {
  localStorage.setItem('produtoSelecionado', produtoId);
  window.location.href = 'comprar.html';
}

if (!pageIdentifier) {
  console.error("⚠️ Identificador de página não encontrado! Adicione data-category='...' na tag <body>.");
} else {
  let query = db.collection('products');

  if (pageIdentifier === 'ofertas') {
    query = query.where('isOnOffer', '==', true);
  } else if (pageIdentifier !== 'all') {
    query = query.where('category', '==', pageIdentifier);
  }

  query.onSnapshot(snapshot => {
    renderProducts(snapshot.docs);
  }, error => {
    console.error("Erro ao buscar produtos:", error);
    if(error.code === 'failed-precondition') {
        productGrid.innerHTML = `<p class="error-message">Erro de índice no Firestore. Abra o console (F12) e clique no link gerado pelo Firebase.</p>`;
    } else {
        productGrid.innerHTML = `<p class="error-message">Erro ao carregar produtos.</p>`;
    }
  });
}

const filterSelect = document.getElementById('filterSelect');

function aplicarFiltro(tipoFiltro) {
  if (!pageIdentifier) return;

  let query = db.collection('products');

  if (pageIdentifier === 'ofertas') {
    query = query.where('isOnOffer', '==', true);
  } else if (pageIdentifier !== 'all') {
    query = query.where('category', '==', pageIdentifier);
  }

  if (currentQuery) currentQuery(); 

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
      case 'recentes':
      default:
        produtos.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        break;
    }

    const docsAdaptados = produtos.map(p => ({
        id: p.id,
        data: () => p 
    }));

    renderProducts(docsAdaptados);
  }, error => {
    console.error("Erro ao aplicar filtro:", error);
  });
}

if(filterSelect) {
    filterSelect.addEventListener('change', e => aplicarFiltro(e.target.value));
}