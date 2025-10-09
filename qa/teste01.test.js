/**
 * @jest-environment jsdom
 */

// ==================== MOCKS ====================

// Mock do usuário
const MOCK_USER = {
  uid: "A2g1R55GqdXIYSMZvwSPpg9NkgI2",
  email: "joao.normandia@ba.estudant.senai.br",
  emailVerified: true,
};

// Mock das funções do Firebase modular
jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(() => ({})),
  signInWithEmailAndPassword: jest.fn((auth, email, password) => {
    if (email === MOCK_USER.email && password === "123123123") {
      return Promise.resolve({ user: MOCK_USER });
    } else {
      return Promise.reject({ code: "auth/wrong-password" });
    }
  }),
  signInWithPopup: jest.fn(() => Promise.resolve({ user: MOCK_USER })),
  GoogleAuthProvider: jest.fn(),
  signOut: jest.fn(() => Promise.resolve()),
}));

jest.mock("firebase/firestore", () => ({
  getFirestore: jest.fn(() => ({})),
  doc: jest.fn(),
  getDoc: jest.fn(),
}));

// Mock do DOM
document.body.innerHTML = `
  <form id="login-form"></form>
  <input id="login-email" />
  <input id="login-password" />
  <div id="message"></div>
  <div id="loading"></div>
`;

// Mock global de showMessage
global.showMessage = jest.fn();

// Mock global de window.location
delete global.window.location;
global.window.location = { href: "" };

// ==================== FUNÇÕES SIMULADAS DO LOGIN ====================
// Aqui você importa diretamente as funções do seu login.js modular,
// mas sem precisar importar o Firebase real
const loginModule = require('../codification/script/login'); // ajuste o caminho
const { validateInputs, simpleErrorMessage, showMessage: showMessageModule, checkAdminRoleAndRedirect } = loginModule;

// ==================== TESTES ====================
describe("Módulo de Login - Testes Unitários Mockados", () => {

  // ------------------- validateInputs -------------------
  describe("validateInputs(email, password)", () => {
    test("Deve retornar erro quando email estiver vazio", () => {
      expect(validateInputs("", "senha")).toBe("Informe o e-mail.");
    });

    test("Deve retornar erro quando senha estiver vazia", () => {
      expect(validateInputs(MOCK_USER.email, "")).toBe("Informe a senha.");
    });

    test("Deve retornar null quando email e senha forem válidos", () => {
      expect(validateInputs(MOCK_USER.email, "123123123")).toBeNull();
    });
  });

  // ------------------- simpleErrorMessage -------------------
  describe("simpleErrorMessage(error)", () => {
    test("Senha ou usuário incorreto", () => {
      expect(simpleErrorMessage({ code: "auth/wrong-password" })).toBe("E-mail ou senha incorretos.");
    });

    test("Email inválido", () => {
      expect(simpleErrorMessage({ code: "auth/invalid-email" })).toBe("E-mail inválido.");
    });

    test("Muitas tentativas", () => {
      expect(simpleErrorMessage({ code: "auth/too-many-requests" })).toBe("Muitas tentativas. Tente novamente mais tarde.");
    });

    test("Erro genérico", () => {
      expect(simpleErrorMessage({ code: "auth/unknown-error" })).toBe("Ocorreu um erro. Tente novamente.");
    });
  });

  // ------------------- showMessage -------------------
  describe("showMessage(text, type)", () => {
    test("Exibe mensagem corretamente", () => {
      showMessageModule("Teste de sucesso", "success");
      const messageBox = document.getElementById("message");
      expect(messageBox.style.display).toBe("block");
      expect(messageBox.className).toBe("message success");
      expect(messageBox.innerText).toBe("Teste de sucesso");
    });
  });

  // ------------------- checkAdminRoleAndRedirect -------------------
  describe("checkAdminRoleAndRedirect(user)", () => {
    const { getDoc } = require("firebase/firestore");

    beforeEach(() => {
      getDoc.mockReset();
    });

    test("Redireciona para admin se role for admin", async () => {
      getDoc.mockResolvedValue({ exists: true, data: () => ({ role: "admin" }) });
      await checkAdminRoleAndRedirect(MOCK_USER);
      expect(global.showMessage).toHaveBeenCalledWith("Bem-vindo(a), Admin!", "success");
      expect(window.location.href).toBe("admin.html");
    });

    test("Redireciona para index se role não for admin", async () => {
      getDoc.mockResolvedValue({ exists: true, data: () => ({ role: "user" }) });
      await checkAdminRoleAndRedirect(MOCK_USER);
      expect(global.showMessage).toHaveBeenCalledWith("Login realizado com sucesso!", "success");
      expect(window.location.href).toBe("index.html");
    });

    test("Redireciona para index se documento não existir", async () => {
      getDoc.mockResolvedValue({ exists: false });
      await checkAdminRoleAndRedirect(MOCK_USER);
      expect(global.showMessage).toHaveBeenCalledWith("Login realizado com sucesso!", "success");
      expect(window.location.href).toBe("index.html");
    });

    test("Redireciona para index em caso de erro no Firestore", async () => {
      getDoc.mockRejectedValue(new Error("Erro de Firestore"));
      await checkAdminRoleAndRedirect(MOCK_USER);
      expect(global.showMessage).toHaveBeenCalledWith("Login realizado com sucesso!", "success");
      expect(window.location.href).toBe("index.html");
    });
  });
});
