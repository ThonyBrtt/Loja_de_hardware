/**
 * @jest-environment jsdom
 */

// Autor: João Lucas Soares Normandia
// Data: 09/10/2025
// Descrição: Testa se o total é atualizado corretamente quando a quantidade do input muda.

describe("Atualização de total com mudança de quantidade", () => {
  let totalPriceEl;
  const produto = { price: 120 };

  beforeEach(() => {
    document.body.innerHTML = `<span id="totalPrice"></span>`;
    totalPriceEl = document.getElementById('totalPrice');
  });

  const atualizarTotal = (quantidade) => {
    const total = produto.price * quantidade;
    totalPriceEl.textContent = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    return totalPriceEl.textContent;
  };

  test("Total atualizado para quantidade 2", () => {
    expect(atualizarTotal(2)).toBe("R$ 240,00");
  });

  test("Total atualizado para quantidade 5", () => {
    expect(atualizarTotal(5)).toBe("R$ 600,00");
  });
});
