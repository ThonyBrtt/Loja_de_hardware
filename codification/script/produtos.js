// ==========================================================
// CONFIGURAÇÃO E INICIALIZAÇÃO
// ==========================================================
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

// ==========================================================
// ELEMENTOS E DADOS DA PÁGINA
// ==========================================================
const productGrid = document.getElementById('product-grid');
const filterSelect = document.getElementById('filterSelect');
const pageIdentifier = document.body.dataset.category; 
let currentQuery = null; // Guarda a função de cancelamento do listener atual

// ==========================================================
// FUNÇÃO DE RENDERIZAÇÃO DE PRODUTOS
// ==========================================================

function renderProducts(docs) {
    if (!docs.length) {
        productGrid.innerHTML = '<p class="empty-category-message">Nenhum produto encontrado nesta categoria.</p>';
        return;
    }

    productGrid.innerHTML = ''; // Limpa o grid para evitar duplicação
    docs.forEach(doc => {
        const product = doc.data();
        
        // Formatação de dados para exibição
        const imageUrl = product.imageUrl || "https://via.placeholder.com/300x300.png?text=Sem+Imagem";
        const formattedPrice = product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const installmentPrice = (product.price / 12).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        // Cria o HTML do card do produto
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

// ==========================================================
// FUNÇÃO PRINCIPAL DE FILTRAGEM E ORDENAÇÃO
// ==========================================================

function aplicarFiltro(tipoFiltro) {
  if (!pageIdentifier) return; // Aborta se a categoria da página não for definida

  // Constrói a consulta base (filtra por categoria ou oferta)
  let query = db.collection('products');
  if (pageIdentifier === 'ofertas') {
    query = query.where('isOnOffer', '==', true);
  } else {
    query = query.where('category', '==', pageIdentifier);
  }

  // Cancela o listener anterior para evitar múltiplas execuções
  if (currentQuery) currentQuery();

  // Cria um novo listener em tempo real e armazena sua função de cancelamento
  currentQuery = query.onSnapshot(snapshot => {
    // Converte os documentos para um array JavaScript
    let produtos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Ordena o array de produtos no navegador (client-side)
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
      default: // 'recentes'
        produtos.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        break;
    }

    // Re-empacota os dados para o formato esperado e renderiza na tela
    renderProducts(produtos.map(p => ({ data: () => p })));
  }, error => {
    console.error("Erro ao aplicar filtro:", error);
    productGrid.innerHTML = `<p class="error-message">Erro ao aplicar filtro. Veja o console.</p>`;
  });
}

// ==========================================================
// EVENT LISTENERS E EXECUÇÃO INICIAL
// ==========================================================

// Quando o usuário muda a opção de filtro, a função é chamada novamente
if (filterSelect) {
  filterSelect.addEventListener('change', e => aplicarFiltro(e.target.value));
}

// Carrega os produtos com a ordenação padrão ('recentes') ao abrir a página
aplicarFiltro('recentes');