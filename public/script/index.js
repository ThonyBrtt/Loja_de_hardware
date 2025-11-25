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

    setInterval(() => nextImgBtn.click(), 5000);
    updateCarousel();
  }

  if (typeof firebase === "undefined" || !firebase.apps.length) {
    console.error("⚠️ Firebase não foi inicializado! Verifique se o arquivo sidebar.js é carregado antes deste.");
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
      .get()
      .then(snapshot => renderProducts(snapshot.docs))
      .catch(error => {
        console.error("Erro ao buscar produtos em destaque:", error);
        if (productGrid) {
          productGrid.innerHTML = `<p style="color:red; text-align:center;">Não foi possível carregar os produtos.</p>`;
        }
      });
  }

  function renderProducts(docs) {
    if (!productGrid) return;

    if (!docs.length) {
      productGrid.innerHTML = '<p>Nenhum produto em destaque no momento.</p>';
      return;
    }

    let cardsHTML = '';
    docs.forEach(doc => {
      const product = doc.data();
      const productId = doc.id;
      const imageUrl1 = product.imageUrl1 || "https://via.placeholder.com/300x300.png?text=Sem+Imagem";
      const formattedPrice = product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      const installmentPrice = (product.price / 12).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

      cardsHTML += `
        <div class="product-card">
          <img src="${imageUrl1}" alt="${product.name}">
          <h3 class="product-name">${product.name}</h3>
          <p class="product-price-new">${formattedPrice}</p>
          <p class="product-installments">12x de ${installmentPrice} sem juros</p>
          <div class="product-buttons">
            <button class="btn btn-add-cart" data-id="${productId}">ADICIONAR AO CARRINHO</button>
            <button class="btn btn-buy" data-id="${productId}">COMPRAR</button>
          </div>
        </div>
      `;
    });

    productGrid.innerHTML = cardsHTML;
    addButtonEvents();
  }

  function addButtonEvents() {
    document.querySelectorAll('.btn-buy').forEach(btn => {
      btn.addEventListener('click', e => comprarProduto(e.target.dataset.id));
    });

    document.querySelectorAll('.btn-add-cart').forEach(btn => {
      btn.addEventListener('click', e => {
        const id = e.target.dataset.id;
        if (typeof adicionarAoCarrinho === "function") {
          adicionarAoCarrinho(id);
        } else {
          alert("Erro: função adicionarAoCarrinho não encontrada!");
        }
      });
    });
  }

  function comprarProduto(produtoId) {
    localStorage.setItem('produtoSelecionado', produtoId);
    window.location.href = 'comprar.html';
  }

  if (nextProductBtn && prevProductBtn && productGrid) {
    nextProductBtn.addEventListener('click', () => {
      const card = productGrid.querySelector('.product-card');
      if (!card) return;
      const cardWidth = card.offsetWidth;
      const gap = 25;
      productGrid.scrollBy({ left: cardWidth + gap, behavior: 'smooth' });
    });

    prevProductBtn.addEventListener('click', () => {
      const card = productGrid.querySelector('.product-card');
      if (!card) return;
      const cardWidth = card.offsetWidth;
      const gap = 25;
      productGrid.scrollBy({ left: -(cardWidth + gap), behavior: 'smooth' });
    });
  }

  fetchFeaturedProducts();
});
