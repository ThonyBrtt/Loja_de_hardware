const { 
  renderProducts,  
  finalizarCompra, 
} = require('../codification/script/produtos.js');

describe('Renderização de Produtos - (renderProducts)', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="product-grid"></div>';
    });

    test('deve exibir "Nenhum produto encontrado" para uma lista vazia', () => {
        const productGrid = document.getElementById('product-grid');
        renderProducts([]);
        expect(productGrid.innerHTML).toContain('Nenhum produto encontrado');
    });

    test('deve renderizar um card de produto com informações formatadas', () => {
        const productGrid = document.getElementById('product-grid');
        const mockProducts = [{
            id: 'prod123',
            name: 'Memória Ram',
            price: 99.90,
            imageUrl1: 'img1.jpg'
        }];
        renderProducts(mockProducts);
        expect(productGrid.querySelector('.product-name').textContent).toBe('Memória Ram');
    });
});

describe('Finalização de Compra - (finalizarCompra)', () => {
  let mockDb;
  let mockGet;
  let mockUpdate;

  beforeEach(() => {
    delete window.location;
    window.location = { href: '' };

    jest.clearAllMocks();
    mockGet = jest.fn();
    mockUpdate = jest.fn(() => Promise.resolve());
    mockDb = {
      collection: jest.fn(() => ({
        doc: jest.fn(() => ({
          get: mockGet,
          update: mockUpdate,
        })),
      })),
    };
    localStorage.clear();
    jest.spyOn(window, 'alert').mockImplementation(() => {});
    document.body.innerHTML = `<input id="quantidade" value="2" type="number" /><select id="pagamento"></select>`;
  });

  test('deve atualizar o estoque e alertar sucesso em uma compra válida', async () => {
    localStorage.setItem('produtoSelecionado', 'prodComEstoque');
    mockGet.mockResolvedValue({ exists: true, data: () => ({ stock: 10 }) });
    await finalizarCompra(mockDb);
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledWith({ stock: 8 });
  });

  test('NÃO deve atualizar o estoque se a quantidade for maior que a disponível', async () => {
    localStorage.setItem('produtoSelecionado', 'prodSemEstoque');
    document.getElementById('quantidade').value = '5';
    mockGet.mockResolvedValue({ exists: true, data: () => ({ stock: 4 }) });
    await finalizarCompra(mockDb);
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});