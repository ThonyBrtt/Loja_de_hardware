const firebaseConfig = {
  apiKey: "AIzaSyB_Pd9n5VzXloRQvqusZUIhwZVmJvnKfQc",
  authDomain: "boombum-eaf32.firebaseapp.com",
  projectId: "boombum-eaf32",
  storageBucket: "boombum-eaf32.firebasestorage.app",
  messagingSenderId: "827065363375",
  appId: "1:827065363375:web:913f128e651fcdbe145d5a",
  measurementId: "G-D7CBRK53E0",
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();
const auth = firebase.auth();

const main = document.getElementById("detalhesProduto");
main.innerHTML = "<p style='color: #333; text-align: center; font-size: 18px; margin-top: 50px;'>Carregando seu carrinho...</p>";

async function carregarCarrinho() {
  const user = auth.currentUser;

  if (!user) {
    alert("🔒 Você precisa fazer login para acessar o carrinho!");
    window.location.href = "login.html";
    return;
  }

  try {
    const userRef = db.collection("users").doc(user.uid);
    const userDoc = await userRef.get();
    const cart = userDoc.data()?.cart || [];

    if (cart.length === 0) {
      main.innerHTML = `
        <div style="text-align: center; padding: 50px;">
            <h2 style="color:#333;">Seu carrinho está vazio 🛒</h2>
            <a href="index.html" style="color: #ff6600; font-weight:bold; text-decoration:none;">Voltar as compras</a>
        </div>`;
      return;
    }

    let total = 0;
    let html = `
      <div class="carrinho-container">
        <div class="carrinho-produtos">
    `;

    for (const item of cart) {
      const prodDoc = await db.collection("products").doc(item.produtoId).get();
      if (!prodDoc.exists) continue;

      const produto = prodDoc.data();
      const subtotal = produto.price * item.quantidade;
      total += subtotal;
      const estoque = produto.stock || 0;

      const imgUrl = produto.imageUrl1 || produto.imageUrl || "https://via.placeholder.com/100";

      html += `
        <div class="produto-card" id="card-${item.produtoId}" data-price="${produto.price}" data-stock="${estoque}">
          <img src="${imgUrl}" alt="${produto.name}" class="produto-img" />
          <div class="produto-info">
            <h3>${produto.name}</h3>
            <p>Preço unitário: R$ ${produto.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
            <p style="font-size: 12px; color: #666;">Disponível: ${estoque}</p>
            <div class="quantidade">
              <button onclick="alterarQtd('${item.produtoId}', -1)">−</button>
              <span id="qtd-${item.produtoId}">${item.quantidade}</span>
              <button onclick="alterarQtd('${item.produtoId}', 1)">+</button>
            </div>
            <p>Subtotal: R$ <span id="subtotal-${item.produtoId}">${subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></p>
            <button onclick="removerItem('${item.produtoId}')" class="remover-btn">Remover</button>
          </div>
        </div>
      `;
    }

    html += `
        </div>
        <div class="carrinho-resumo">
          <h3>Resumo da compra</h3>
          <div class="linha"><span>Total:</span> <span id="total-geral">R$ ${total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></div>
          <p class="parcelamento">ou em até 12x no cartão</p>
          <button class="btn-finalizar" id="finalizarCompra">Finalizar Compra</button>
        </div>
      </div>
    `;

    main.innerHTML = html;

    document.getElementById("finalizarCompra").addEventListener("click", finalizarCompra);
  } catch (error) {
    console.error(error);
    main.innerHTML = "<p>Erro ao carregar o carrinho.</p>";
  }
}

async function alterarQtd(produtoId, delta) {
  const user = auth.currentUser;
  if (!user) return;

  const qtdElement = document.getElementById(`qtd-${produtoId}`);
  const cardElement = document.getElementById(`card-${produtoId}`);
  const subtotalElement = document.getElementById(`subtotal-${produtoId}`);
  
  if (!qtdElement || !cardElement) return;

  const estoqueMax = parseInt(cardElement.getAttribute('data-stock')); // Lê o estoque salvo no HTML
  let qtdAtual = parseInt(qtdElement.innerText);
  let novaQtd = qtdAtual + delta;

  if (delta > 0 && novaQtd > estoqueMax) {
    alert(`Ops! Só temos ${estoqueMax} unidades deste produto em estoque.`);
    return; 
  }

  if (novaQtd <= 0) {
    removerItem(produtoId);
    return;
  }

  const precoUnitario = parseFloat(cardElement.getAttribute('data-price'));
  qtdElement.innerText = novaQtd;
  
  const novoSubtotal = novaQtd * precoUnitario;
  subtotalElement.innerText = novoSubtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 });

  recalcularTotalVisual();

  const userRef = db.collection("users").doc(user.uid);
  try {
      const doc = await userRef.get();
      let cart = doc.data()?.cart || [];
      const index = cart.findIndex((i) => i.produtoId === produtoId);
      
      if (index >= 0) {
        cart[index].quantidade = novaQtd;
        await userRef.update({ cart: cart });
      }
  } catch (error) {
      console.error("Erro ao atualizar banco", error);
  }
}

function recalcularTotalVisual() {
    const cards = document.querySelectorAll('.produto-card');
    let novoTotal = 0;

    cards.forEach(card => {
        const preco = parseFloat(card.getAttribute('data-price'));
        const id = card.id.replace('card-', '');
        const qtd = parseInt(document.getElementById(`qtd-${id}`).innerText);
        novoTotal += (preco * qtd);
    });

    const totalElement = document.getElementById('total-geral');
    if(totalElement) {
        totalElement.innerText = "R$ " + novoTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
    }
}

async function removerItem(produtoId) {
  const user = auth.currentUser;
  if (!user) return;

  const card = document.getElementById(`card-${produtoId}`);
  if(card) card.style.opacity = "0.5";

  const userRef = db.collection("users").doc(user.uid);
  const doc = await userRef.get();
  let cart = doc.data()?.cart || [];

  cart = cart.filter((i) => i.produtoId !== produtoId);
  await userRef.update({ cart: cart });
  
  carregarCarrinho();
}

function finalizarCompra() {
  window.location.href = "enderecocomprar.html";
}

auth.onAuthStateChanged((user) => {
  if (user) {
    carregarCarrinho();
  } else {
    window.location.href = "login.html";
  }
});