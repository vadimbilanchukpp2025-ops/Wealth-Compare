# Wealth Compare

Навчальний адаптивний лендинг для відповідального порівняння фінансових продуктів (депозити, брокерські рахунки, страхування, картки, ощадні рахунки, кредити) для українських користувачів.

> Проєкт навчальний: сайт не надає фінансових пропозицій, форма є демонстраційною і нікуди не надсилає дані.

## Демо

- GitHub Pages: https://vadimbilanchukpp2025-ops.github.io/Wealth-Compare/
- Vercel: https://wealth-compare-omega.vercel.app/

## Стек

- HTML5, семантична розмітка, один `h1`
- Tailwind CSS 3.4 (локальна збірка, без CDN) + `custom-styles.css`
- Vanilla JavaScript: калькулятор, валідація форми, курси USD/EUR з відкритого API НБУ
- Вбудовані YouTube та Google Maps (`iframe` з `title` і `loading="lazy"`)

## Структура

```text
index.html          головна сторінка
css/tailwind.css    зібраний Tailwind CSS
custom-styles.css   власні стилі (медіафрейми, фокус)
js/app.js           логіка сторінки
assets/images/      SVG-іконки, WebP-зображення, favicon
src/                вихідні файли Tailwind
```

## Локальний запуск

Відкрийте `index.html` через Live Server у VS Code або запустіть будь-який статичний сервер:

```bash
npx serve .
```

## Статус

ЛР 8: репозиторій підготовлено до публікації на GitHub Pages та Netlify; сайт розгортається з гілки `main`.

## Як долучитися

1. `git clone https://github.com/vadimbilanchukpp2025-ops/Wealth-Compare.git`
2. `git switch -c feature/<назва>` — окрема гілка для своєї частини
3. Коміти за Conventional Commits (`feat:`, `fix:`, `docs:`, `style:`)
4. `git pull` перед `git push`, потім Pull Request у `main`

## Автор

Біланчук В. В., ст. гр. ПП-24, НУ «Львівська політехніка», 2026.
