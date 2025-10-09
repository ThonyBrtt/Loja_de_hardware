// Autor: Júio César Leandro
// Data: 08/10/2025
// Descrição: Testa o cálculo das parcelas do produto de acordo com o preço e número de parcelas.
// Cenário: Produto com preço definido, parcelamento em 1, 2, 3, 6 ou 12 vezes.
// Execução: Divide o preço pelo número de parcelas e formata em moeda BRL.


describe("Cálculo de parcelamento", () => {
  const calcularParcela = (preco, parcelas) => (preco / parcelas).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  test("2 parcelas de R$ 300,00 cada para produto de R$ 600,00", () => {
    expect(calcularParcela(600, 2)).toBe("R$ 300,00");
  });

  test("3 parcelas de R$ 200,00 cada para produto de R$ 600,00", () => {
    expect(calcularParcela(600, 3)).toBe("R$ 200,00");
  });
});
