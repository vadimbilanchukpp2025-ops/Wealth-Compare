# Wealth Compare

Навчальний адаптивний лендинг для відповідального порівняння фінансових продуктів (депозити, брокерські рахунки, страхування, картки, ощадні рахунки, кредити) для українських користувачів.

> Проєкт навчальний: сайт не надає фінансових пропозицій, форма є демонстраційною і нікуди не надсилає дані.

## Демо

- GitHub Pages: https://vadimbilanchukpp2025-ops.github.io/Wealth-Compare/
- Vercel: https://wealth-compare-omega.vercel.app/

## Стек

- HTML5, семантична розмітка, один `h1`
- Tailwind CSS 3.4 (локальна збірка, без CDN) + `custom-styles.css`
- Vanilla JavaScript: калькулятор, курси USD/EUR з відкритого API НБУ
- Форма зворотного зв’язку (ЛР 9): RegEx-валідація, стани normal / focus / error / success, доступне модальне вікно (`js/validation.js`)
- JS-плагіни через CDN (ЛР 10): Swiper 11.2.10, Fancybox 5.0.36, Typed.js 2.1.0 — ініціалізація в `js/plugins.js`
- Вбудовані YouTube та Google Maps (`iframe` з `title` і `loading="lazy"`)

## Структура

```text
index.html          головна сторінка
css/tailwind.css    зібраний Tailwind CSS
custom-styles.css   власні стилі (медіафрейми, фокус)
js/app.js           логіка сторінки (меню, калькулятор, курси НБУ)
js/validation.js    клас FeedbackForm: валідація форми, UI-стани, модальне вікно
js/plugins.js       клас MediaWidgets: Swiper (#guide), Fancybox (#gallery), Typed.js (hero)
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

ЛР 9: додано адаптивну форму зворотного зв’язку з клієнтською валідацією. Реального надсилання немає — після успішної перевірки показується «імітація успішного надсилання».

### Правила валідації форми

| Поле | Правило | Приклад |
|---|---|---|
| Ім’я | 2–50 літер; пробіл, апостроф, дефіс лише всередині | Ірина |
| Email | `/^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/` | user@gmail.com |
| Телефон | `/^\+380\d{9}$/` | +380501234567 |
| Повідомлення | 10–1000 символів після trim | Хочу порівняти депозити. |
| Згода | checked | ✓ |

ЛР 10: додано секції «Путівник» (слайдер Swiper, 6 слайдів, autoplay, breakpoints 1 / 2 / 3) і «Галерея» (Fancybox, один альбом `data-fancybox="wc-assets"`, зум, мініатюри, свайпи), ефект друку Typed.js у hero. Плагіни підключено через jsDelivr з фіксованими версіями; якщо CDN недоступний, сторінка працює без ефектів.

| Плагін | CSS (`<head>`) | JS (перед `</body>`) |
|---|---|---|
| Swiper 11.2.10 | `swiper-bundle.min.css` | `swiper-bundle.min.js` |
| Fancybox 5.0.36 | `fancybox/fancybox.css` | `fancybox/fancybox.umd.js` |
| Typed.js 2.1.0 | — | `dist/typed.umd.js` |

## Як долучитися

1. `git clone https://github.com/vadimbilanchukpp2025-ops/Wealth-Compare.git`
2. `git switch -c feature/<назва>` — окрема гілка для своєї частини
3. Коміти за Conventional Commits (`feat:`, `fix:`, `docs:`, `style:`)
4. `git pull` перед `git push`, потім Pull Request у `main`

## Автор

Біланчук В. В., ст. гр. ПП-24, НУ «Львівська політехніка», 2026.
