// Autor: Júio César + Leandro
// Data: 08/10/2025
// Descrição: Testa a visibilidade do parcelamento de acordo com o método de pagamento.
// Cenário: Pagamento selecionado no dropdown (PIX ou Cartão)
// Execução: Função que define se o parcelamento deve aparecer
// Verificação: Parcelamento oculto para PIX e visível para cartão

describe("Método de Pagamento", () => {
  const verificarParcelamento = (metodo) => metodo === 'pix' ? false : true; // Execução

  test("Pagamento PIX oculta parcelamento", () => {
    expect(verificarParcelamento('pix')).toBe(false); // Verificação
  });

  test("Pagamento Cartão exibe parcelamento", () => {
    expect(verificarParcelamento('cartao')).toBe(true); // Verificação
  });
});
