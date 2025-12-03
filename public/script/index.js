document.addEventListener('DOMContentLoaded', () => {

  const imageSlides = document.querySelector('.carousel-slides');
  const images = document.querySelectorAll('.carousel-slides img');
  const prevImgBtn = document.querySelector('.carousel-container .prev');
  const nextImgBtn = document.querySelector('.carousel-container .next');

  let currentIndex = 0;
  const totalImages = images.length;

  function updateCarousel() {
    const offset = -currentIndex * 100;
    if (imageSlides) imageSlides.style.transform = `translateX(${offset}%)`;

    const currentImage = images[currentIndex];
    const bgColor = currentImage?.getAttribute('data-bg');
    if (bgColor) document.body.style.backgroundColor = bgColor;
  }

  if (imageSlides && totalImages > 0 && nextImgBtn && prevImgBtn) {
    nextImgBtn.addEventListener('click', () => {
      currentIndex = (currentIndex + 1) % totalImages;
      updateCarousel();
    });

    prevImgBtn.addEventListener('click', () => {
      currentIndex = (currentIndex - 1 + totalImages) % totalImages;
      updateCarousel();
    });

    setInterval(() => nextImgBtn.click(), 6000);
    updateCarousel();
  }

  if (typeof firebase === "undefined" || !firebase.apps.length) {
    console.error("Erro: Scripts do Firebase não carregados no HTML.");
    return;
  }

  const db = firebase.firestore();
  const productGrid = document.getElementById('product-grid');
  const prevProductBtn = document.getElementById('scroll-prev-btn');
  const nextProductBtn = document.getElementById('scroll-next-btn');

  function fetchFeaturedProducts() {
    db.collection('products')
      .orderBy('createdAt', 'desc')
      .limit(10)
      .onSnapshot(snapshot => {
          renderProducts(snapshot.docs);
      }, error => {
        console.error("Erro ao buscar destaques:", error);
        if (productGrid) {
          productGrid.innerHTML = `<p style="color:red; text-align:center;">Erro ao carregar ofertas.</p>`;
        }
      });
  }

  function renderProducts(docs) {
    if (!productGrid) return;

    if (!docs.length) {
      productGrid.innerHTML = '<p>Nenhum produto em destaque.</p>';
      return;
    }

    let cardsHTML = '';

    docs.forEach(doc => {
      const product = doc.data();
      const productId = doc.id;

      const imgUrl = product.imageUrl1 || product.imageUrl || "https://via.placeholder.com/300x300.png?text=Sem+Imagem";
      const formattedPrice = product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      const installmentPrice = (product.price / 12).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      
      const estoque = product.stock || 0;
      let botoesHTML = '';

      if (estoque > 0) {
          botoesHTML = `
            <button class="btn btn-add-cart" onclick="window.tentarAdicionarAoCarrinho('${productId}')">ADICIONAR AO CARRINHO</button>
            <button class="btn btn-buy" onclick="window.comprarProduto('${productId}')">COMPRAR</button>
          `;
      } else {
          botoesHTML = `
            <button class="btn" disabled style="background-color: #ccc; color: #555; cursor: not-allowed; width: 100%; border: 1px solid #999;">PRODUTO ESGOTADO</button>
          `;
      }

      cardsHTML += `
      <div class="product-card">
          <img src="${imgUrl}" alt="${product.name}">
          <h3 class="product-name">${product.name}</h3>
          <p class="product-price-new">${formattedPrice}</p>
          <p class="product-installments">12x de ${installmentPrice} sem juros</p>
          <div class="product-buttons">
             ${botoesHTML}
          </div>
      </div>
      `;
    });

    productGrid.innerHTML = cardsHTML;
  }

  window.tentarAdicionarAoCarrinho = function(productId) {
    const user = firebase.auth().currentUser;

    if (!user) {
        alert("Você precisa fazer login para adicionar itens ao carrinho!");
        window.location.href = "login.html";
        return;
    }

    if (typeof window.adicionarAoCarrinho === 'function') {
        window.adicionarAoCarrinho(productId);
    }
  }

  window.comprarProduto = function (produtoId) {
    const user = firebase.auth().currentUser;

    if (!user) {
        alert("Faça login para continuar a compra!");
        localStorage.setItem('produtoSelecionado', produtoId);
        window.location.href = 'login.html';
        return;
    }

    localStorage.setItem('produtoSelecionado', produtoId);
    window.location.href = 'comprar.html';
  }

  if (nextProductBtn && prevProductBtn && productGrid) {
    nextProductBtn.addEventListener('click', () => {
      const card = productGrid.querySelector('.product-card');
      if (!card) return;
      productGrid.scrollBy({ left: card.offsetWidth + 45, behavior: 'smooth' });
    });

    prevProductBtn.addEventListener('click', () => {
      const card = productGrid.querySelector('.product-card');
      if (!card) return;
      productGrid.scrollBy({ left: -(card.offsetWidth + 45), behavior: 'smooth' });
    });
  }

  fetchFeaturedProducts();
});