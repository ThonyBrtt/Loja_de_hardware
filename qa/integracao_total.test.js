/**
 * @jest-environment jsdom
 */

// Autor: Júio César
// Data: 08/10/2025
// Descrição: Teste de integração do fluxo "quantidade selecionada → total exibido"
// Cenário: Produto com preço definido, usuário altera quantidade no input, total deve atualizar
// Execução: Simula DOM com input de quantidade e total, chama função atualizarTotal
// Verificação: O total exibido corresponde ao preço * quantidade, formatado em BRL

describe("Integração: quantidade → total exibido", () => {
  let totalPriceEl;
  let quantidadeInput;
  const produto = { price: 150 };

  beforeEach(() => {
    
    document.body.innerHTML = `
      <input type="number" id="quantidade" value="1" min="1">
      <span id="totalPrice"></span>
    `;
    quantidadeInput = document.getElementById('quantidade');
    totalPriceEl = document.getElementById('totalPrice');
  });


  function atualizarTotal() {
    const quantidade = parseInt(quantidadeInput.value) || 1; // Execução
    const total = produto.price * quantidade;                // Execução
    totalPriceEl.textContent = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); // Execução
  }

  test("Total inicial corresponde a quantidade 1", () => {
    atualizarTotal();                                      // Execução
    expect(totalPriceEl.textContent).toBe("R$ 150,00");   // Verificação
  });

  test("Atualiza total quando quantidade muda", () => {
    quantidadeInput.value = "3";                          // Execução
    atualizarTotal();                                      // Execução
    expect(totalPriceEl.textContent).toBe("R$ 450,00");   // Verificação

    quantidadeInput.value = "5";                          // Execução
    atualizarTotal();                                      // Execução
    expect(totalPriceEl.textContent).toBe("R$ 750,00");   // Verificação
  });

  test("Quantidade inválida define total como 1x preço", () => {
    quantidadeInput.value = "0";                          // Execução
    atualizarTotal();                                      // Execução
    expect(totalPriceEl.textContent).toBe("R$ 150,00");   // Verificação
  });
});
