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

const listaEnderecos = document.getElementById("lista-enderecos");
const btnNovo = document.getElementById("btn-novo-endereco");
const btnConfirmar = document.getElementById("btn-confirmar");


auth.onAuthStateChanged(async (user) => {
  if (!user) {
    listaEnderecos.innerHTML = "<p>Faça login para ver seus endereços.</p>";
    return;
  }
  carregarEnderecos(user.uid);
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


btnNovo.addEventListener("click", () => {
  if (document.getElementById("modal-endereco")) return;

  const modalHTML = `
    <div id="modal-endereco" class="modal-endereco">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Novo Endereço</h2>
          <button class="close-btn" id="fechar-modal">✖</button>
        </div>

        <form id="form-endereco">
          <label>CEP*</label>
          <div style="display:flex; gap:8px; align-items:center;">
            <input type="text" id="cep" maxlength="9" placeholder="Ex: 01001-000" required>
            <button type="button" id="buscar-cep" class="btn-buscar">🔍</button>
          </div>

          <label>Identificação*</label>
          <input type="text" id="identificacao" placeholder="Casa, Trabalho..." required>

          <label>Logradouro*</label>
          <input type="text" id="logradouro" placeholder="Rua / Avenida" readonly>

          <div class="form-row">
            <div style="flex:1;">
              <label>Número*</label>
              <input type="text" id="numero" placeholder="Ex: 123" disabled required>
            </div>
            <div style="flex:1;">
              <label>Complemento</label>
              <input type="text" id="complemento" placeholder="Apartamento, bloco, etc." disabled>
            </div>
          </div>

          <label>Referência</label>
          <input type="text" id="referencia" placeholder="Perto de..." disabled>

          <label>Bairro*</label>
          <input type="text" id="bairro" readonly>

          <div class="form-row">
            <div style="flex:2;">
              <label>Cidade*</label>
              <input type="text" id="cidade" readonly>
            </div>
            <div style="flex:1;">
              <label>UF*</label>
              <input type="text" id="uf" readonly>
            </div>
          </div>

          <button type="submit" id="salvar-endereco" class="btn-cadastrar" disabled>CADASTRAR ENDEREÇO</button>
        </form>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", modalHTML);


  const modal = document.getElementById("modal-endereco");
  const fecharBtn = document.getElementById("fechar-modal");
  const form = document.getElementById("form-endereco");
  const buscarCepBtn = document.getElementById("buscar-cep");
  const cepInput = document.getElementById("cep");
  const logradouroInput = document.getElementById("logradouro");
  const numeroInput = document.getElementById("numero");
  const complementoInput = document.getElementById("complemento");
  const bairroInput = document.getElementById("bairro");
  const cidadeInput = document.getElementById("cidade");
  const ufInput = document.getElementById("uf");
  const referenciaInput = document.getElementById("referencia");
  const salvarBtn = document.getElementById("salvar-endereco");

  setTimeout(() => modal.classList.add("show"), 10);


  fecharBtn.addEventListener("click", () => {
    modal.classList.remove("show");
    setTimeout(() => modal.remove(), 300);
  });


  buscarCepBtn.addEventListener("click", async () => {
    const cep = cepInput.value.replace(/\D/g, "");
    if (cep.length !== 8) return alert("Digite um CEP válido (8 números).");

    buscarCepBtn.textContent = "⏳";
    buscarCepBtn.disabled = true;

    try {
      const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const dados = await resposta.json();

      if (dados.erro) {
        alert("CEP não encontrado.");
        return;
      }

      logradouroInput.value = dados.logradouro || "";
      bairroInput.value = dados.bairro || "";
      cidadeInput.value = dados.localidade || "";
      ufInput.value = dados.uf || "";

      numeroInput.disabled = false;
      complementoInput.disabled = false;
      referenciaInput.disabled = false;
      salvarBtn.disabled = false;
      salvarBtn.classList.add("ativo");
    } catch {
      alert("Erro ao buscar CEP. Tente novamente.");
    } finally {
      buscarCepBtn.textContent = "🔍";
      buscarCepBtn.disabled = false;
    }
  });


  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const endereco = {
      cep: cepInput.value.replace(/\D/g, ""),
      logradouro: logradouroInput.value,
      bairro: bairroInput.value,
      localidade: cidadeInput.value,
      uf: ufInput.value,
      numero: numeroInput.value,
      complemento: complementoInput.value,
      referencia: referenciaInput.value,
      criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
    };

    const user = auth.currentUser;
    if (!user) return alert("Faça login para salvar o endereço.");

    const ref = db.collection("users").doc(user.uid).collection("addresses");
    const snapshot = await ref.get();
    if (snapshot.size >= 3) {
      alert("Você pode cadastrar no máximo 3 endereços.");
      return;
    }

    try {
      await ref.add(endereco);
      alert("Endereço salvo com sucesso!");
      modal.classList.remove("show");
      setTimeout(() => modal.remove(), 300);
      carregarEnderecos(user.uid);
    } catch (error) {
      console.error("Erro ao salvar endereço:", error);
      alert("Erro ao salvar. Tente novamente.");
    }
  });
});




btnConfirmar.addEventListener("click", () => {
  const selecionado = document.querySelector('input[name="endereco"]:checked');
  if (!selecionado) {
    alert("Selecione um endereço antes de continuar.");
    return;
  }

  const enderecoId = selecionado.value;
  localStorage.setItem("enderecoSelecionado", enderecoId);

  alert("Endereço confirmado! Redirecionando para o pagamento...");
  window.location.href = "checkout.html"; 
});

async function carregarResumoPedido() {
  const user = auth.currentUser;
  if (!user) return;

  try {
    const userDoc = await db.collection("users").doc(user.uid).get();
    const cart = userDoc.data()?.cart || [];

    let total = 0;

    for (const item of cart) {
      const prodDoc = await db.collection("products").doc(item.produtoId).get();
      if (!prodDoc.exists) continue;

      const produto = prodDoc.data();
      total += produto.price * item.quantidade;
    }

    document.getElementById("total-pedido").textContent = total.toLocaleString("pt-BR");
  } catch (error) {
    console.error("Erro ao carregar resumo do pedido:", error);
    document.getElementById("total-pedido").textContent = "0.00";
  }
}


auth.onAuthStateChanged(async (user) => {
  if (user) {
    carregarEnderecos(user.uid);
    carregarResumoPedido(); 
  } else {
    document.getElementById("lista-enderecos").innerHTML = "<p>Faça login para ver seus endereços.</p>";
    document.getElementById("total-pedido").textContent = "0.00";
  }
});

