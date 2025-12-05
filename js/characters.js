// Global character list loader. Populates #charactersGrid if present.
let allCharacters = [];

async function loadCharacters(targetId = 'charactersGrid') {
  try {
    const response = await fetch('characters.json');
    if (!response.ok) {
      throw new Error(`Помилка завантаження: ${response.status} ${response.statusText}`);
    }
    allCharacters = await response.json();
    displayCharacters(allCharacters, targetId);
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

function displayCharacters(characters, targetId = 'charactersGrid') {
  const grid = document.getElementById(targetId);
  if (!grid) return;
  grid.innerHTML = '';
  characters.forEach((character) => {
    const charDiv = document.createElement('div');
    charDiv.className = 'character';
    charDiv.setAttribute('data-name', character.name.toLowerCase());
    charDiv.innerHTML = `
      <a href="${character.link}">
        <img src="images/${character.image}" alt="Портрет персонажа ${character.name}" loading="lazy" onerror="this.onerror=null; this.src='default.jpg'">
        <p style="text-decoration: none; color: white; pointer-events: none;">${character.name}</p>
      </a>
    `;
    grid.appendChild(charDiv);
  });
}

function searchCharacters(query) {
  const searchTerm = query.toLowerCase().trim();
  if (!searchTerm) {
    displayCharacters(allCharacters);
    return;
  }
  const filtered = allCharacters.filter(char =>
    char.name.toLowerCase().includes(searchTerm)
  );
  displayCharacters(filtered);
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('charactersGrid')) {
    loadCharacters('charactersGrid');

    const searchInput = document.getElementById('characterSearch');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchCharacters(e.target.value);
      });
    }
  }
});

