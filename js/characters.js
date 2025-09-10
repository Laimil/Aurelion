// Global character list loader. Populates #charactersGrid if present.
async function loadCharacters(targetId = 'charactersGrid') {
  try {
    const response = await fetch('characters.json');
    if (!response.ok) {
      throw new Error(`Помилка завантаження: ${response.status} ${response.statusText}`);
    }
    const characters = await response.json();
    const grid = document.getElementById(targetId);
    if (!grid) return;
    grid.innerHTML = '';
    characters.forEach((character) => {
      const charDiv = document.createElement('div');
      charDiv.className = 'character';
      charDiv.innerHTML = `
        <a href="${character.link}">
          <img src="images/${character.image}" alt="${character.name}" onerror="this.onerror=null; this.src='default.jpg'">
          <p style="text-decoration: none; color: white; pointer-events: none;">${character.name}</p>
        </a>
      `;
      grid.appendChild(charDiv);
    });
  } catch (error) {
    const err = document.getElementById('errorMessage');
    if (err) {
      err.innerText = `Не вдалося завантажити дані про персонажів: ${error.message}`;
      err.style.display = 'block';
    } else {
      console.error('Помилка завантаження персонажів:', error);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('charactersGrid')) {
    loadCharacters('charactersGrid');
  }
});

