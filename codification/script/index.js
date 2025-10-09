document.addEventListener('DOMContentLoaded', () => {

    const imageSlides = document.querySelector('.carousel-slides');
    const images = document.querySelectorAll('.carousel-slides img');
    const prevImgBtn = document.querySelector('.carousel-container .prev');
    const nextImgBtn = document.querySelector('.carousel-container .next');
    
    let currentIndex = 0;
    const totalImages = images.length;

    function updateCarousel() {
        const offset = -currentIndex * 100;
        imageSlides.style.transform = `translateX(${offset}%)`;

        const currentImage = images[currentIndex];
        const bgColor = currentImage.getAttribute('data-bg');
        if (bgColor) {
            document.body.style.backgroundColor = bgColor;
        }
    }

    if (imageSlides && images.length > 0) {
        nextImgBtn.addEventListener('click', () => {
            currentIndex = (currentIndex + 1) % totalImages;
            updateCarousel();
        });

        prevImgBtn.addEventListener('click', () => {
            currentIndex = (currentIndex - 1 + totalImages) % totalImages;
            updateCarousel();
        });

        setInterval(() => {
            nextImgBtn.click();
        }, 5000);

        updateCarousel(); 
    }



    const productGrid = document.getElementById('product-grid');
    const prevProductBtn = document.getElementById('scroll-prev-btn');
    const nextProductBtn = document.getElementById('scroll-next-btn');
    
 
    const firebaseConfig = {
      apiKey: "AIzaSyB_Pd9n5VzXloRQvqusZUIhwZVmJvnKfQc",
      authDomain: "boombum-eaf32.firebaseapp.com",
      projectId: "boombum-eaf32",
      storageBucket: "boombum-eaf32.appspot.com",
      messagingSenderId: "827065363375",
      appId: "1:827065363375:web:913f128e651fcdbe145d5a",
      measurementId: "G-D7CBRK53E0"
    };


    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    const db = firebase.firestore();


    function fetchFeaturedProducts() {

        db.collection('products')
          .orderBy('createdAt', 'desc')
          .limit(10) 
          .get()
          .then(snapshot => {
              renderProducts(snapshot.docs);
          })
          .catch(error => {
              console.error("Erro ao buscar produtos em destaque:", error);
              productGrid.innerHTML = `<p style="color:red; text-align:center;">Não foi possível carregar os produtos.</p>`;
          });
    }

  
    function renderProducts(docs) {
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
                adicionarAoCarrinho(id);
                alert('Produto adicionado ao carrinho! (Funcionalidade de exemplo)');
            });
        });
    }

    function comprarProduto(produtoId) {
        localStorage.setItem('produtoSelecionado', produtoId);
        window.location.href = 'comprar.html';
    }

    function adicionarAoCarrinho(produtoId) {
        console.log(`Produto ${produtoId} adicionado ao carrinho.`);
    }

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

   
    fetchFeaturedProducts();
});