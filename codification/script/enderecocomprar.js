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

document.addEventListener("DOMContentLoaded", () => {

  const listaEnderecos = document.getElementById("lista-enderecos");
  const btnNovo = document.getElementById("btn-novo-endereco");
  const btnConfirmar = document.getElementById("btn-confirmar");
  const totalPedidoSpan = document.getElementById("total-pedido");


  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      listaEnderecos.innerHTML = "<p>Faça login para ver seus endereços.</p>";
      if (totalPedidoSpan) totalPedidoSpan.textContent = "0.00";
      return;
    }
    await carregarEnderecos(user.uid);
    await carregarResumoPedido(user.uid);
  });

  async function carregarEnderecos(uid) {
    try {
      const ref = db.collection("users").doc(uid).collection("addresses");
      const snapshot = await ref.get();

      if (snapshot.empty) {
        listaEnderecos.innerHTML = "<p>Nenhum endereço cadastrado.</p>";
        btnConfirmar.disabled = true;
        return;
      }

      listaEnderecos.innerHTML = "";
      snapshot.forEach((doc) => {
        const endereco = doc.data();
        const item = document.createElement("div");
        item.classList.add("endereco-item");
        item.innerHTML = `
          <input type="radio" name="endereco" value="${doc.id}">
          <div>
            <strong>${endereco.logradouro}, ${endereco.numero || "s/n"}</strong><br>
            ${endereco.bairro} - ${endereco.localidade}/${endereco.uf}<br>
            CEP: ${endereco.cep}<br>
            ${endereco.complemento ? `Comp: ${endereco.complemento}<br>` : ""}
            ${endereco.referencia ? `Ref: ${endereco.referencia}` : ""}
          </div>
        `;
        listaEnderecos.appendChild(item);
      });

      document.querySelectorAll('input[name="endereco"]').forEach((radio) => {
        radio.addEventListener("change", () => {
          btnConfirmar.disabled = false;
        });
      });
    } catch (err) {
      console.error("Erro ao carregar endereços:", err);
      listaEnderecos.innerHTML = "<p>Erro ao carregar endereços.</p>";
    }
  }


  async function carregarResumoPedido(uid) {
    try {
      const userDoc = await db.collection("users").doc(uid).get();
      const cart = userDoc.data()?.cart || [];

      let total = 0;
      for (const item of cart) {
        const prodDoc = await db.collection("products").doc(item.produtoId).get();
        if (!prodDoc.exists) continue;

        const produto = prodDoc.data();
        total += produto.price * item.quantidade;
      }

      if (totalPedidoSpan) totalPedidoSpan.textContent = total.toLocaleString("pt-BR");
    } catch (error) {
      console.error("Erro ao carregar resumo do pedido:", error);
      if (totalPedidoSpan) totalPedidoSpan.textContent = "0.00";
    }
  }

  btnConfirmar.addEventListener("click", async () => {
    const selecionado = document.querySelector('input[name="endereco"]:checked');
    if (!selecionado) return alert("Selecione um endereço antes de continuar.");

    const enderecoId = selecionado.value;
    localStorage.setItem("enderecoSelecionado", enderecoId);

    const user = auth.currentUser;
    if (!user) return alert("Faça login para continuar.");

    try {
      const userDoc = await db.collection("users").doc(user.uid).get();
      const cart = userDoc.data()?.cart || [];

      if (cart.length === 0) return alert("Seu carrinho está vazio.");

      const items = [];
      for (const item of cart) {
        const prodDoc = await db.collection("products").doc(item.produtoId).get();
        if (!prodDoc.exists) continue;

        const produto = prodDoc.data();
        items.push({
          title: produto.name,
          quantity: item.quantidade,
          unit_price: produto.price
        });
      }


      const response = await fetch("http://localhost:8080/create-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items })
      });

      const data = await response.json();
      if (data.preference_url) {
        window.location.href = data.preference_url;
      } else {
        console.error(data);
        alert("Erro ao gerar link de pagamento.");
      }

    } catch (error) {
      console.error("Erro ao processar pagamento:", error);
      alert("Erro ao processar pagamento. Tente novamente.");
    }
  });

});
