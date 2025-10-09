// Autor: Júio César
// Data: 08/10/2025
// Descrição: Testa se a compra não é permitida quando a quantidade selecionada excede o estoque disponível.
// Cenário: Produto com estoque limitado.
// Execução: Compara a quantidade selecionada com o estoque atual e lança erro se insuficiente.
// Ambiente esperado: Deve permitir compra apenas se estoque for suficiente.

describe("Validação de estoque", () => {
  const validarEstoque = (quantidadeSelecionada, estoqueAtual) => {
    if (quantidadeSelecionada > estoqueAtual) throw "Estoque insuficiente!";
    return "Estoque suficiente";
  };

  test("Quantidade dentro do estoque", () => {
    expect(validarEstoque(2, 5)).toBe("Estoque suficiente");
  });

  test("Quantidade maior que o estoque", () => {
    expect(() => validarEstoque(10, 5)).toThrow("Estoque insuficiente!");
  });
});
