// ЛР 11 — інтерактивний віджет «Планувальник накопичень».
// Vanilla JS, без глобальних змінних: усе живе в IIFE, назовні — лише заморожений неймспейс для тестів у Console.
// Два рівні відмови: calculateSavings() — Fail-Fast (кидає RangeError розробнику),
// SavingsPlanner — Fail-Safe (ловить помилку, показує користувачу зрозуміле повідомлення).
(() => {
  "use strict";

  const PRODUCTS = Object.freeze({
    savings: { rate: 0.1, taxable: true },
    deposit: { rate: 0.12, taxable: true },
    bonds: { rate: 0.15, taxable: false }, // дохід за ОВДП не оподатковується
  });
  const DEFAULT_PRODUCT = "deposit";
  const TAX_RATE = 0.23; // 18 % ПДФО + 5 % військовий збір

  const LIMITS = Object.freeze({
    initial: { min: 0, max: 10_000_000, required: true, integer: false },
    monthly: { min: 0, max: 100_000, required: true, integer: false },
    term: { min: 1, max: 120, required: true, integer: true },
    goal: { min: 1, max: 100_000_000, required: false, integer: false },
  });

  const MESSAGES = Object.freeze({
    initial: "Введіть стартову суму від 0 до 10 000 000 ₴.",
    monthly: "Введіть поповнення від 0 до 100 000 ₴ на місяць.",
    term: "Введіть строк — ціле число місяців від 1 до 120.",
    goal: "Ціль — від 1 до 100 000 000 ₴ або залиште поле порожнім.",
    badInput: "Тут можна вводити лише цифри.",
  });

  const PRESETS = Object.freeze({
    cushion: { initial: 5000, monthly: 3000, term: 12, product: "savings", goal: 40000 },
    study: { initial: 20000, monthly: 2500, term: 36, product: "bonds", goal: 150000 },
    car: { initial: 50000, monthly: 10000, term: 48, product: "deposit", goal: 600000 },
  });

  const ERROR_CLASSES = ["border-red-600", "bg-red-50", "ring-2", "ring-red-200"];
  const OK_CLASSES = ["border-line", "bg-white"];

  const money = new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 0 });
  const toKop = (value) => Math.round(value * 100) / 100;

  /** Fail-Fast: чиста функція розрахунку. Невалідні аргументи — помилка розробника, а не тихий NaN. */
  function calculateSavings({ initial, monthly, term, product, capitalize, tax, goal = null }) {
    const assertRange = (name, value, { min, max, integer }) => {
      if (typeof value !== "number" || !Number.isFinite(value)) throw new RangeError(`${name}: not a finite number`);
      if (value < min || value > max) throw new RangeError(`${name}: ${value} is outside ${min}..${max}`);
      if (integer && !Number.isInteger(value)) throw new RangeError(`${name}: must be an integer`);
    };
    assertRange("initial", initial, LIMITS.initial);
    assertRange("monthly", monthly, LIMITS.monthly);
    assertRange("term", term, LIMITS.term);
    if (goal !== null) assertRange("goal", goal, LIMITS.goal);
    if (!Object.hasOwn(PRODUCTS, product)) throw new RangeError(`product: unknown "${product}"`);

    const { rate, taxable } = PRODUCTS[product];
    const monthlyRate = rate / 12;
    const taxRate = tax && taxable ? TAX_RATE : 0;
    let balance = initial;
    let principal = initial;
    let paidOut = 0;
    let taxTotal = 0;
    let goalMonth = goal !== null && initial >= goal ? 0 : null;

    for (let month = 1; month <= term; month += 1) {
      const interest = (capitalize ? balance : principal) * monthlyRate;
      const monthTax = interest * taxRate;
      taxTotal += monthTax;
      if (capitalize) balance += interest - monthTax;
      else paidOut += interest - monthTax;
      balance += monthly;
      principal += monthly;
      if (goalMonth === null && goal !== null && balance + paidOut >= goal) goalMonth = month;
    }

    const total = toKop(balance + paidOut);
    return {
      total,
      contributed: toKop(principal),
      interest: toKop(total - principal),
      tax: toKop(taxTotal),
      goalMonth,
      progress: goal === null ? null : Math.min(100, Math.max(0, (total / goal) * 100)),
    };
  }

  /** Fail-Safe: UI-шар. Ніколи не показує NaN / Infinity / undefined і не падає від брудного вводу. */
  class SavingsPlanner {
    constructor(root) {
      this.root = root;
      this.field = (name) => root.querySelector(`[data-sp="${name}"]`);
      this.inputs = {
        initial: this.field("initial"),
        monthly: this.field("monthly"),
        monthlyRange: this.field("monthlyRange"),
        term: this.field("term"),
        product: this.field("product"),
        goal: this.field("goal"),
        capitalize: this.field("capitalize"),
        tax: this.field("tax"),
      };
      this.out = (name) => root.querySelector(`[data-sp-out="${name}"]`);
      this.progressBox = root.querySelector("[data-sp-progress]");
      this.frame = 0;
      this.ready = Object.values(this.inputs).every(Boolean) && Boolean(this.out("total"));
    }

    init() {
      if (!this.ready) return false; // немає потрібної розмітки — тихо не стартуємо, решта сторінки працює
      const schedule = () => this.schedule();
      for (const name of ["initial", "monthly", "term", "goal"]) {
        this.inputs[name].addEventListener("input", schedule);
        this.inputs[name].addEventListener("change", () => this.normalize(name));
      }
      this.inputs.monthlyRange.addEventListener("input", () => {
        this.inputs.monthly.value = this.inputs.monthlyRange.value;
        this.schedule();
      });
      for (const name of ["product", "capitalize", "tax"]) this.inputs[name].addEventListener("change", schedule);
      this.root.addEventListener("click", (event) => {
        const button = event.target.closest("[data-sp-preset]");
        if (button && this.root.contains(button)) this.applyPreset(button.dataset.spPreset);
      });
      this.root.addEventListener("reset", () => setTimeout(schedule, 0)); // після того, як браузер поверне default-значення
      this.root.addEventListener("submit", (event) => event.preventDefault()); // Enter у полі не перезавантажує сторінку
      this.render();
      return true;
    }

    /** Швидке введення: не більше одного перерахунку на кадр. */
    schedule() {
      cancelAnimationFrame(this.frame);
      this.frame = requestAnimationFrame(() => this.render());
    }

    /** Зчитує й перевіряє одне числове поле. Повертає { ok, value, message }. */
    readNumber(name) {
      const input = this.inputs[name];
      const rule = LIMITS[name];
      const raw = input.value.trim();
      if (input.validity.badInput) return { ok: false, message: MESSAGES.badInput };
      if (raw === "") return rule.required ? { ok: false, message: MESSAGES[name] } : { ok: true, value: null };
      const value = Number(raw);
      if (!Number.isFinite(value) || value < rule.min || value > rule.max) return { ok: false, message: MESSAGES[name] };
      if (rule.integer && !Number.isInteger(value)) return { ok: false, message: MESSAGES[name] };
      return { ok: true, value: rule.integer ? value : toKop(value) };
    }

    /** На change (після введення) прибирає зайві копійки: 1000.567 → 1000.57. */
    normalize(name) {
      const state = this.readNumber(name);
      if (state.ok && state.value !== null && String(state.value) !== this.inputs[name].value) {
        this.inputs[name].value = String(state.value);
      }
    }

    readProduct() {
      const select = this.inputs.product;
      if (Object.hasOwn(PRODUCTS, select.value)) return select.value;
      select.value = DEFAULT_PRODUCT; // підмінене значення select → безпечне значення за замовченням
      return DEFAULT_PRODUCT;
    }

    showFieldError(name, message) {
      const input = this.inputs[name];
      const box = this.root.querySelector(`[data-sp-error="${name}"]`);
      const invalid = Boolean(message);
      input.setAttribute("aria-invalid", String(invalid));
      input.classList.remove(...(invalid ? OK_CLASSES : ERROR_CLASSES));
      input.classList.add(...(invalid ? ERROR_CLASSES : OK_CLASSES));
      if (box) {
        box.textContent = message || "";
        box.classList.toggle("hidden", !invalid);
      }
    }

    render() {
      const values = {};
      let valid = true;
      for (const name of Object.keys(LIMITS)) {
        const state = this.readNumber(name);
        this.showFieldError(name, state.ok ? "" : state.message);
        if (state.ok) values[name] = state.value;
        else valid = false;
      }
      if (valid) this.inputs.monthlyRange.value = String(Math.min(values.monthly, Number(this.inputs.monthlyRange.max)));
      if (!valid) return this.renderEmpty("Виправте позначені поля — розрахунок оновиться автоматично.");

      try {
        const result = calculateSavings({
          ...values,
          product: this.readProduct(),
          capitalize: this.inputs.capitalize.checked,
          tax: this.inputs.tax.checked,
        });
        this.renderResult(result, values.goal);
      } catch {
        this.renderEmpty("Не вдалося виконати розрахунок. Перевірте введені дані.");
      }
    }

    renderResult(result, goal) {
      this.out("total").textContent = `${money.format(result.total)} ₴`;
      this.out("contributed").textContent = `${money.format(result.contributed)} ₴`;
      this.out("interest").textContent = `${money.format(result.interest)} ₴`;
      this.out("tax").textContent = `${money.format(result.tax)} ₴`;
      const percent = result.progress ?? 0;
      this.out("bar").style.width = `${percent.toFixed(1)}%`;
      this.progressBox?.setAttribute("aria-valuenow", String(Math.round(percent)));
      let text = "Вкажіть ціль, щоб побачити прогрес.";
      if (goal !== null) {
        if (result.goalMonth === 0) text = `Ціль ${money.format(goal)} ₴ уже покрита стартовою сумою.`;
        else if (result.goalMonth !== null) text = `Ціль ${money.format(goal)} ₴ буде досягнута на ${result.goalMonth}-му місяці.`;
        else text = `До цілі ${money.format(goal)} ₴ не вистачить ${money.format(goal - result.total)} ₴ (${Math.floor(percent)} %).`;
      }
      this.out("goalText").textContent = text;
      this.setStatus("");
    }

    renderEmpty(message) {
      for (const name of ["total", "contributed", "interest", "tax"]) this.out(name).textContent = "—";
      this.out("bar").style.width = "0%";
      this.progressBox?.setAttribute("aria-valuenow", "0");
      this.out("goalText").textContent = "—";
      this.setStatus(message);
    }

    setStatus(message) {
      const status = this.out("status");
      if (!status) return;
      status.textContent = message;
      status.classList.toggle("hidden", !message);
    }

    applyPreset(key) {
      if (!Object.hasOwn(PRESETS, key)) return;
      const preset = PRESETS[key];
      for (const name of ["initial", "monthly", "term", "goal"]) this.inputs[name].value = String(preset[name]);
      this.inputs.product.value = preset.product;
      this.inputs.monthlyRange.value = String(preset.monthly);
      this.render();
    }
  }

  const start = () => {
    document.querySelectorAll("[data-savings-planner]").forEach((root) => new SavingsPlanner(root).init());
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();

  // Єдиний публічний ідентифікатор — для ручних перевірок у DevTools Console.
  window.WealthCompareWidgets = Object.freeze({ calculateSavings, SavingsPlanner });
})();
