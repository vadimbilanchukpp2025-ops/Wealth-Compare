/**
 * Wealth Compare — feedback form: client-side validation, UI states and the success modal.
 *
 * Nothing is sent to a server: on a valid submit the form shows a "simulated success"
 * dialog and resets. Every user value is written to the page with textContent only.
 */
class FeedbackForm {
  // RegEx rules. Each one encodes this form's rule, not "every valid value in the world".
  static REGEX_NAME = /^\p{L}(?:[\p{L}' ’ʼ-]*\p{L})?$/u; // letters (any alphabet), inner space / apostrophe / hyphen
  static REGEX_EMAIL = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;
  static REGEX_PHONE = /^\+380\d{9}$/; // strictly +380 and exactly 9 digits

  static NAME_MIN = 2;
  static NAME_MAX = 50;
  static MESSAGE_MIN = 10;
  static MESSAGE_MAX = 1000;

  // Tailwind class sets for the field states. Exactly one set is applied at a time.
  static STATE_CLASSES = {
    normal: ["border-line", "bg-white", "hover:border-muted", "focus:border-forest", "focus:ring-forest/20"],
    error: ["border-red-500", "bg-red-50", "hover:border-red-600", "focus:border-red-500", "focus:ring-red-500/20"],
    success: ["border-green-600", "bg-white", "hover:border-green-700", "focus:border-green-600", "focus:ring-green-600/20"],
  };

  constructor(form) {
    this.form = form;
    this.submitButton = form.querySelector("#submitButton");
    this.status = form.querySelector("#formStatus");
    this.counter = form.querySelector("#messageCounter");
    this.phoneFix = form.querySelector("#phoneFix");
    this.agreementBox = form.querySelector("#agreementBox");
    this.modal = document.querySelector("#successModal");
    this.modalClose = document.querySelector("#successClose");
    this.isSubmitting = false;
    this.pressingSubmit = false;

    // id -> validator. Order = order of fields on screen (used to focus the first error).
    this.validators = {
      username: () => this.validateName(),
      email: () => this.validateEmail(),
      phone: () => this.validatePhone(),
      message: () => this.validateMessage(),
      agreement: () => this.validateAgreement(),
    };
    // A field is "touched" once the user typed in it and left it, or tried to submit.
    this.touched = new Set();
    this.dirty = new Set();

    this.bindEvents();
    this.updateCounter();
  }

  field(id) {
    return this.form.elements.namedItem(id);
  }

  bindEvents() {
    for (const id of ["username", "email", "phone", "message"]) {
      const input = this.field(id);
      input.addEventListener("input", () => this.handleInput(id));
      input.addEventListener("blur", () => this.handleBlur(id));
    }
    this.field("agreement").addEventListener("change", () => {
      this.touched.add("agreement");
      this.validateAgreement();
    });
    this.phoneFix.addEventListener("click", () => this.applyPhoneSuggestion());
    // Pressing "Надіслати" blurs the last field first. If that blur inserted an error text
    // above the button, the button would move away from the pointer and the click would be lost.
    // So blur-validation is skipped while the button is pressed: submit validates everything anyway.
    this.submitButton.addEventListener("pointerdown", () => { this.pressingSubmit = true; });
    document.addEventListener("pointerup", () => setTimeout(() => { this.pressingSubmit = false; }, 0));
    document.addEventListener("pointercancel", () => { this.pressingSubmit = false; });
    this.form.addEventListener("submit", (event) => this.handleSubmit(event));

    this.modalClose.addEventListener("click", () => this.closeModal());
    // Escape on a modal <dialog> fires "cancel"; we close through our own method to restore focus.
    this.modal.addEventListener("cancel", (event) => {
      event.preventDefault();
      this.closeModal();
    });
    // Click on the dimmed backdrop (the dialog element itself, outside the inner panel).
    this.modal.addEventListener("click", (event) => {
      if (event.target === this.modal) this.closeModal();
    });
  }

  // ---------- dynamic validation ----------

  handleInput(id) {
    this.dirty.add(id);
    if (id === "message") this.updateCounter();
    if (this.touched.has(id)) {
      this.validators[id]();
      return;
    }
    // Not touched yet: never show red while the user is still typing for the first time,
    // but confirm a value as soon as it becomes valid.
    const { valid } = this.check(id);
    if (valid) this.showSuccess(id);
    else this.clearError(id);
  }

  handleBlur(id) {
    if (!this.dirty.has(id)) return; // tabbing through an empty field is not an error yet
    if (this.pressingSubmit) return; // handleSubmit will validate this field in a moment
    this.touched.add(id);
    this.validators[id]();
  }

  // ---------- rules (pure: value -> { valid, message }) ----------

  check(id) {
    const value = this.field(id).value;
    switch (id) {
      case "username": return this.checkName(value.trim());
      case "email": return this.checkEmail(value.trim());
      case "phone": return this.checkPhone(value.trim());
      case "message": return this.checkMessage(value.trim());
      default: return { valid: this.field(id).checked, message: "Підтвердьте згоду з політикою конфіденційності." };
    }
  }

  checkName(value) {
    const length = [...value].length; // counts code points, so emoji / Cyrillic are 1 character each
    if (length === 0) return { valid: false, message: "Введіть ім’я." };
    if (length < FeedbackForm.NAME_MIN) return { valid: false, message: "Ім’я має містити щонайменше 2 символи." };
    if (length > FeedbackForm.NAME_MAX) return { valid: false, message: "Ім’я має бути не довшим за 50 символів." };
    if (!FeedbackForm.REGEX_NAME.test(value))
      return { valid: false, message: "Використовуйте лише літери, пробіл, апостроф або дефіс." };
    return { valid: true };
  }

  checkEmail(value) {
    if (value === "") return { valid: false, message: "Введіть електронну пошту." };
    if (!FeedbackForm.REGEX_EMAIL.test(value) || value.includes(".."))
      return { valid: false, message: "Введіть коректну електронну адресу, наприклад user@gmail.com." };
    return { valid: true };
  }

  checkPhone(value) {
    if (value === "") return { valid: false, message: "Введіть номер телефону." };
    if (!FeedbackForm.REGEX_PHONE.test(value))
      return { valid: false, message: "Номер має бути у форматі +380XXXXXXXXX: +380 і рівно 9 цифр без пробілів." };
    return { valid: true };
  }

  checkMessage(value) {
    const length = [...value].length;
    if (length === 0) return { valid: false, message: "Напишіть повідомлення." };
    if (length < FeedbackForm.MESSAGE_MIN)
      return { valid: false, message: `Повідомлення занадто коротке: ${length} з мінімум 10 символів.` };
    if (length > FeedbackForm.MESSAGE_MAX)
      return { valid: false, message: `Повідомлення задовге: ${length} символів, максимум 1000.` };
    return { valid: true };
  }

  // ---------- validators (rule + UI) ----------

  apply(id) {
    const { valid, message } = this.check(id);
    if (valid) this.showSuccess(id);
    else this.showError(id, message);
    return valid;
  }

  validateName() { return this.apply("username"); }
  validateEmail() { return this.apply("email"); }
  validateMessage() { return this.apply("message"); }

  validatePhone() {
    const valid = this.apply("phone");
    this.updatePhoneSuggestion(valid);
    return valid;
  }

  validateAgreement() {
    const valid = this.apply("agreement");
    this.agreementBox.classList.toggle("border-red-500", !valid);
    this.agreementBox.classList.toggle("bg-red-50", !valid);
    this.agreementBox.classList.toggle("border-transparent", valid);
    return valid;
  }

  // ---------- phone edge cases: suggest, never rewrite silently ----------

  suggestPhone(raw) {
    const compact = raw.replace(/[\s()\-]/g, ""); // drop spaces, brackets, hyphens
    let candidate = compact;
    if (/^0\d{9}$/.test(compact)) candidate = `+38${compact}`; // 0501234567 -> +380501234567
    else if (/^380\d{9}$/.test(compact)) candidate = `+${compact}`; // 380501234567 -> +380501234567
    return FeedbackForm.REGEX_PHONE.test(candidate) && candidate !== raw.trim() ? candidate : null;
  }

  updatePhoneSuggestion(valid) {
    const suggestion = valid ? null : this.suggestPhone(this.field("phone").value);
    this.phoneFix.classList.toggle("hidden", !suggestion);
    this.phoneFix.dataset.value = suggestion || "";
    this.phoneFix.textContent = suggestion ? `Виправити на ${suggestion}` : "";
  }

  applyPhoneSuggestion() {
    const input = this.field("phone");
    input.value = this.phoneFix.dataset.value;
    this.touched.add("phone");
    this.validatePhone();
    input.focus();
  }

  // ---------- UI state helpers ----------

  setState(id, state) {
    const input = this.field(id);
    const all = Object.values(FeedbackForm.STATE_CLASSES).flat();
    if (input.type !== "checkbox") {
      input.classList.remove(...all);
      input.classList.add(...FeedbackForm.STATE_CLASSES[state]);
      const icon = input.parentElement.querySelector("[data-success-icon]");
      if (icon) icon.classList.toggle("hidden", state !== "success");
    }
    input.setAttribute("aria-invalid", String(state === "error"));
  }

  showError(id, message) {
    this.setState(id, "error");
    const error = this.form.querySelector(`#${id}Error`);
    error.textContent = message;
    error.classList.remove("hidden");
  }

  showSuccess(id) {
    this.hideErrorText(id);
    this.setState(id, "success");
  }

  clearError(id) {
    this.hideErrorText(id);
    this.setState(id, "normal");
    if (id === "phone") this.updatePhoneSuggestion(true);
    if (id === "agreement") {
      this.agreementBox.classList.remove("border-red-500", "bg-red-50");
      this.agreementBox.classList.add("border-transparent");
    }
  }

  hideErrorText(id) {
    const error = this.form.querySelector(`#${id}Error`);
    error.textContent = "";
    error.classList.add("hidden");
  }

  updateCounter() {
    const length = [...this.field("message").value.trim()].length;
    this.counter.textContent = `${length} / ${FeedbackForm.MESSAGE_MAX}`;
    this.counter.classList.toggle("text-red-700", length > FeedbackForm.MESSAGE_MAX);
    this.counter.classList.toggle("text-muted", length <= FeedbackForm.MESSAGE_MAX);
  }

  // ---------- submit and modal ----------

  handleSubmit(event) {
    event.preventDefault(); // no real request: there is no backend in this lab
    if (this.isSubmitting) return; // guards against a fast double click / double Enter

    const ids = Object.keys(this.validators);
    ids.forEach((id) => this.touched.add(id));
    const invalid = ids.filter((id) => !this.validators[id]());

    if (invalid.length > 0) {
      this.status.textContent = invalid.length === 1
        ? "Виправте 1 поле, позначене червоним."
        : `Виправте поля, позначені червоним: ${invalid.length}.`;
      this.field(invalid[0]).focus();
      return;
    }

    this.isSubmitting = true;
    this.submitButton.disabled = true;
    this.status.textContent = "";
    this.openModal();
    this.resetForm();
  }

  resetForm() {
    this.form.reset();
    for (const id of Object.keys(this.validators)) this.clearError(id);
    this.touched.clear();
    this.dirty.clear();
    this.updateCounter();
  }

  openModal() {
    this.modal.showModal(); // native modal: page behind becomes inert, focus moves inside
    this.modalClose.focus();
  }

  closeModal() {
    if (!this.modal.open) return;
    this.modal.close();
    this.isSubmitting = false;
    this.submitButton.disabled = false;
    this.submitButton.focus(); // focus returns to where the user was
  }
}

const feedbackForm = document.querySelector("#feedbackForm");
if (feedbackForm) new FeedbackForm(feedbackForm);
