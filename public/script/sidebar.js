(function loadSidebarCSS() {
  const existing = document.querySelector('link[href="../css/sidebar.css"]');
  if (!existing) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "../css/sidebar.css";
    document.head.appendChild(link);
  }
})();

(function initializeFirebase() {
  if (typeof firebase !== "undefined" && firebase.apps && firebase.apps.length) {
    console.log("Firebase já inicializado.");
    return;
  }

  const firebaseConfig = {
    apiKey: "AIzaSyB_Pd9n5VzXloRQvqusZUIhwZVmJvnKfQc",
    authDomain: "boombum-eaf32.firebaseapp.com",
    projectId: "boombum-eaf32",
    storageBucket: "boombum-eaf32.firebasestorage.app",
    messagingSenderId: "827065363375",
    appId: "1:827065363375:web:913f128e651fcdbe145d5a",
    measurementId: "G-D7CBRK53E0"
  };

  try {
    firebase.initializeApp(firebaseConfig);
    console.log("✅ Firebase inicializado com sucesso (sidebar.js)");
  } catch (error) {
    console.warn("⚠️ Erro ao inicializar Firebase:", error);
  }
})();

const db = firebase.firestore();
const auth = firebase.auth();

document.addEventListener("DOMContentLoaded", () => {
  const sidebarContainer = document.createElement("div");
  sidebarContainer.id = "sidebar-root";
  sidebarContainer.innerHTML = `
    <div id="cart-sidebar">
      <div class="cart-header">
        <h2>Seu Carrinho</h2>
        <button id="close-cart">&times;</button>
      </div>
      <div class="cart-content">
        <p class="cart-aviso">Seu carrinho está vazio...</p>
      </div>
      <div class="cart-footer">
        <div class="total-info">
          <span>Total:</span>
          <strong id="cart-total">R$ 0,00</strong>
        </div>
        <button id="finalizar-compra">Finalizar Compra</button>
      </div>
    </div>
    <div id="cart-backdrop"></div>
  `;
  document.body.appendChild(sidebarContainer);

  const sidebar = sidebarContainer.querySelector("#cart-sidebar");
  const backdrop = sidebarContainer.querySelector("#cart-backdrop");
  const closeBtn = sidebarContainer.querySelector("#close-cart");
  const cartIcon = document.querySelector('.actions .icon img[alt="Carrinho"]');
  const finalizarBtn = sidebarContainer.querySelector("#finalizar-compra");

  if (cartIcon) {
    cartIcon.style.cursor = "pointer";
    cartIcon.addEventListener("click", () => {
      sidebar.classList.add("open");
      backdrop.classList.add("visible");
      carregarCarrinho();
    });
  }

  closeBtn.addEventListener("click", () => {
    sidebar.classList.remove("open");
    backdrop.classList.remove("visible");
  });

  backdrop.addEventListener("click", () => {
    sidebar.classList.remove("open");
    backdrop.classList.remove("visible");
  });

  finalizarBtn.addEventListener("click", () => {
    window.location.href = "carrinhocomprar.html";
  });
});

window.adicionarAoCarrinho = async function (produtoId) {
  const user = auth.currentUser;
  if (!user) {
    alert("Você precisa estar logado para adicionar itens ao carrinho!");
    return;
  }

  try {
    const userRef = db.collection("users").doc(user.uid);
    const userDoc = await userRef.get();
    const cart = userDoc.data()?.cart || [];

    const index = cart.findIndex(item => item.produtoId === produtoId);
    if (index >= 0) {
      cart[index].quantidade += 1;
    } else {
      cart.push({ produtoId, quantidade: 1 });
    }

    await userRef.set({ cart }, { merge: true });
    carregarCarrinho();
  } catch (err) {
    console.error("Erro ao adicionar ao carrinho:", err);
    alert("Erro ao adicionar ao carrinho!");
  }
};

window.aumentarQuantidade = async function (produtoId) {
  const user = auth.currentUser;
  if (!user) return;

  const userRef = db.collection("users").doc(user.uid);
  const userDoc = await userRef.get();
  const cart = userDoc.data()?.cart || [];

  const index = cart.findIndex(item => item.produtoId === produtoId);
  if (index >= 0) {
    cart[index].quantidade += 1;
    await userRef.set({ cart }, { merge: true });
    carregarCarrinho();
  }
};

window.diminuirQuantidade = async function (produtoId) {
  const user = auth.currentUser;
  if (!user) return;

  const userRef = db.collection("users").doc(user.uid);
  const userDoc = await userRef.get();
  let cart = userDoc.data()?.cart || [];

  const index = cart.findIndex(item => item.produtoId === produtoId);
  if (index >= 0) {
    cart[index].quantidade -= 1;
    if (cart[index].quantidade <= 0) {
      cart.splice(index, 1);
    }
    await userRef.set({ cart }, { merge: true });
    carregarCarrinho();
  }
};

window.removerDoCarrinho = async function (produtoId) {
  const user = auth.currentUser;
  if (!user) return;

  const userRef = db.collection("users").doc(user.uid);
  const userDoc = await userRef.get();
  let cart = userDoc.data()?.cart || [];

  cart = cart.filter(item => item.produtoId !== produtoId);
  await userRef.set({ cart }, { merge: true });
  carregarCarrinho();
};

async function carregarCarrinho() {
  const user = auth.currentUser;
  const cartContent = document.querySelector(".cart-content");
  const totalEl = document.getElementById("cart-total");
  if (!cartContent) return;

  if (!user) {
    cartContent.innerHTML = "<p>Faça login para ver seu carrinho.</p>";
    if (totalEl) totalEl.textContent = "R$ 0,00";
    return;
  }

  try {
    const userDoc = await db.collection("users").doc(user.uid).get();
    const cart = userDoc.data()?.cart || [];

    if (cart.length === 0) {
      cartContent.innerHTML = "<p class='cart-aviso'>Seu carrinho está vazio...</p>";
      if (totalEl) totalEl.textContent = "R$ 0,00";
      return;
    }

    let html = "";
    let total = 0;

    for (const item of cart) {
      const productDoc = await db.collection("products").doc(item.produtoId).get();
      if (productDoc.exists) {
        const p = productDoc.data();
        const subtotal = p.price * item.quantidade;
        total += subtotal;
        const price = p.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
        html += `
          <div class="cart-item">
            <img src="${p.imageUrl1}" alt="${p.name}">
            <div class="info">
              <p>${p.name}</p>
              <span>${price} — qtd: ${item.quantidade}</span>
              <button class="remove-btn" onclick="removerDoCarrinho('${item.produtoId}')">x</button>
            </div>
            <div class="qty-buttons">
              <button onclick="aumentarQuantidade('${item.produtoId}')">+</button>
              <button onclick="diminuirQuantidade('${item.produtoId}')">-</button>
            </div>
          </div>
        `;
      }
    }

    cartContent.innerHTML = html;
    if (totalEl)
      totalEl.textContent = total.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });
  } catch (err) {
    console.error("Erro ao carregar carrinho:", err);
    cartContent.innerHTML = "<p>Erro ao carregar carrinho.</p>";
  }
}
