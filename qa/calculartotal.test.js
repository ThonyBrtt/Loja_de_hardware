// Autor: Júio César
// Data: 08/10/2025
// Descrição: Testa se o cálculo do total do produto funciona corretamente com diferentes quantidades.

const calcularTotal = (preco, quantidade) => preco * quantidade;

describe("Teste do cálculo de total do produto", () => {
  // Cenário: Preço unitário 100, quantidade 1
  test("Total para 1 unidade", () => {
    const preco = 100;
    const quantidade = 1;
    const total = calcularTotal(preco, quantidade);
    // Execução
    expect(total).toBe(100);
  
  });

  test("Total para 3 unidades", () => {
    const preco = 50;
    const quantidade = 3;
    const total = calcularTotal(preco, quantidade);
    expect(total).toBe(150);
  });


  test("Total para preço zero", () => {
    const preco = 0;
    const quantidade = 5;
    const total = calcularTotal(preco, quantidade);
    expect(total).toBe(0);
  });
});
