const productGrid = document.getElementById('product-grid');
const pageIdentifier = document.body.dataset.category; 
const filterSelect = document.getElementById('filterSelect'); 
let currentQuery = null;
let todosProdutos = []; 

function renderProducts(docs) {
  if (!docs || !docs.length) {
    productGrid.innerHTML = '<p class="empty-category-message" style="text-align:center; padding:50px;">Nenhum produto encontrado.</p>';
    return;
  }

  productGrid.innerHTML = '';

  docs.forEach(doc => {
    const product = typeof doc.data === 'function' ? doc.data() : doc; 
    const productId = doc.id;

    const images = [
      product.imageUrl1, product.imageUrl2, product.imageUrl3, product.imageUrl
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

function aplicarFiltros() {
    if (!todosProdutos.length) return;

    const filtro = filterSelect ? filterSelect.value : 'recentes';
    let produtosOrdenados = [...todosProdutos]; 

    produtosOrdenados.sort((a, b) => {
        const dataA = typeof a.data === 'function' ? a.data() : a;
        const dataB = typeof b.data === 'function' ? b.data() : b;

        switch (filtro) {
            case 'precoMenor':
                return dataA.price - dataB.price;
            case 'precoMaior':
                return dataB.price - dataA.price;
            case 'alfabetico':
                return dataA.name.localeCompare(dataB.name);
            case 'recentes':
            default:
                const timeA = dataA.createdAt ? (dataA.createdAt.seconds || 0) : 0;
                const timeB = dataB.createdAt ? (dataB.createdAt.seconds || 0) : 0;
                return timeB - timeA;
        }
    });

    renderProducts(produtosOrdenados);
}

if (filterSelect) {
    filterSelect.addEventListener('change', aplicarFiltros);
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
    left?.addEventListener('click', (e) => { e.stopPropagation(); current = (current - 1 + imgs.length) % imgs.length; showImage(current); });
    right?.addEventListener('click', (e) => { e.stopPropagation(); current = (current + 1) % imgs.length; showImage(current); });
  });
}

function addButtonEvents() {
  document.querySelectorAll('.btn-buy').forEach(btn => {
    btn.addEventListener('click', e => {
      const id = e.target.dataset.id;
      const user = firebase.auth().currentUser;
      
      if (!user) {
        alert("Faça login para continuar a compra!");
        localStorage.setItem('redirectAfterLogin', 'comprar.html'); 
        localStorage.setItem('produtoSelecionado', id);
        window.location.href = 'login.html';
        return;
      }
      
      localStorage.setItem('produtoSelecionado', id);
      window.location.href = 'comprar.html';
    });
  });

  document.querySelectorAll('.btn-add-cart').forEach(btn => btn.addEventListener('click', e => e.stopPropagation()));
}

document.addEventListener('DOMContentLoaded', () => {
    if (!pageIdentifier) {
      return; 
    }

    if (pageIdentifier === 'search') {
        const urlParams = new URLSearchParams(window.location.search);
        const searchTerm = urlParams.get('q') ? urlParams.get('q').toLowerCase() : '';
        
        const titulo = document.getElementById('search-title');
        if(titulo) titulo.innerText = searchTerm ? `Resultados para: "${searchTerm}"` : "Todos os Produtos";

        db.collection('products').get().then(snapshot => {
            const rawDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            const filtrados = rawDocs.filter(p => 
                p.name.toLowerCase().includes(searchTerm)
            );

            todosProdutos = filtrados;
            
            aplicarFiltros(); 

        }).catch(err => console.error("Erro busca:", err));

        return; 
    }

    let query = db.collection('products');

    if (pageIdentifier === 'ofertas') {
        query = query.where('isOnOffer', '==', true);
    } else if (pageIdentifier !== 'all') {
        query = query.where('category', '==', pageIdentifier);
    }

    query.onSnapshot(snapshot => {
        todosProdutos = snapshot.docs;
        
        aplicarFiltros();
    }, error => {
        console.error("Erro ao buscar produtos:", error);
        productGrid.innerHTML = `<p class="error-message">Erro ao carregar produtos.</p>`;
    });
});