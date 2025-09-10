// Global menu loader. No visual change; used across pages.
async function loadMenu() {
  try {
    const response = await fetch('worldbuilding.json');
    if (!response.ok) {
      throw new Error(`Помилка завантаження меню: ${response.status} ${response.statusText}`);
    }
    const menuItems = await response.json();
    let menuHTML = '<nav class="top-menu">';
    menuItems.forEach(item => {
      menuHTML += `
        <a href="${item.link}" class="menu-item">
          <img src="images/${item.image}" alt="${item.title}" title="${item.title}">
          <span>${item.title}</span>
        </a>
      `;
    });
    menuHTML += '</nav>';
    const placeholder = document.getElementById('menu-placeholder');
    if (placeholder) placeholder.innerHTML = menuHTML;
  } catch (error) {
    console.error('Помилка завантаження меню:', error);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('menu-placeholder')) {
    loadMenu();
  }
});

