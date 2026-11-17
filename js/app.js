const menuToggle = document.querySelector("#menu-toggle");
const mobileMenu = document.querySelector("#mobile-menu");
const dropdown = document.querySelector("[data-dropdown]");
const dropdownToggle = document.querySelector("[data-dropdown-toggle]");
const dropdownMenu = document.querySelector("[data-dropdown-menu]");

function closeMobileMenu() {
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Відкрити меню");
  menuToggle.querySelector("span").textContent = "☰";
  mobileMenu.classList.add("hidden");
}

function closeDropdown() {
  dropdownToggle.setAttribute("aria-expanded", "false");
  dropdownMenu.classList.add("hidden");
}

menuToggle.addEventListener("click", () => {
  const open = menuToggle.getAttribute("aria-expanded") !== "true";
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Закрити меню" : "Відкрити меню");
  menuToggle.querySelector("span").textContent = open ? "×" : "☰";
  mobileMenu.classList.toggle("hidden", !open);
});

mobileMenu.addEventListener("click", (event) => {
  if (event.target.closest("a")) closeMobileMenu();
});

dropdownToggle.addEventListener("click", () => {
  const open = dropdownToggle.getAttribute("aria-expanded") !== "true";
  dropdownToggle.setAttribute("aria-expanded", String(open));
  dropdownMenu.classList.toggle("hidden", !open);
});

document.addEventListener("click", (event) => {
  if (!dropdown.contains(event.target)) closeDropdown();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeDropdown();
    closeMobileMenu();
  }
});

window.addEventListener("resize", () => {
  if (window.innerWidth >= 768) closeMobileMenu();
  if (window.innerWidth < 768) closeDropdown();
});

const currency = new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 0 });
document.querySelector("#calculator").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const amount = Number(form.elements.amount.value);
  const months = Number(form.elements.months.value);
  const rate = Number(form.elements.rate.value);
  const income = Math.round(amount * (rate / 100) * (months / 12));
  document.querySelector("#result-value").textContent = `${currency.format(income)} ₴`;
});

// Feedback form validation lives in js/validation.js (FeedbackForm class).

// Dynamic third-party widget: public NBU API. No financial decision is made here.
async function loadExchangeRates() {
  const list = document.querySelector("#exchange-rates");
  const status = document.querySelector("#rate-status");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch("https://bank.gov.ua/NBUStatService/v1/statdirectory/exchangenew?json", {
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    for (const code of ["USD", "EUR"]) {
      const item = data.find((entry) => entry.cc === code);
      if (!item || !Number.isFinite(Number(item.rate))) throw new Error(`Missing ${code}`);
      document.querySelector(`#rate-${code.toLowerCase()}`).textContent =
        `${new Intl.NumberFormat("uk-UA", { minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(Number(item.rate))} ₴`;
    }
    const date = data.find((entry) => entry.cc === "USD")?.exchangedate;
    status.textContent = `Дата курсу: ${date || "поточна"}. Джерело: Національний банк України.`;
  } catch {
    document.querySelector("#rate-usd").textContent = "Недоступно";
    document.querySelector("#rate-eur").textContent = "Недоступно";
    status.textContent = "Не вдалося завантажити курс. Перевірте поточні дані на сайті НБУ.";
  } finally {
    clearTimeout(timeout);
    list.setAttribute("aria-busy", "false");
  }
}

loadExchangeRates();
