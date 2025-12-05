// Скрипт для масового оновлення HTML файлів персонажів
// Запускати через Node.js: node update_characters.js

const fs = require('fs');
const path = require('path');

// Список персонажів у порядку з characters.json
const characters = [
    { file: 'amadej.html', name: 'Амадей Віллар', prev: null, next: 'amelia.html' },
    { file: 'amelia.html', name: 'Амелія Бінах', prev: 'amadej.html', next: 'arbo.html' },
    { file: 'arbo.html', name: 'Арбо Вірідіс', prev: 'amelia.html', next: 'henry.html' },
    { file: 'henry.html', name: 'Генрі Вістрал-Тес', prev: 'arbo.html', next: 'idatrill_v2.html' },
    { file: 'idatrill_v2.html', name: 'Іда Трілл', prev: 'henry.html', next: 'ikso.html' },
    { file: 'ikso.html', name: 'Іксо', prev: 'idatrill_v2.html', next: 'jasmyna.html' },
    { file: 'jasmyna.html', name: 'Ясмина Хайдісс', prev: 'ikso.html', next: 'kaan.html' },
    { file: 'kaan.html', name: 'Каан АрʼЗаха', prev: 'jasmyna.html', next: 'kandelaria.html' },
    { file: 'kandelaria.html', name: 'Канделарія Фокс', prev: 'kaan.html', next: 'kastor.html' },
    { file: 'kastor.html', name: 'Кастор Атейрос', prev: 'kandelaria.html', next: 'liam_v2.html' },
    { file: 'liam_v2.html', name: 'Ліам Бреккер', prev: 'kastor.html', next: 'luna.html' },
    { file: 'luna.html', name: 'Лýна Рів\'єр', prev: 'liam_v2.html', next: 'mor.html' },
    { file: 'mor.html', name: 'Міхаелла Мор', prev: 'luna.html', next: 'nagohara.html' },
    { file: 'nagohara.html', name: 'Наганохара Шинʼя', prev: 'mor.html', next: 'rubus.html' },
    { file: 'rubus.html', name: 'Рубус Вірідіс', prev: 'nagohara.html', next: 'salvian.html' },
    { file: 'salvian.html', name: 'Сальвіан Корвус', prev: 'rubus.html', next: 'sjao.html' },
    { file: 'sjao.html', name: 'Сяо Фєй', prev: 'salvian.html', next: null }
];

const charactersDir = path.join(__dirname, 'characters');

function updateCharacterFile(char) {
    const filePath = path.join(charactersDir, char.file);

    try {
        let content = fs.readFileSync(filePath, 'utf8');

        // 1. Замінити <style> блок на link до CSS
        const styleRegex = /<style>[\s\S]*?<\/style>/;
        const newLinks = `<link rel="stylesheet" href="../styles.css">
    <link rel="stylesheet" href="../css/character-profile.css">`;

        if (content.includes('<style>')) {
            content = content.replace(styleRegex, newLinks);
        }

        // 2. Додати meta теги після <meta name="viewport">
        if (!content.includes('meta name="description"')) {
            const metaTags = `
    <meta name="description" content="${char.name} - персонаж світу Aurelion">
    <meta property="og:title" content="${char.name} - Aurelion">
    <meta property="og:description" content="Профіль персонажа ${char.name} у світі Aurelion">`;

            content = content.replace(
                /<meta name="viewport"[^>]*>/,
                `$&${metaTags}`
            );
        }

        // 3. Оновити title
        content = content.replace(
            /<title>.*?<\/title>/,
            `<title>${char.name} - Персонаж Aurelion</title>`
        );

        // 4. Додати навігацію після <body>
        const prevLink = char.prev ? `<a href="${char.prev}">← Попередній</a>` : '<span></span>';
        const nextLink = char.next ? `<a href="${char.next}">Наступний →</a>` : '<span></span>';

        const navHtml = `
    <!-- Навігація -->
    <nav class="character-nav">
        ${prevLink}
        <span class="nav-center">${char.name}</span>
        ${nextLink}
    </nav>

    `;

        if (!content.includes('character-nav')) {
            content = content.replace(/<body[^>]*>/, `$&${navHtml}`);
        }

        // 5. Обгорнути h1 у character-header
        content = content.replace(
            /<h1>(.*?)<\/h1>/,
            `<div class="character-header">
            <h1>$1</h1>
        </div>`
        );

        // 6. Додати class та атрибути до img
        content = content.replace(
            /<img src="\.\.\/images\/(.*?)">/g,
            '<img src="../images/$1" alt="Портрет персонажа ' + char.name + '" class="character-image" loading="lazy">'
        );

        // 7. Додати меню перед </body>
        if (!content.includes('menu-placeholder')) {
            const menuHtml = `
    <div id="menu-placeholder"></div>
    <script src="../js/menu.js" defer></script>`;

            content = content.replace('</body>', `${menuHtml}\n</body>`);
        }

        // Зберегти файл
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✓ Оновлено: ${char.file}`);

    } catch (error) {
        console.error(`✗ Помилка при оновленні ${char.file}:`, error.message);
    }
}

// Оновити всі файли
characters.forEach(char => updateCharacterFile(char));

console.log('\n✓ Оновлення завершено!');
