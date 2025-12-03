// --- script/sidebar.js (CORRIGIDO E SEGURO) ---

(function loadSidebarCSS() {
  const existing = document.querySelector('link[href="./css/sidebar.css"]');
  if (!existing) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "./css/sidebar.css";
    document.head.appendChild(link);
  }
})();

(function initializeFirebase() {
  if (typeof firebase !== "undefined" && firebase.apps && firebase.apps.length) {
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
  } catch (error) {
    console.warn("Erro ao inicializar Firebase:", error);
  }
})();

// --- FUNÇÕES AUXILIARES SEGURAS ---
// Usamos isso em vez de declarar 'const db' globalmente para evitar conflito
function getDB() { return firebase.firestore(); }
function getAuth() { return firebase.auth(); }

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
        <p class="cart-aviso">Carregando...</p>
      </div>
      <div class="cart-footer" style="display: flex; flex-direction: column; gap: 10px;">
        <div class="total-info" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
          <span>Total:</span>
          <strong id="cart-total">R$ 0,00</strong>
        </div>
        
        <div id="cart-error-msg" style="display: none; background-color: #ffe6e6; color: #d93025; font-size: 13px; padding: 8px; border: 1px solid #d93025; border-radius: 4px; text-align: center;">
            ⚠️ Alguns itens excedem o estoque disponível.
        </div>

        <button id="finalizar-compra" disabled style="opacity: 0.5; cursor: not-allowed; width: 100%;">Finalizar Compra</button>
      </div>
    </div>
    <div id="cart-backdrop"></div>
  `;
  document.body.appendChild(sidebarContainer);

  const sidebar = sidebarContainer.querySelector("#cart-sidebar");
  const backdrop = sidebarContainer.querySelector("#cart-backdrop");
  const closeBtn = sidebarContainer.querySelector("#close-cart");
  const cartIcon = document.querySelector('.icon#cart-trigger') || document.querySelector('.actions .icon img[alt="Carrinho"]')?.parentElement;
  const finalizarBtn = sidebarContainer.querySelector("#finalizar-compra");

  if (cartIcon) {
    cartIcon.style.cursor = "pointer";
    cartIcon.addEventListener("click", (e) => {
      e.preventDefault(); 
      sidebar.classList.add("open");
      backdrop.classList.add("visible");
      carregarCarrinho();
    });
  }

  const fecharSidebar = () => {
    sidebar.classList.remove("open");
    backdrop.classList.remove("visible");
  };

  closeBtn.addEventListener("click", fecharSidebar);
  backdrop.addEventListener("click", fecharSidebar);

  finalizarBtn.addEventListener("click", () => {
    window.location.href = "carrinhocomprar.html";
  });
});

window.adicionarAoCarrinho = async function (produtoId) {
  const auth = getAuth();
  const db = getDB();
  const user = auth.currentUser;

  if (!user) {
    alert("Você precisa estar logado para adicionar itens ao carrinho!");
    window.location.href = "login.html";
    return;
  }

  try {
    const prodDoc = await db.collection("products").doc(produtoId).get();
    if (prodDoc.exists) {
        const estoque = prodDoc.data().stock || 0;
        
        const userDoc = await db.collection("users").doc(user.uid).get();
        const cart = userDoc.data()?.cart || [];
        const itemNoCarrinho = cart.find(i => i.produtoId === produtoId);
        const qtdAtual = itemNoCarrinho ? itemNoCarrinho.quantidade : 0;

        if (qtdAtual >= estoque) {
            alert("Limite de estoque atingido!");
            return;
        }
    }
  } catch (e) { console.error(e); }

  alert("✅ Produto adicionado ao carrinho!");

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

    const sidebar = document.getElementById("cart-sidebar");
    if(sidebar && sidebar.classList.contains("open")) {
        carregarCarrinho();
    }
  } catch (err) {
    console.error("Erro ao adicionar:", err);
  }
};

window.aumentarQuantidade = async function (produtoId) {
  const auth = getAuth();
  const db = getDB();
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
  const auth = getAuth();
  const db = getDB();
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
  const auth = getAuth();
  const db = getDB();
  const user = auth.currentUser;
  if (!user) return;

  const userRef = db.collection("users").doc(user.uid);
  const userDoc = await userRef.get();
  let cart = userDoc.data()?.cart || [];

  cart = cart.filter(item => item.produtoId !== produtoId);
  await userRef.set({ cart }, { merge: true });
  carregarCarrinho();
};

function toggleBotaoFinalizar(ativo, temErroEstoque) {
    const btn = document.getElementById("finalizar-compra");
    const errorMsg = document.getElementById("cart-error-msg");
    
    if (btn) {
        if (ativo && !temErroEstoque) {
            btn.disabled = false;
            btn.style.opacity = "1";
            btn.style.cursor = "pointer";
            btn.style.backgroundColor = "#ff6600";
            if(errorMsg) errorMsg.style.display = "none";
        } else {
            btn.disabled = true;
            btn.style.opacity = "0.5";
            btn.style.cursor = "not-allowed";
            btn.style.backgroundColor = "#ccc";
            
            if (temErroEstoque && errorMsg) {
                errorMsg.style.display = "block";
                errorMsg.innerText = "⚠️ Quantidade maior que o estoque. Ajuste para comprar.";
            } else if (errorMsg) {
                errorMsg.style.display = "none";
            }
        }
    }
}

async function carregarCarrinho() {
  const auth = getAuth();
  const db = getDB();
  const user = auth.currentUser;
  const cartContent = document.querySelector(".cart-content");
  const totalEl = document.getElementById("cart-total");
  const errorMsg = document.getElementById("cart-error-msg");
  
  if (!cartContent) return;

  if(errorMsg) errorMsg.style.display = "none";

  if (!user) {
    cartContent.innerHTML = "<p class='cart-aviso'>Faça login para ver seu carrinho.</p>";
    if (totalEl) totalEl.textContent = "R$ 0,00";
    toggleBotaoFinalizar(false, false);
    return;
  }

  try {
    const userDoc = await db.collection("users").doc(user.uid).get();
    const cart = userDoc.data()?.cart || [];

    if (cart.length === 0) {
      cartContent.innerHTML = "<p class='cart-aviso'>Seu carrinho está vazio...</p>";
      if (totalEl) totalEl.textContent = "R$ 0,00";
      toggleBotaoFinalizar(false, false);
      return;
    }

    let html = "";
    let total = 0;
    let temErroEstoque = false; 

    for (const item of cart) {
      const productDoc = await db.collection("products").doc(item.produtoId).get();
      if (productDoc.exists) {
        const p = productDoc.data();
        const estoque = p.stock || 0;
        const subtotal = p.price * item.quantidade;
        total += subtotal;
        
        const imgUrl = p.imageUrl1 || p.imageUrl || "https://via.placeholder.com/70";
        const price = p.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
        
        const estoqueInsuficiente = item.quantidade > estoque;
        if (estoqueInsuficiente) temErroEstoque = true;

        html += `
          <div class="cart-item" style="${estoqueInsuficiente ? 'border: 2px solid #d93025; background: #ffe6e6;' : ''}">
            <img src="${imgUrl}" alt="${p.name}">
            <div class="info">
              <p>${p.name}</p>
              <span>${price}</span>
              ${estoqueInsuficiente 
                  ? `<div style="color:#d93025; font-weight:bold; font-size:11px; margin-top:2px;">❌ Estoque: ${estoque} (Você pediu ${item.quantidade})</div>` 
                  : ''
              }
              <button class="remove-btn" onclick="removerDoCarrinho('${item.produtoId}')">x</button>
            </div>
            <div class="qty-buttons">
              <button onclick="aumentarQuantidade('${item.produtoId}')" ${estoqueInsuficiente ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>+</button>
              <span>${item.quantidade}</span>
              <button onclick="diminuirQuantidade('${item.produtoId}')">-</button>
            </div>
          </div>
        `;
      }
    }

    cartContent.innerHTML = html;
    
    toggleBotaoFinalizar(true, temErroEstoque);

    if (totalEl)
      totalEl.textContent = total.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });
  } catch (err) {
    console.error("Erro ao carregar carrinho:", err);
    cartContent.innerHTML = "<p>Erro ao carregar carrinho.</p>";
    toggleBotaoFinalizar(false, false);
  }
}