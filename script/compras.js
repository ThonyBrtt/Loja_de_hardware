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
const carrinho = JSON.parse(localStorage.getItem('carrinho') || '[]');
const container = document.getElementById('detalhesProduto');


if (produtoId && carrinho.length === 0) {
  db.collection('products').doc(produtoId).get().then(doc => {
    if (!doc.exists) {
      container.innerHTML = '<p>Produto não encontrado.</p>';
      return;
    }

    const produto = doc.data();
    const estoque = produto.stock || 0;
    const formattedPrice = produto.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    container.innerHTML = `
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
          <button id="cancelarCompra" style="background-color: #cccccc; color: #333; border: none; padding: 14px 30px; border-radius: 8px; font-weight: bold; cursor: pointer;">Cancelar Compra</button>
        </div>
      </div>
    `;

    const quantidadeInput = document.getElementById('quantidade');
    const totalPriceEl = document.getElementById('totalPrice');

    function atualizarTotal() {
      const qnt = parseInt(quantidadeInput.value) || 1;
      const total = produto.price * qnt;
      totalPriceEl.textContent = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    quantidadeInput.addEventListener('input', atualizarTotal);
    atualizarTotal();


    document.getElementById('cancelarCompra').addEventListener('click', () => {
      if (confirm("Deseja realmente cancelar a compra?")) {
        localStorage.removeItem('produtoSelecionado');
        window.location.href = '../codification/index.html';
      }
    });


    document.getElementById('finalizarCompra').addEventListener('click', async () => {
      const qnt = parseInt(quantidadeInput.value);
      if (!qnt || qnt < 1) return alert("Selecione uma quantidade válida.");

      const btn = document.getElementById('finalizarCompra');
      btn.disabled = true;
      btn.textContent = "Processando...";

      const produtoRef = db.collection('products').doc(produtoId);
      try {
        await db.runTransaction(async (t) => {
          const docSnap = await t.get(produtoRef);
          if (!docSnap.exists) throw "Produto não encontrado!";
          const est = docSnap.data().stock || 0;
          if (qnt > est) throw "Estoque insuficiente!";
          t.update(produtoRef, { stock: est - qnt });
        });

        alert(`Compra finalizada!\n${qnt} unidade(s) de ${produto.name}.`);
        localStorage.removeItem('produtoSelecionado');
        window.location.href = '../codification/index.html';
      } catch (e) {
        alert(e === "Estoque insuficiente!" ? e : "Erro ao finalizar compra.");
      } finally {
        btn.disabled = false;
        btn.textContent = "Finalizar Compra";
      }
    });
  });
}


else if (carrinho.length > 0) {
  let totalGeral = 0;

  const promises = carrinho.map(async item => {
    const doc = await db.collection('products').doc(item.id).get();
    if (!doc.exists) return null;

    const p = doc.data();
    const totalItem = p.price * item.qnt;
    totalGeral += totalItem;

    return `
      <div class="produto-card-carrinho">
        <img src="${p.imageUrl1}" alt="${p.name}">
        <div>
          <h3>${p.name}</h3>
          <p>Qtd: ${item.qnt}</p>
          <p>Preço: ${(p.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
          <p><strong>Total: ${totalItem.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></p>
        </div>
      </div>
    `;
  });

  Promise.all(promises).then(produtosHTML => {
    const listaProdutos = produtosHTML.filter(Boolean).join('');
    container.innerHTML = `
      <div class="carrinho-container">
        <h2>Resumo do Carrinho</h2>
        <div class="lista-carrinho">${listaProdutos}</div>

        <p class="total-geral">Valor total: <strong>${totalGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></p>

        <div class="botoes-compra">
          <button id="finalizarCarrinho">Finalizar Compra</button>
          <button id="cancelarCarrinho" style="background-color: #ccc; color: #333;">Cancelar</button>
        </div>
      </div>
    `;


    const lista = document.querySelector('.lista-carrinho');
    lista.style.maxHeight = "400px";
    lista.style.overflowY = "auto";


    document.getElementById('cancelarCarrinho').addEventListener('click', () => {
      if (confirm("Deseja cancelar o carrinho?")) {
        localStorage.removeItem('carrinho');
        window.location.href = '../codification/index.html';
      }
    });


    document.getElementById('finalizarCarrinho').addEventListener('click', async () => {
      const btn = document.getElementById('finalizarCarrinho');
      btn.disabled = true;
      btn.textContent = "Processando...";

      try {
        for (const item of carrinho) {
          const ref = db.collection('products').doc(item.id);
          await db.runTransaction(async (t) => {
            const snap = await t.get(ref);
            if (!snap.exists) throw `Produto ${item.id} não encontrado!`;
            const estoque = snap.data().stock || 0;
            if (item.qnt > estoque) throw `Estoque insuficiente para ${snap.data().name}!`;
            t.update(ref, { stock: estoque - item.qnt });
          });
        }
        alert("Compra do carrinho finalizada com sucesso!");
        localStorage.removeItem('carrinho');
        window.location.href = '../codification/index.html';
      } catch (e) {
        alert(e);
      } finally {
        btn.disabled = false;
        btn.textContent = "Finalizar Compra";
      }
    });
  });
}


else {
  container.innerHTML = '<p>Nenhum produto selecionado.</p>';
}
