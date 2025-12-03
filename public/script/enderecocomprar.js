document.addEventListener("DOMContentLoaded", () => {

  if (!firebase.apps.length) {
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
  }

  const db = firebase.firestore();
  const auth = firebase.auth();

  const listaEnderecos = document.getElementById("lista-enderecos");
  const btnNovo = document.getElementById("btn-novo-endereco");
  const btnConfirmar = document.getElementById("btn-confirmar");
  const totalPrazoSpan = document.getElementById("total-prazo");
  const valorProdutoSpan = document.getElementById("valor-produto");

  let totalEnderecos = 0;

  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      listaEnderecos.innerHTML = "<p>Faça login para ver seus endereços.</p>";
      return;
    }
    await carregarEnderecos(user.uid);
    await carregarResumo(user.uid);
  });

  async function carregarEnderecos(uid) {
    try {
      listaEnderecos.innerHTML = "<p>Carregando...</p>";
      const ref = db.collection("users").doc(uid).collection("addresses");
      const snapshot = await ref.get();

      totalEnderecos = snapshot.size;

      if (snapshot.empty) {
        listaEnderecos.innerHTML = "<p>Nenhum endereço cadastrado.</p>";
        btnConfirmar.disabled = true;
        return;
      }

      listaEnderecos.innerHTML = "";
      
      snapshot.forEach((doc) => {
        const end = doc.data();
        const item = document.createElement("div");
        item.classList.add("endereco-item");
        
        item.style.border = "1px solid #ddd";
        item.style.padding = "15px";
        item.style.marginBottom = "10px";
        item.style.borderRadius = "8px";
        item.style.display = "flex";
        item.style.justifyContent = "space-between";
        item.style.alignItems = "center";

        const complementoTexto = end.complemento ? ` - ${end.complemento}` : "";

        item.innerHTML = `
          <label style="display:flex; gap:10px; cursor:pointer; flex: 1;">
            <input type="radio" name="endereco" value="${doc.id}">
            <div>
              <strong>${end.logradouro}, ${end.numero}${complementoTexto}</strong><br>
              ${end.bairro} - ${end.localidade}/${end.uf}<br>
              <span style="color:#666; font-size:12px;">CEP: ${end.cep}</span>
            </div>
          </label>
          <button onclick="window.excluirEndereco('${doc.id}')" style="background:none; border:none; color:red; cursor:pointer; font-size:20px; padding:5px;" title="Excluir">
            🗑️
          </button>
        `;
        listaEnderecos.appendChild(item);
      });

      document.querySelectorAll('input[name="endereco"]').forEach((radio) => {
        radio.addEventListener("change", () => {
          btnConfirmar.disabled = false;
          btnConfirmar.textContent = "Finalizar Compra";
          btnConfirmar.style.backgroundColor = "#ff6600";
          btnConfirmar.style.cursor = "pointer";
        });
      });

    } catch (err) {
      console.error("Erro ao carregar endereços:", err);
      listaEnderecos.innerHTML = "<p>Erro ao carregar endereços.</p>";
    }
  }

  window.excluirEndereco = async function(id) {
      if(!confirm("Tem certeza que deseja excluir este endereço?")) return;
      
      const user = auth.currentUser;
      if(!user) return;

      try {
          await db.collection("users").doc(user.uid).collection("addresses").doc(id).delete();
          alert("Endereço excluído!");
          carregarEnderecos(user.uid);
      } catch(e) {
          alert("Erro ao excluir: " + e.message);
      }
  };

  async function carregarResumo(uid) {
    try {
        const userDoc = await db.collection("users").doc(uid).get();
        const cart = userDoc.data()?.cart || [];
        let total = 0;

        for (const item of cart) {
            const prodDoc = await db.collection("products").doc(item.produtoId).get();
            if (prodDoc.exists) {
                total += prodDoc.data().price * item.quantidade;
            }
        }

        const totalFormatado = total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
        if(valorProdutoSpan) valorProdutoSpan.textContent = totalFormatado;
        if(totalPrazoSpan) totalPrazoSpan.textContent = totalFormatado;

    } catch (e) {
        console.error(e);
    }
  }

  btnConfirmar.addEventListener("click", async () => {
    const selecionado = document.querySelector('input[name="endereco"]:checked');
    if (!selecionado) return alert("Selecione um endereço para entrega.");

    const user = auth.currentUser;
    if (!user) return;

    btnConfirmar.disabled = true;
    btnConfirmar.textContent = "Processando Pedido...";

    try {
        const userRef = db.collection("users").doc(user.uid);
        const userDoc = await userRef.get();
        const cart = userDoc.data()?.cart || [];

        if (cart.length === 0) {
            alert("Seu carrinho está vazio!");
            window.location.href = "index.html";
            return;
        }

        for (const item of cart) {
            const prodRef = db.collection('products').doc(item.produtoId);
            
            await db.runTransaction(async (t) => {
                const doc = await t.get(prodRef);
                if (!doc.exists) throw "Produto não encontrado: " + item.produtoId;
                
                const novoEstoque = doc.data().stock - item.quantidade;
                if (novoEstoque < 0) throw `Estoque insuficiente para o produto ${doc.data().name}`;
                
                t.update(prodRef, { stock: novoEstoque });
            });
        }

        await db.collection('orders').add({
            userId: user.uid,
            userEmail: user.email,
            addressId: selecionado.value,
            items: cart,
            date: firebase.firestore.FieldValue.serverTimestamp(),
            status: "Aprovado"
        });

        await userRef.update({ cart: [] });

        alert("Compra realizada com sucesso!\nObrigado por comprar na BoomBum.");
        window.location.href = "index.html";

    } catch (error) {
        console.error("Erro na compra:", error);
        alert("Erro ao finalizar compra: " + error);
        btnConfirmar.disabled = false;
        btnConfirmar.textContent = "Tentar Novamente";
    }
  });

  const modalHTML = `
    <div id="modal-endereco" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); justify-content:center; align-items:center; z-index:1000;">
        <div style="background:white; padding:20px; border-radius:8px; width:90%; max-width:400px;">
            <h3>Novo Endereço</h3>
            <form id="form-endereco" style="display:flex; flex-direction:column; gap:10px;">
                
                <input type="text" id="cep" placeholder="CEP (somente números)" maxlength="8" required style="padding:8px;">
                
                <input type="text" id="logradouro" placeholder="Rua" required style="padding:8px;" readonly>
                
                <div style="display:flex; gap:10px;">
                    <input type="text" id="numero" placeholder="Nº" required maxlength="6" style="flex:1; padding:8px;">
                    
                    <input type="text" id="complemento" placeholder="Comp." maxlength="20" style="flex:1; padding:8px;">
                </div>
                
                <input type="text" id="bairro" placeholder="Bairro" required style="padding:8px;" readonly>
                
                <div style="display:flex; gap:10px;">
                    <input type="text" id="localidade" placeholder="Cidade" required style="flex:2; padding:8px;" readonly>
                    <input type="text" id="uf" placeholder="UF" required style="flex:1; padding:8px;" readonly>
                </div>
                
                <div style="display:flex; gap:10px; margin-top:10px;">
                    <button type="submit" style="background:#084c8c; color:white; border:none; padding:10px; flex:1; cursor:pointer;">Salvar</button>
                    <button type="button" id="btn-fechar-modal" style="background:#ccc; border:none; padding:10px; flex:1; cursor:pointer;">Cancelar</button>
                </div>
            </form>
        </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHTML);

  const modal = document.getElementById('modal-endereco');
  const formEndereco = document.getElementById('form-endereco');
  const cepInput = document.getElementById('cep');
  const numeroInput = document.getElementById('numero');

  if (btnNovo) {
    btnNovo.addEventListener('click', (e) => { 
        e.preventDefault(); 
        if (totalEnderecos >= 3) {
            alert("Limite de 3 endereços atingido. Exclua um para adicionar outro.");
            return;
        }
        modal.style.display = 'flex'; 
    });
  }
  document.getElementById('btn-fechar-modal').addEventListener('click', () => modal.style.display = 'none');

  numeroInput.addEventListener('input', function() {
      this.value = this.value.replace(/\D/g, ''); 
  });

  cepInput.addEventListener('blur', async () => {
    let cep = cepInput.value.replace(/\D/g, '');
    
    if (cep.length !== 8) {
        alert("CEP inválido! Digite 8 números.");
        limparFormulario();
        return;
    }

    try {
        document.getElementById('logradouro').value = "...";
        const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await res.json();
        
        if (data.erro) {
            alert("CEP não encontrado!");
            limparFormulario();
            cepInput.value = ""; 
        } else {
            document.getElementById('logradouro').value = data.logradouro;
            document.getElementById('bairro').value = data.bairro;
            document.getElementById('localidade').value = data.localidade;
            document.getElementById('uf').value = data.uf;
            document.getElementById('numero').focus();
        }
    } catch (err) {
        console.error("Erro CEP:", err);
        alert("Erro ao buscar CEP.");
        limparFormulario();
    }
  });

  function limparFormulario() {
      document.getElementById('logradouro').value = "";
      document.getElementById('bairro').value = "";
      document.getElementById('localidade').value = "";
      document.getElementById('uf').value = "";
      document.getElementById('numero').value = "";
      document.getElementById('complemento').value = "";
  }

  formEndereco.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    const numero = document.getElementById('numero').value;
    if (numero === "") {
        alert("O número do endereço é obrigatório.");
        return;
    }

    if (document.getElementById('localidade').value === "") {
        alert("Digite um CEP válido e aguarde o preenchimento.");
        return;
    }

    const novoEndereco = {
        cep: document.getElementById('cep').value,
        logradouro: document.getElementById('logradouro').value,
        numero: numero,
        complemento: document.getElementById('complemento').value,
        bairro: document.getElementById('bairro').value,
        localidade: document.getElementById('localidade').value,
        uf: document.getElementById('uf').value,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        await db.collection('users').doc(user.uid).collection('addresses').add(novoEndereco);
        alert("Endereço salvo com sucesso!");
        formEndereco.reset();
        modal.style.display = 'none';
        carregarEnderecos(user.uid);
    } catch(err) {
        alert("Erro ao salvar: " + err.message);
    }
  });
});