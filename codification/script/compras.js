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

document.getElementById('voltar').addEventListener('click', () => window.history.back());

const produtoId = localStorage.getItem('produtoSelecionado');

if (!produtoId) {
  document.getElementById('detalhesProduto').innerHTML = '<p>Nenhum produto selecionado.</p>';
} else {
  db.collection('products').doc(produtoId).get().then(doc => {
    if (!doc.exists) {
      document.getElementById('detalhesProduto').innerHTML = '<p>Produto não encontrado.</p>';
      return;
    }

    const produto = doc.data();
    const estoque = produto.stock || 0;
    const formattedPrice = produto.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    document.getElementById('detalhesProduto').innerHTML = `
      <div class="produto-card-realista">
        <div class="carousel-container">
          <img src="${produto.imageUrl1}" class="carousel-img active" alt="${produto.name}">
          <img src="${produto.imageUrl2}" class="carousel-img" alt="${produto.name}">
          <img src="${produto.imageUrl3}" class="carousel-img" alt="${produto.name}">
          <button class="carousel-btn left">&#10094;</button>
          <button class="carousel-btn right">&#10095;</button>
        </div>

        <h2>${produto.name}</h2>
        <p>Preço unitário: <strong>${formattedPrice}</strong></p>
        <p id="estoque">Estoque disponível: <strong>${estoque}</strong></p>

        <label for="quantidade">Quantidade:</label>
        <input type="number" id="quantidade" min="1" max="${estoque}" value="1">

        

        <label for="pagamento">Método de Pagamento:</label>
        <select id="pagamento">
          <option value="cartao">Cartão de Crédito</option>
          <option value="pix">PIX</option>
        </select>

        <p>Total: <strong id="totalPrice">${formattedPrice}</strong></p>
        <div id="parcelamento-container">
          <label for="parcelas">Parcelamento:</label>
          <select id="parcelas">
            <option value="1">1x de ${formattedPrice}</option>
            <option value="2">2x de ${(produto.price / 2).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</option>
            <option value="3">3x de ${(produto.price / 3).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</option>
            <option value="6">6x de ${(produto.price / 6).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</option>
            <option value="12">12x de ${(produto.price / 12).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</option>
          </select>
        </div>

        <div class="botoes-compra">
          <button id="finalizarCompra">Finalizar Compra</button>
          <button id="cancelarCompra" style="background-color: #cccccc; color: #333; border: none; padding: 14px 30px; border-radius: 8px; font-weight: bold; cursor: pointer;">
            Cancelar Compra
          </button>
        </div>
      </div>
    `;

    // Atualiza total automaticamente
    const quantidadeInput = document.getElementById('quantidade');
    const totalPriceEl = document.getElementById('totalPrice');

    function atualizarTotal() {
      const quantidade = parseInt(quantidadeInput.value) || 1;
      const total = produto.price * quantidade;
      totalPriceEl.textContent = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    quantidadeInput.addEventListener('input', atualizarTotal);
    atualizarTotal();

    // Botão cancelar
    document.getElementById('cancelarCompra').addEventListener('click', () => {
      if (confirm("Deseja realmente cancelar a compra?")) {
        localStorage.removeItem('produtoSelecionado');
        window.location.href = '../codification/index.html';
      }
    });

    document.getElementById('finalizarCompra').addEventListener('click', async () => {
      const quantidadeSelecionada = parseInt(quantidadeInput.value);
      if (!quantidadeSelecionada || quantidadeSelecionada < 1) {
        return alert("Selecione uma quantidade válida.");
      }

      const btn = document.getElementById('finalizarCompra');
      btn.disabled = true;
      btn.textContent = "Processando...";

      const produtoRef = db.collection('products').doc(produtoId);

      try {
        await db.runTransaction(async (transaction) => {
          const docSnap = await transaction.get(produtoRef);
          if (!docSnap.exists) throw "Produto não encontrado!";
          
          const estoqueAtual = docSnap.data().stock || 0;
          if (quantidadeSelecionada > estoqueAtual) throw "Estoque insuficiente!";

          transaction.update(produtoRef, { stock: estoqueAtual - quantidadeSelecionada });
        });

        alert(`Compra finalizada com sucesso!\nQuantidade comprada: ${quantidadeSelecionada}`);
        localStorage.removeItem('produtoSelecionado');
        window.location.href = '../codification/index.html';
      } catch (error) {
        console.error(error);
        alert(error === "Estoque insuficiente!" ? error : "Erro ao finalizar a compra.");
      } finally {
        btn.disabled = false;
        btn.textContent = "Finalizar Compra";
      }
    });

    const imgs = document.querySelectorAll('.carousel-img');
    let currentIndex = 0;
    const prevBtn = document.querySelector('.carousel-btn.left');
    const nextBtn = document.querySelector('.carousel-btn.right');

    function showImage(index) {
      imgs.forEach((img, i) => {
        img.classList.toggle('active', i === index);
      });
    }

    prevBtn.addEventListener('click', () => {
      currentIndex = (currentIndex - 1 + imgs.length) % imgs.length;
      showImage(currentIndex);
    });

    nextBtn.addEventListener('click', () => {
      currentIndex = (currentIndex + 1) % imgs.length;
      showImage(currentIndex);
    });

    const pagamentoSelect = document.getElementById('pagamento');
    const parcelasDiv = document.getElementById('parcelamento-container');
    pagamentoSelect.addEventListener('change', () => {
      parcelasDiv.style.display = pagamentoSelect.value === 'pix' ? 'none' : 'block';
    });

  }).catch(err => {
    console.error(err);
    document.getElementById('detalhesProduto').innerHTML = '<p>Erro ao carregar produto.</p>';
  });
}
