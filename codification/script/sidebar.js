
(function loadSidebarCSS() {
  const existing = document.querySelector('link[href="../css/sidebar.css"]');
  if (!existing) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "../css/sidebar.css";
    document.head.appendChild(link);
  }
})();

document.addEventListener("DOMContentLoaded", () => {
  const sidebarContainer = document.createElement("div");
  sidebarContainer.id = "sidebar-root";
  sidebarContainer.innerHTML = `
    <div id="cart-sidebar">
      <div class="cart-header">
        <h2>Seu Carrinho</h2>
        <button id="close-cart">&times;</button>
      </div>
      <div class="cart-content">
        <p class="cart-aviso">Seu carrinho está vazio...</p>
      </div>
    </div>
    <div id="cart-backdrop"></div>
  `;
  document.body.appendChild(sidebarContainer);

  const sidebar = sidebarContainer.querySelector("#cart-sidebar");
  const backdrop = sidebarContainer.querySelector("#cart-backdrop");
  const closeBtn = sidebarContainer.querySelector("#close-cart");

  const cartIcon = document.querySelector('.actions .icon img[alt="Carrinho"]');
  if (cartIcon) {
    cartIcon.style.cursor = "pointer";
    cartIcon.addEventListener("click", () => {
      sidebar.classList.add("open");
      backdrop.classList.add("visible");
    });
  }

  closeBtn.addEventListener("click", () => {
    sidebar.classList.remove("open");
    backdrop.classList.remove("visible");
  });

  backdrop.addEventListener("click", () => {
    sidebar.classList.remove("open");
    backdrop.classList.remove("visible");
  });
});
