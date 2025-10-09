// Autor: Júio César
// Data: 08/10/2025
// Descrição: Testa a finalização da compra, reduzindo estoque e tratando erros de estoque insuficiente.
// Cenário: Produto com estoque definido, quantidade selecionada menor, igual ou maior que o estoque
// Execução: Função finalizarCompra é chamada simulando transação
// Verificação: Estoque atualizado corretamente ou erro lançado

describe("Finalizar Compra / Transação de Estoque", () => {
  const finalizarCompra = (estoqueAtual, quantidadeSelecionada) => {
    if (quantidadeSelecionada > estoqueAtual) throw "Estoque insuficiente!"; // Execução
    return estoqueAtual - quantidadeSelecionada;                                // Execução
  };

  test("Compra dentro do estoque", () => {
    expect(finalizarCompra(10, 3)).toBe(7); // Verificação
  });

  test("Compra exatamente igual ao estoque", () => {
    expect(finalizarCompra(5, 5)).toBe(0); // Verificação
  });

  test("Compra maior que estoque", () => {
    expect(() => finalizarCompra(2, 5)).toThrow("Estoque insuficiente!"); // Verificação
  });
});
