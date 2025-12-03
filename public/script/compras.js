const firebaseConfig = {
  apiKey: "AIzaSyB_Pd9n5VzXloRQvqusZUIhwZVmJvnKfQc",
  authDomain: "boombum-eaf32.firebaseapp.com",
  projectId: "boombum-eaf32",
  storageBucket: "boombum-eaf32.firebasestorage.app",
  messagingSenderId: "827065363375",
  appId: "1:827065363375:web:913f128e651fcdbe145d5a",
  measurementId: "G-D7CBRK53E0"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();
const auth = firebase.auth();

const btnVoltar = document.getElementById('voltar');
if (btnVoltar) {
    btnVoltar.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'index.html';
    });
}

const produtoId = localStorage.getItem('produtoSelecionado');
const container = document.getElementById('detalhesProduto');

function esperarAuth() {
    return new Promise((resolve) => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            unsubscribe();
            resolve(user);
        });
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    
    const user = await esperarAuth();

    if (!user) {
        alert("Sessão expirada. Faça login novamente.");
        window.location.href = "login.html";
        return;
    }

    if (produtoId) { 
        db.collection('products').doc(produtoId).get().then(doc => {
            if (!doc.exists) {
                container.innerHTML = '<p>Produto não encontrado.</p>';
                return;
            }

            const produto = doc.data();
            const estoque = produto.stock || 0;
            const formattedPrice = produto.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

            let htmlInputs, htmlBotoes;

            if (estoque > 0) {
                htmlInputs = `
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
                    <select id="parcelas"></select>
                    </div>
                `;
                htmlBotoes = `
                    <button id="finalizarCompra">Continuar para Endereço ➝</button>
                    <button id="cancelarCompra" style="background-color: #cccccc; color: #333;">Cancelar</button>
                `;
            } else {
                htmlInputs = `
                    <div style="background:#ffe6e6; color:#d93025; padding:15px; border-radius:5px; margin:20px 0; text-align:center; font-weight:bold;">
                        PRODUTO ESGOTADO
                    </div>
                `;
                htmlBotoes = `
                    <button disabled style="background-color: #ccc; cursor: not-allowed;">Indisponível</button>
                    <button id="cancelarCompra" style="background-color: #eee; color: #333;">Voltar</button>
                `;
            }

            // Renderiza HTML
            container.innerHTML = `
            <div class="produto-card-realista">
                <div class="carousel-container">
                <img src="${produto.imageUrl1}" class="carousel-img active" alt="${produto.name}">
                ${produto.imageUrl2 ? `<img src="${produto.imageUrl2}" class="carousel-img" alt="${produto.name}">` : ''}
                ${produto.imageUrl3 ? `<img src="${produto.imageUrl3}" class="carousel-img" alt="${produto.name}">` : ''}
                
                ${(produto.imageUrl2 || produto.imageUrl3) ? `
                    <button class="carousel-btn left">&#10094;</button>
                    <button class="carousel-btn right">&#10095;</button>
                ` : ''}
                </div>

                <h2>${produto.name}</h2>
                <p>Preço unitário: <strong>${formattedPrice}</strong></p>
                <p id="estoque">Estoque disponível: <strong>${estoque}</strong></p>

                ${htmlInputs}

                <div class="botoes-compra">
                ${htmlBotoes}
                </div>
            </div>
            `;

            document.getElementById('cancelarCompra').addEventListener('click', () => {
                localStorage.removeItem('produtoSelecionado');
                window.location.href = 'index.html';
            });

            if (estoque <= 0) return;
            const imgs = container.querySelectorAll('.carousel-img');
            if (imgs.length > 1) {
                let currentImg = 0;
                const btnLeft = container.querySelector('.carousel-btn.left');
                const btnRight = container.querySelector('.carousel-btn.right');
                function showImg(idx) { imgs.forEach((img, i) => img.classList.toggle('active', i === idx)); }
                btnLeft.addEventListener('click', () => { currentImg = (currentImg - 1 + imgs.length) % imgs.length; showImg(currentImg); });
                btnRight.addEventListener('click', () => { currentImg = (currentImg + 1) % imgs.length; showImg(currentImg); });
            }

            const quantidadeInput = document.getElementById('quantidade');
            const totalPriceEl = document.getElementById('totalPrice');
            const pagamentoSelect = document.getElementById('pagamento');
            const parcelamentoContainer = document.getElementById('parcelamento-container');
            const parcelasSelect = document.getElementById('parcelas');

            function atualizarOpcoesParcelamento(valorTotal) {
                parcelasSelect.innerHTML = "";
                const opcoes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
                opcoes.forEach(qtd => {
                    const valorParcela = valorTotal / qtd;
                    const option = document.createElement('option');
                    option.value = qtd;
                    option.textContent = `${qtd}x de ${valorParcela.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} sem juros`;
                    parcelasSelect.appendChild(option);
                });
            }

            function verificarPagamento() {
                if (pagamentoSelect.value === 'pix') {
                    parcelamentoContainer.style.display = 'none';
                } else {
                    parcelamentoContainer.style.display = 'block';
                }
            }

            function atualizarTotal() {
                let qnt = parseInt(quantidadeInput.value);
                if (isNaN(qnt) || qnt < 1) { qnt = 1; quantidadeInput.value = 1; }
                if (qnt > estoque) { qnt = estoque; quantidadeInput.value = estoque; alert(`Estoque máximo: ${estoque}`); }

                const total = produto.price * qnt;
                totalPriceEl.textContent = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                atualizarOpcoesParcelamento(total);
            }

            pagamentoSelect.addEventListener('change', verificarPagamento);
            quantidadeInput.addEventListener('input', atualizarTotal);
            quantidadeInput.addEventListener('keydown', (e) => { if(e.key === '-' || e.key === 'e') e.preventDefault(); });

            verificarPagamento();
            atualizarTotal();

            document.getElementById('finalizarCompra').addEventListener('click', async () => {
                const btn = document.getElementById('finalizarCompra');
                const qnt = parseInt(quantidadeInput.value);

                btn.disabled = true;
                btn.textContent = "Salvando...";

                try {
                    await db.collection('users').doc(user.uid).update({
                        cart: [{ produtoId: produtoId, quantidade: qnt }] 
                    });

                    window.location.href = 'enderecocomprar.html';

                } catch (e) {
                    console.error(e);
                    alert("Erro ao processar. Tente novamente.");
                    btn.disabled = false;
                    btn.textContent = "Continuar para Endereço ➝";
                }
            });
        });
    } 

    else {
        const userDoc = await db.collection('users').doc(user.uid).get();
        const cart = userDoc.data()?.cart || [];

        if (cart.length === 0) {
            container.innerHTML = `
                <div style="text-align:center; margin-top:50px;">
                    <p>Seu carrinho está vazio.</p>
                    <a href="index.html" style="color:#ff6600; font-weight:bold;">Voltar as compras</a>
                </div>`;
            return;
        }

        let totalGeral = 0;
        const promises = cart.map(async item => {
            const doc = await db.collection('products').doc(item.produtoId).get();
            if (!doc.exists) return null;
            const p = doc.data();
            const totalItem = p.price * item.quantidade;
            totalGeral += totalItem;
            const img = p.imageUrl1 || p.imageUrl || "https://via.placeholder.com/100";
            
            return `
            <div class="produto-card-carrinho">
                <img src="${img}" alt="${p.name}">
                <div>
                <h3>${p.name}</h3>
                <p>Qtd: ${item.quantidade}</p>
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
                <button id="finalizarCarrinho">Continuar para Endereço ➝</button>
                <button id="cancelarCarrinho" style="background-color: #ccc; color: #333;">Cancelar</button>
                </div>
            </div>
            `;

            document.getElementById('cancelarCarrinho').addEventListener('click', () => {
                window.location.href = 'index.html';
            });

            document.getElementById('finalizarCarrinho').addEventListener('click', () => {
                window.location.href = 'enderecocomprar.html';
            });
        });
    }
});