// Динамічне завантаження сюжетних ліній
let allScripts = [];

async function loadScripts(targetId = 'scriptsContainer') {
  try {
    const response = await fetch('scripts.json');
    if (!response.ok) {
      throw new Error(`Помилка завантаження: ${response.status} ${response.statusText}`);
    }
    allScripts = await response.json();
    displayScripts(allScripts, targetId);
  } catch (error) {
    const err = document.getElementById('errorMessage');
    if (err) {
      err.innerText = `Не вдалося завантажити дані про сюжетні лінії: ${error.message}`;
      err.style.display = 'block';
    } else {
      console.error('Помилка завантаження сюжетних ліній:', error);
    }
  }
}

function displayScripts(scripts, targetId = 'scriptsContainer') {
  const container = document.getElementById(targetId);
  if (!container) return;

  container.innerHTML = '';

  scripts.forEach((script, index) => {
    const scriptCard = document.createElement('div');
    scriptCard.className = `script-card ${index % 2 === 1 ? 'reverse' : ''}`;
    scriptCard.setAttribute('data-title', script.title.toLowerCase());

    const statusLabel = script.status === 'main' ? 'Основна гілка' : 'Другорядна гілка';

    scriptCard.innerHTML = `
      <div class="script-image">
        <a href="${script.externalLink || script.link}" target="_blank">
          <img src="images/${script.image}" alt="${script.title}" loading="lazy">
        </a>
      </div>
      <div class="script-info">
        <span class="script-status ${script.status}">${statusLabel}</span>
        <h2>${script.title}</h2>
        <p>${script.description}</p>
        <div class="script-actions">
          <a href="${script.externalLink || script.link}" target="_blank" class="script-btn btn-read">
            📖 Читати сюжет
          </a>
          ${script.externalLink ? `
            <a href="${script.externalLink.replace('/telegra.ph/', '/telegra.ph/edit/')}"
               target="_blank"
               class="script-btn btn-edit">
              ✏️ Редагувати
            </a>
          ` : ''}
        </div>
      </div>
    `;

    container.appendChild(scriptCard);
  });
}

function searchScripts(query) {
  const searchTerm = query.toLowerCase().trim();
  if (!searchTerm) {
    displayScripts(allScripts);
    return;
  }

  const filtered = allScripts.filter(script =>
    script.title.toLowerCase().includes(searchTerm) ||
    script.description.toLowerCase().includes(searchTerm)
  );

  displayScripts(filtered);
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('scriptsContainer')) {
    loadScripts('scriptsContainer');

    const searchInput = document.getElementById('scriptSearch');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchScripts(e.target.value);
      });
    }
  }
});
