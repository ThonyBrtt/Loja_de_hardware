document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.querySelector('.search-bar input');
    const searchIcon = document.querySelector('.search-bar img');

    function realizarBusca() {
        const termo = searchInput.value.trim();
        if (termo) {
            window.location.href = `busca.html?q=${encodeURIComponent(termo)}`;
        }
    }

    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                realizarBusca();
            }
        });
    }

    if (searchIcon) {
        searchIcon.style.cursor = 'pointer';
        searchIcon.addEventListener('click', realizarBusca);
    }
});