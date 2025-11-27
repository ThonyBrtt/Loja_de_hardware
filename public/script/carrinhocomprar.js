
const firebaseConfig = {
  apiKey: "AIzaSyB_Pd9n5VzXloRQvqusZUIhwZVmJvnKfQc",
  authDomain: "boombum-eaf32.firebaseapp.com",
  projectId: "boombum-eaf32",
  storageBucket: "boombum-eaf32.firebasestorage.app",
  messagingSenderId: "827065363375",
  appId: "1:827065363375:web:913f128e651fcdbe145d5a",
  measurementId: "G-D7CBRK53E0",
};


firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();


const main = document.getElementById("detalhesProduto");
main.innerHTML = "<p style='color: #333; text-align: center; font-size: 18px; margin-top: 50px;'>Carregando seu carrinho...</p>";


async function carregarCarrinho() {
  const user = auth.currentUser;

  if (!user) {
    main.innerHTML = "<p style='color: #333; text-align: center; font-size: 18px; margin-top: 50px;'>Seu carrinho está vazio.</p>";
    return;
  }

  try {
    const userRef = db.collection("users").doc(user.uid);
    const userDoc = await userRef.get();
    const cart = userDoc.data()?.cart || [];

    if (cart.length === 0) {
      
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
main.innerHTML = "<p>Seu carrinho está vazio.</p>";      total += subtotal;

      html += `
        <div class="produto-card">
          <img src="${produto.imageUrl1}" alt="${produto.name}" class="produto-img" />
          <div class="produto-info">
            <h3>${produto.name}</h3>
            <p>Preço unitário: R$ ${produto.price.toLocaleString("pt-BR")}</p>
            <div class="quantidade">
              <button onclick="alterarQtd('${item.produtoId}', -1)">−</button>
              <span>${item.quantidade}</span>
              <button onclick="alterarQtd('${item.produtoId}', 1)">+</button>
            </div>
            <p>Subtotal: R$ ${subtotal.toLocaleString("pt-BR")}</p>
            <button onclick="removerItem('${item.produtoId}')" class="remover-btn">Remover</button>
          </div>
        </div>
      `;
    }

    const totalPix = total * 0.95; 

    html += `
        </div>
        <div class="carrinho-resumo">
          <h3>Resumo da compra</h3>
          <div class="linha"><span>Subtotal:</span> <span>R$ ${total.toLocaleString("pt-BR")}</span></div>
          <div class="total">Total: R$ ${total.toLocaleString("pt-BR")}</div>
          <p class="parcelamento">ou em até 10x sem juros</p>
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

  const userRef = db.collection("users").doc(user.uid);
  const doc = await userRef.get();
  let cart = doc.data()?.cart || [];

  const index = cart.findIndex((i) => i.produtoId === produtoId);
  if (index < 0) return;

  cart[index].quantidade += delta;

  if (cart[index].quantidade <= 0) {
    cart.splice(index, 1);
  }

  await userRef.set({ cart }, { merge: true });
  carregarCarrinho();
}


async function removerItem(produtoId) {
  const user = auth.currentUser;
  if (!user) return;

  const userRef = db.collection("users").doc(user.uid);
  const doc = await userRef.get();
  let cart = doc.data()?.cart || [];

  cart = cart.filter((i) => i.produtoId !== produtoId);
  await userRef.set({ cart }, { merge: true });
  carregarCarrinho();
}


function finalizarCompra() {
  window.location.href = "enderecocomprar.html";
}


auth.onAuthStateChanged((user) => {
  if (user) {
    carregarCarrinho();
  } else {
    main.innerHTML = "<p>Você precisa estar logado para ver o carrinho.</p>";
  }
});
