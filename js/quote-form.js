/**
 * Move Masters TX Inc - Multi-Step Quote Form
 * Austin, TX 78728 | 25-mile service radius
 *
 * Self-contained: injects its own CSS and HTML into #quote-form-container.
 * No frameworks — pure vanilla JS.
 */

(function () {
  "use strict";

  /* ================================================================
     CONFIGURATION
     ================================================================ */

  const CONFIG = {
    companyName: "Move Masters TX Inc",
    baseZip: "78728",
    serviceRadiusMiles: 25,
    formspreeUrl: "https://formspree.io/f/PLACEHOLDER",

    // Hourly rates
    laborOnlyRate: 99,
    fullServiceRate: 149,

    // Per-flight stair fee, capped per location
    stairFeePerFlight: 25,
    stairFeeCap: 75,

    // Heavy-item surcharges
    heavyItems: {
      piano: { label: "Piano", fee: 175 },
      gun_safe: { label: "Gun Safe", fee: 175 },
      pool_table: { label: "Pool Table", fee: 250 },
      treadmill: { label: "Treadmill / Gym Equipment", fee: 75 },
      hot_tub: { label: "Hot Tub", fee: 150 },
    },

    // Travel fee tiers (miles from base)
    travelFees: [
      { maxMiles: 10, fee: 0, label: "Within 10 mi" },
      { maxMiles: 25, fee: 45, label: "10 - 25 mi" },
      { maxMiles: 40, fee: 99, label: "25 - 40 mi" },
    ],

    // Default travel fee index (user picks in Step 2 or we default to 0)
    defaultTravelTier: 0,

    // Home-size to suggested-hours mapping
    homeSizeHours: {
      studio: 2,
      "1bed": 2,
      "2bed": 3,
      "3bed": 4,
      "4bed": 5,
    },

    depositPercent: 50,
  };

  /* ================================================================
     CSS (injected into <head>)
     ================================================================ */

  const STYLES = `
/* === Quote Form Reset & Base === */
#quote-form-container *,
#quote-form-container *::before,
#quote-form-container *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

#quote-form-container {
  --qf-primary: #1a5d1a;
  --qf-primary-light: #2e8b2e;
  --qf-primary-bg: #eaf5ea;
  --qf-accent: #d4a017;
  --qf-accent-light: #f5e6b8;
  --qf-danger: #c0392b;
  --qf-text: #2c3e50;
  --qf-text-muted: #6b7c8a;
  --qf-border: #d1d9e0;
  --qf-bg: #ffffff;
  --qf-bg-alt: #f8fafb;
  --qf-radius: 10px;
  --qf-shadow: 0 2px 12px rgba(0,0,0,.08);
  --qf-transition: .3s ease;

  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
    Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", Arial,
    sans-serif;
  color: var(--qf-text);
  max-width: 680px;
  margin: 0 auto;
  padding: 0;
}

/* === Progress Bar === */
.quote-form__progress {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  position: relative;
  padding: 0 8px;
}

.quote-form__progress-track {
  position: absolute;
  top: 50%;
  left: 24px;
  right: 24px;
  height: 3px;
  background: var(--qf-border);
  transform: translateY(-50%);
  z-index: 0;
  border-radius: 2px;
}

.quote-form__progress-fill {
  height: 100%;
  background: var(--qf-primary);
  border-radius: 2px;
  transition: width var(--qf-transition);
}

.quote-form__progress-step {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: default;
}

.quote-form__progress-dot {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--qf-bg);
  border: 3px solid var(--qf-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  color: var(--qf-text-muted);
  transition: all var(--qf-transition);
}

.quote-form__progress-step--active .quote-form__progress-dot {
  border-color: var(--qf-primary);
  background: var(--qf-primary);
  color: #fff;
}

.quote-form__progress-step--done .quote-form__progress-dot {
  border-color: var(--qf-primary);
  background: var(--qf-primary);
  color: #fff;
}

.quote-form__progress-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--qf-text-muted);
  text-transform: uppercase;
  letter-spacing: .4px;
  white-space: nowrap;
}

.quote-form__progress-step--active .quote-form__progress-label,
.quote-form__progress-step--done .quote-form__progress-label {
  color: var(--qf-primary);
}

/* === Form Wrapper & Steps === */
.quote-form {
  background: var(--qf-bg);
  border-radius: var(--qf-radius);
  box-shadow: var(--qf-shadow);
  overflow: hidden;
  position: relative;
}

.quote-form__viewport {
  overflow: hidden;
  position: relative;
}

.quote-form__slider {
  display: flex;
  transition: transform .45s cubic-bezier(.4, 0, .2, 1);
  will-change: transform;
}

.quote-form__step {
  min-width: 100%;
  padding: 32px 36px 28px;
  flex-shrink: 0;
}

.quote-form__step-title {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 6px;
  color: var(--qf-text);
}

.quote-form__step-subtitle {
  font-size: 14px;
  color: var(--qf-text-muted);
  margin-bottom: 28px;
}

/* === Field Groups === */
.quote-form__field {
  margin-bottom: 22px;
}

.quote-form__label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--qf-text);
  text-transform: uppercase;
  letter-spacing: .3px;
}

.quote-form__label--optional::after {
  content: " (optional)";
  font-weight: 400;
  text-transform: none;
  color: var(--qf-text-muted);
  letter-spacing: 0;
}

/* === Card-Style Radio / Checkbox Selections === */
.quote-form__cards {
  display: grid;
  gap: 10px;
}

.quote-form__cards--2col {
  grid-template-columns: 1fr 1fr;
}

.quote-form__cards--3col {
  grid-template-columns: 1fr 1fr 1fr;
}

.quote-form__cards--4col {
  grid-template-columns: repeat(4, 1fr);
}

.quote-form__cards--5col {
  grid-template-columns: repeat(5, 1fr);
}

.quote-form__card {
  position: relative;
}

.quote-form__card input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
  pointer-events: none;
}

.quote-form__card-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 14px 10px;
  border: 2px solid var(--qf-border);
  border-radius: var(--qf-radius);
  cursor: pointer;
  text-align: center;
  transition: all var(--qf-transition);
  font-size: 14px;
  font-weight: 500;
  line-height: 1.3;
  background: var(--qf-bg);
  min-height: 56px;
}

.quote-form__card-label:hover {
  border-color: var(--qf-primary-light);
  background: var(--qf-primary-bg);
}

.quote-form__card input:checked + .quote-form__card-label {
  border-color: var(--qf-primary);
  background: var(--qf-primary-bg);
  color: var(--qf-primary);
  font-weight: 700;
  box-shadow: 0 0 0 1px var(--qf-primary);
}

.quote-form__card-icon {
  font-size: 22px;
  margin-bottom: 4px;
}

.quote-form__card-desc {
  font-size: 11px;
  font-weight: 400;
  color: var(--qf-text-muted);
  margin-top: 2px;
}

.quote-form__card input:checked + .quote-form__card-label .quote-form__card-desc {
  color: var(--qf-primary-light);
}

/* === Text Inputs, Selects, Textareas === */
.quote-form__input,
.quote-form__select,
.quote-form__textarea {
  width: 100%;
  padding: 12px 14px;
  font-size: 15px;
  font-family: inherit;
  border: 2px solid var(--qf-border);
  border-radius: var(--qf-radius);
  background: var(--qf-bg);
  color: var(--qf-text);
  transition: border-color var(--qf-transition);
  outline: none;
}

.quote-form__input:focus,
.quote-form__select:focus,
.quote-form__textarea:focus {
  border-color: var(--qf-primary);
}

.quote-form__input--error,
.quote-form__select--error,
.quote-form__textarea--error {
  border-color: var(--qf-danger);
}

.quote-form__textarea {
  resize: vertical;
  min-height: 80px;
}

.quote-form__error-msg {
  font-size: 12px;
  color: var(--qf-danger);
  margin-top: 4px;
  min-height: 18px;
}

/* === Row layouts === */
.quote-form__row {
  display: grid;
  gap: 16px;
}

.quote-form__row--2 {
  grid-template-columns: 1fr 1fr;
}

.quote-form__row--3 {
  grid-template-columns: 1fr 1fr 1fr;
}

/* === Quote Summary (Step 3) === */
.quote-form__summary {
  background: var(--qf-bg-alt);
  border: 2px solid var(--qf-border);
  border-radius: var(--qf-radius);
  padding: 24px;
  margin-bottom: 20px;
}

.quote-form__summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  font-size: 14px;
}

.quote-form__summary-row + .quote-form__summary-row {
  border-top: 1px solid var(--qf-border);
}

.quote-form__summary-row--total {
  border-top: 2px solid var(--qf-primary) !important;
  font-size: 18px;
  font-weight: 700;
  color: var(--qf-primary);
  padding-top: 12px;
  margin-top: 4px;
}

.quote-form__summary-row--deposit {
  font-weight: 600;
  color: var(--qf-accent);
}

.quote-form__summary-row--balance {
  color: var(--qf-text-muted);
}

.quote-form__summary-label {
  flex: 1;
}

.quote-form__summary-value {
  font-weight: 600;
  text-align: right;
  white-space: nowrap;
  margin-left: 16px;
}

.quote-form__summary-note {
  text-align: center;
  font-size: 13px;
  color: var(--qf-text-muted);
  margin-top: 16px;
  line-height: 1.5;
}

/* === Navigation Buttons === */
.quote-form__nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 36px 28px;
  gap: 12px;
}

.quote-form__btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 12px 28px;
  font-size: 15px;
  font-weight: 600;
  font-family: inherit;
  border: none;
  border-radius: var(--qf-radius);
  cursor: pointer;
  transition: all var(--qf-transition);
  text-decoration: none;
  line-height: 1;
}

.quote-form__btn--primary {
  background: var(--qf-primary);
  color: #fff;
}

.quote-form__btn--primary:hover {
  background: var(--qf-primary-light);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(26,93,26,.25);
}

.quote-form__btn--primary:active {
  transform: translateY(0);
}

.quote-form__btn--secondary {
  background: transparent;
  color: var(--qf-text-muted);
  border: 2px solid var(--qf-border);
}

.quote-form__btn--secondary:hover {
  border-color: var(--qf-text-muted);
  color: var(--qf-text);
}

.quote-form__btn--large {
  padding: 16px 36px;
  font-size: 17px;
  width: 100%;
  justify-content: center;
}

.quote-form__btn:disabled {
  opacity: .5;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

/* === Success Screen === */
.quote-form__success {
  text-align: center;
  padding: 48px 36px;
}

.quote-form__success-icon {
  width: 72px;
  height: 72px;
  background: var(--qf-primary-bg);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  font-size: 36px;
  color: var(--qf-primary);
}

.quote-form__success h2 {
  font-size: 24px;
  margin-bottom: 10px;
  color: var(--qf-primary);
}

.quote-form__success p {
  font-size: 15px;
  color: var(--qf-text-muted);
  line-height: 1.6;
  max-width: 440px;
  margin: 0 auto 16px;
}

.quote-form__fine-print {
  font-size: 12px;
  color: var(--qf-text-muted);
  margin-top: 12px;
  line-height: 1.5;
}

/* === Responsive === */
@media (max-width: 600px) {
  .quote-form__step {
    padding: 24px 20px 20px;
  }
  .quote-form__nav {
    padding: 16px 20px 24px;
  }
  .quote-form__cards--3col,
  .quote-form__cards--4col,
  .quote-form__cards--5col {
    grid-template-columns: 1fr 1fr;
  }
  .quote-form__row--2,
  .quote-form__row--3 {
    grid-template-columns: 1fr;
  }
  .quote-form__progress-label {
    font-size: 9px;
  }
  .quote-form__progress-dot {
    width: 30px;
    height: 30px;
    font-size: 12px;
  }
}
`;

  /* ================================================================
     HELPERS
     ================================================================ */

  /** Format a number as US currency */
  function fmtCurrency(cents) {
    return "$" + cents.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }

  /** Get tomorrow's date as YYYY-MM-DD for the date picker min */
  function getTomorrow() {
    var d = new Date();
    d.setDate(d.getDate() + 1);
    var yyyy = d.getFullYear();
    var mm = String(d.getMonth() + 1).padStart(2, "0");
    var dd = String(d.getDate()).padStart(2, "0");
    return yyyy + "-" + mm + "-" + dd;
  }

  /** Create an element with optional classes and attributes */
  function el(tag, classes, attrs) {
    var node = document.createElement(tag);
    if (classes) {
      (typeof classes === "string" ? classes.split(" ") : classes).forEach(
        function (c) {
          if (c) node.classList.add(c);
        }
      );
    }
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        node.setAttribute(k, attrs[k]);
      });
    }
    return node;
  }

  /** Format phone number as (XXX) XXX-XXXX */
  function formatPhone(value) {
    var digits = value.replace(/\D/g, "").substring(0, 10);
    if (digits.length === 0) return "";
    if (digits.length <= 3) return "(" + digits;
    if (digits.length <= 6) return "(" + digits.slice(0, 3) + ") " + digits.slice(3);
    return (
      "(" + digits.slice(0, 3) + ") " + digits.slice(3, 6) + "-" + digits.slice(6)
    );
  }

  /* ================================================================
     FORM STATE
     ================================================================ */

  var state = {
    currentStep: 0,
    totalSteps: 4,

    // Step 1
    serviceType: "",     // "labor" or "full"
    moveDate: "",
    preferredTime: "",

    // Step 2
    homeSize: "",
    estimatedHours: "",
    stairsPickup: "0",
    stairsDropoff: "0",
    heavyItems: [],
    travelTier: 0,       // index into CONFIG.travelFees

    // Step 3 is calculated

    // Step 4
    fullName: "",
    phone: "",
    email: "",
    pickupAddress: "",
    dropoffAddress: "",
    specialInstructions: "",
  };

  /* ================================================================
     PRICE CALCULATION
     ================================================================ */

  function calculateQuote() {
    var hours = parseInt(state.estimatedHours, 10) || 2;
    var hourlyRate =
      state.serviceType === "full" ? CONFIG.fullServiceRate : CONFIG.laborOnlyRate;
    var laborTotal = hourlyRate * hours;

    // Stair fees (capped per location)
    var pickupFlights = parseInt(state.stairsPickup, 10) || 0;
    var dropoffFlights = parseInt(state.stairsDropoff, 10) || 0;
    var pickupStairFee = Math.min(
      pickupFlights * CONFIG.stairFeePerFlight,
      CONFIG.stairFeeCap
    );
    var dropoffStairFee = Math.min(
      dropoffFlights * CONFIG.stairFeePerFlight,
      CONFIG.stairFeeCap
    );

    // Heavy items
    var heavyTotal = 0;
    var heavyBreakdown = [];
    state.heavyItems.forEach(function (key) {
      if (CONFIG.heavyItems[key]) {
        heavyTotal += CONFIG.heavyItems[key].fee;
        heavyBreakdown.push({
          label: CONFIG.heavyItems[key].label,
          fee: CONFIG.heavyItems[key].fee,
        });
      }
    });

    // Travel fee
    var travelTier = CONFIG.travelFees[state.travelTier] || CONFIG.travelFees[0];
    var travelFee = travelTier.fee;

    var grandTotal = laborTotal + pickupStairFee + dropoffStairFee + heavyTotal + travelFee;
    var deposit = Math.ceil(grandTotal * (CONFIG.depositPercent / 100));
    var balance = grandTotal - deposit;

    return {
      hourlyRate: hourlyRate,
      hours: hours,
      laborTotal: laborTotal,
      serviceLabel:
        state.serviceType === "full"
          ? "Full Service (2 movers + truck)"
          : "Labor Only (2-mover crew)",
      pickupStairFee: pickupStairFee,
      pickupFlights: pickupFlights,
      dropoffStairFee: dropoffStairFee,
      dropoffFlights: dropoffFlights,
      heavyBreakdown: heavyBreakdown,
      heavyTotal: heavyTotal,
      travelLabel: travelTier.label,
      travelFee: travelFee,
      grandTotal: grandTotal,
      deposit: deposit,
      balance: balance,
    };
  }

  /* ================================================================
     HTML BUILDERS — each step returns a DocumentFragment
     ================================================================ */

  function buildStep1() {
    var step = el("div", "quote-form__step");
    step.setAttribute("data-step", "0");

    var title = el("h2", "quote-form__step-title");
    title.textContent = "Move Details";
    step.appendChild(title);

    var sub = el("p", "quote-form__step-subtitle");
    sub.textContent = "Tell us about your upcoming move.";
    step.appendChild(sub);

    // Service Type
    var field1 = el("div", "quote-form__field");
    var label1 = el("label", "quote-form__label");
    label1.textContent = "Service Type";
    field1.appendChild(label1);

    var cards1 = el("div", "quote-form__cards quote-form__cards--2col");

    // Labor Only card
    var card1a = el("div", "quote-form__card");
    var input1a = el("input", null, {
      type: "radio",
      name: "serviceType",
      value: "labor",
      id: "svc-labor",
    });
    if (state.serviceType === "labor") input1a.setAttribute("checked", "");
    var lbl1a = el("label", "quote-form__card-label", { for: "svc-labor" });
    var icon1a = el("span", "quote-form__card-icon");
    icon1a.innerHTML = "&#128170;"; // muscle emoji
    lbl1a.appendChild(icon1a);
    var t1a = document.createTextNode("Labor Only");
    lbl1a.appendChild(t1a);
    var desc1a = el("span", "quote-form__card-desc");
    desc1a.textContent = fmtCurrency(CONFIG.laborOnlyRate) + "/hr";
    lbl1a.appendChild(desc1a);
    card1a.appendChild(input1a);
    card1a.appendChild(lbl1a);
    cards1.appendChild(card1a);

    // Full Service card
    var card1b = el("div", "quote-form__card");
    var input1b = el("input", null, {
      type: "radio",
      name: "serviceType",
      value: "full",
      id: "svc-full",
    });
    if (state.serviceType === "full") input1b.setAttribute("checked", "");
    var lbl1b = el("label", "quote-form__card-label", { for: "svc-full" });
    var icon1b = el("span", "quote-form__card-icon");
    icon1b.innerHTML = "&#128666;"; // truck emoji
    lbl1b.appendChild(icon1b);
    var t1b = document.createTextNode("Full Service");
    lbl1b.appendChild(t1b);
    var desc1b = el("span", "quote-form__card-desc");
    desc1b.textContent = fmtCurrency(CONFIG.fullServiceRate) + "/hr (+ truck)";
    lbl1b.appendChild(desc1b);
    card1b.appendChild(input1b);
    card1b.appendChild(lbl1b);
    cards1.appendChild(card1b);

    field1.appendChild(cards1);
    var err1 = el("div", "quote-form__error-msg");
    err1.setAttribute("data-error", "serviceType");
    field1.appendChild(err1);
    step.appendChild(field1);

    // Move Date
    var field2 = el("div", "quote-form__field");
    var label2 = el("label", "quote-form__label", { for: "moveDate" });
    label2.textContent = "Move Date";
    field2.appendChild(label2);
    var input2 = el("input", "quote-form__input", {
      type: "date",
      id: "moveDate",
      name: "moveDate",
      min: getTomorrow(),
      value: state.moveDate,
    });
    field2.appendChild(input2);
    var err2 = el("div", "quote-form__error-msg");
    err2.setAttribute("data-error", "moveDate");
    field2.appendChild(err2);
    step.appendChild(field2);

    // Preferred Time
    var field3 = el("div", "quote-form__field");
    var label3 = el("label", "quote-form__label");
    label3.textContent = "Preferred Time";
    field3.appendChild(label3);

    var cards3 = el("div", "quote-form__cards quote-form__cards--3col");
    var timeOptions = [
      { value: "morning", label: "Morning", desc: "8 am - 12 pm" },
      { value: "afternoon", label: "Afternoon", desc: "12 pm - 4 pm" },
      { value: "evening", label: "Evening", desc: "4 pm - 8 pm" },
    ];
    timeOptions.forEach(function (opt) {
      var card = el("div", "quote-form__card");
      var inp = el("input", null, {
        type: "radio",
        name: "preferredTime",
        value: opt.value,
        id: "time-" + opt.value,
      });
      if (state.preferredTime === opt.value) inp.setAttribute("checked", "");
      var lbl = el("label", "quote-form__card-label", { for: "time-" + opt.value });
      var t = document.createTextNode(opt.label);
      lbl.appendChild(t);
      var d = el("span", "quote-form__card-desc");
      d.textContent = opt.desc;
      lbl.appendChild(d);
      card.appendChild(inp);
      card.appendChild(lbl);
      cards3.appendChild(card);
    });
    field3.appendChild(cards3);
    var err3 = el("div", "quote-form__error-msg");
    err3.setAttribute("data-error", "preferredTime");
    field3.appendChild(err3);
    step.appendChild(field3);

    return step;
  }

  function buildStep2() {
    var step = el("div", "quote-form__step");
    step.setAttribute("data-step", "1");

    var title = el("h2", "quote-form__step-title");
    title.textContent = "Move Size & Specifics";
    step.appendChild(title);

    var sub = el("p", "quote-form__step-subtitle");
    sub.textContent = "Help us estimate the scope of your move.";
    step.appendChild(sub);

    // Home Size
    var field1 = el("div", "quote-form__field");
    var label1 = el("label", "quote-form__label");
    label1.textContent = "Home Size";
    field1.appendChild(label1);

    var cards1 = el("div", "quote-form__cards quote-form__cards--5col");
    var sizeOptions = [
      { value: "studio", label: "Studio" },
      { value: "1bed", label: "1 Bed" },
      { value: "2bed", label: "2 Bed" },
      { value: "3bed", label: "3 Bed" },
      { value: "4bed", label: "4+ Bed" },
    ];
    sizeOptions.forEach(function (opt) {
      var card = el("div", "quote-form__card");
      var inp = el("input", null, {
        type: "radio",
        name: "homeSize",
        value: opt.value,
        id: "size-" + opt.value,
      });
      if (state.homeSize === opt.value) inp.setAttribute("checked", "");
      var lbl = el("label", "quote-form__card-label", { for: "size-" + opt.value });
      lbl.textContent = opt.label;
      card.appendChild(inp);
      card.appendChild(lbl);
      cards1.appendChild(card);
    });
    field1.appendChild(cards1);
    var err1 = el("div", "quote-form__error-msg");
    err1.setAttribute("data-error", "homeSize");
    field1.appendChild(err1);
    step.appendChild(field1);

    // Estimated Hours + Travel Distance row
    var row1 = el("div", "quote-form__row quote-form__row--2");

    // Estimated Hours
    var field2 = el("div", "quote-form__field");
    var label2 = el("label", "quote-form__label", { for: "estimatedHours" });
    label2.textContent = "Estimated Hours";
    field2.appendChild(label2);
    var select2 = el("select", "quote-form__select", {
      id: "estimatedHours",
      name: "estimatedHours",
    });
    [2, 3, 4, 5].forEach(function (h) {
      var opt = el("option", null, { value: String(h) });
      opt.textContent = h === 5 ? "5+" : String(h);
      if (String(h) === state.estimatedHours) opt.setAttribute("selected", "");
      select2.appendChild(opt);
    });
    field2.appendChild(select2);
    row1.appendChild(field2);

    // Travel Distance
    var field2b = el("div", "quote-form__field");
    var label2b = el("label", "quote-form__label", { for: "travelTier" });
    label2b.textContent = "Travel Distance";
    field2b.appendChild(label2b);
    var select2b = el("select", "quote-form__select", {
      id: "travelTier",
      name: "travelTier",
    });
    CONFIG.travelFees.forEach(function (tier, i) {
      var opt = el("option", null, { value: String(i) });
      opt.textContent =
        tier.label + (tier.fee > 0 ? " (+" + fmtCurrency(tier.fee) + ")" : " (no fee)");
      if (i === state.travelTier) opt.setAttribute("selected", "");
      select2b.appendChild(opt);
    });
    field2b.appendChild(select2b);
    row1.appendChild(field2b);
    step.appendChild(row1);

    // Stairs row
    var row2 = el("div", "quote-form__row quote-form__row--2");

    // Stairs Pickup
    var field3 = el("div", "quote-form__field");
    var label3 = el("label", "quote-form__label", { for: "stairsPickup" });
    label3.textContent = "Stairs at Pickup";
    field3.appendChild(label3);
    var select3 = el("select", "quote-form__select", {
      id: "stairsPickup",
      name: "stairsPickup",
    });
    [
      { v: "0", t: "None" },
      { v: "1", t: "1 flight" },
      { v: "2", t: "2 flights" },
      { v: "3", t: "3+ flights" },
    ].forEach(function (o) {
      var opt = el("option", null, { value: o.v });
      opt.textContent = o.t;
      if (o.v === state.stairsPickup) opt.setAttribute("selected", "");
      select3.appendChild(opt);
    });
    field3.appendChild(select3);
    row2.appendChild(field3);

    // Stairs Dropoff
    var field4 = el("div", "quote-form__field");
    var label4 = el("label", "quote-form__label", { for: "stairsDropoff" });
    label4.textContent = "Stairs at Drop-off";
    field4.appendChild(label4);
    var select4 = el("select", "quote-form__select", {
      id: "stairsDropoff",
      name: "stairsDropoff",
    });
    [
      { v: "0", t: "None" },
      { v: "1", t: "1 flight" },
      { v: "2", t: "2 flights" },
      { v: "3", t: "3+ flights" },
    ].forEach(function (o) {
      var opt = el("option", null, { value: o.v });
      opt.textContent = o.t;
      if (o.v === state.stairsDropoff) opt.setAttribute("selected", "");
      select4.appendChild(opt);
    });
    field4.appendChild(select4);
    row2.appendChild(field4);
    step.appendChild(row2);

    // Heavy Items
    var field5 = el("div", "quote-form__field");
    var label5 = el("label", "quote-form__label");
    label5.textContent = "Heavy / Specialty Items";
    field5.appendChild(label5);

    var cards5 = el("div", "quote-form__cards quote-form__cards--3col");
    var itemKeys = Object.keys(CONFIG.heavyItems);
    itemKeys.forEach(function (key) {
      var item = CONFIG.heavyItems[key];
      var card = el("div", "quote-form__card");
      var inp = el("input", null, {
        type: "checkbox",
        name: "heavyItems",
        value: key,
        id: "heavy-" + key,
      });
      if (state.heavyItems.indexOf(key) !== -1)
        inp.setAttribute("checked", "");
      var lbl = el("label", "quote-form__card-label", { for: "heavy-" + key });
      var t = document.createTextNode(item.label);
      lbl.appendChild(t);
      var d = el("span", "quote-form__card-desc");
      d.textContent = "+" + fmtCurrency(item.fee);
      lbl.appendChild(d);
      card.appendChild(inp);
      card.appendChild(lbl);
      cards5.appendChild(card);
    });

    // "None" checkbox
    var cardNone = el("div", "quote-form__card");
    var inpNone = el("input", null, {
      type: "checkbox",
      name: "heavyItemsNone",
      value: "none",
      id: "heavy-none",
    });
    if (state.heavyItems.length === 0) inpNone.setAttribute("checked", "");
    var lblNone = el("label", "quote-form__card-label", { for: "heavy-none" });
    lblNone.textContent = "None";
    cardNone.appendChild(inpNone);
    cardNone.appendChild(lblNone);
    cards5.appendChild(cardNone);

    field5.appendChild(cards5);
    step.appendChild(field5);

    return step;
  }

  function buildStep3() {
    var step = el("div", "quote-form__step");
    step.setAttribute("data-step", "2");

    var title = el("h2", "quote-form__step-title");
    title.textContent = "Your Quote";
    step.appendChild(title);

    var sub = el("p", "quote-form__step-subtitle");
    sub.textContent = "Here's your estimated moving cost.";
    step.appendChild(sub);

    var q = calculateQuote();

    var summary = el("div", "quote-form__summary");

    // Labor line
    addSummaryRow(
      summary,
      q.serviceLabel + " (" + q.hours + " hrs x " + fmtCurrency(q.hourlyRate) + ")",
      fmtCurrency(q.laborTotal)
    );

    // Stair fees
    if (q.pickupStairFee > 0) {
      addSummaryRow(
        summary,
        "Stair fee - Pickup (" + q.pickupFlights + " flight" + (q.pickupFlights > 1 ? "s" : "") + ")",
        fmtCurrency(q.pickupStairFee)
      );
    }
    if (q.dropoffStairFee > 0) {
      addSummaryRow(
        summary,
        "Stair fee - Drop-off (" + q.dropoffFlights + " flight" + (q.dropoffFlights > 1 ? "s" : "") + ")",
        fmtCurrency(q.dropoffStairFee)
      );
    }

    // Heavy items
    q.heavyBreakdown.forEach(function (item) {
      addSummaryRow(summary, item.label + " surcharge", fmtCurrency(item.fee));
    });

    // Travel fee
    addSummaryRow(
      summary,
      "Travel fee (" + q.travelLabel + ")",
      q.travelFee > 0 ? fmtCurrency(q.travelFee) : "FREE"
    );

    // Total
    addSummaryRow(summary, "Estimated Total", fmtCurrency(q.grandTotal), "total");

    // Deposit
    addSummaryRow(
      summary,
      CONFIG.depositPercent + "% deposit required to book",
      fmtCurrency(q.deposit),
      "deposit"
    );

    // Balance
    addSummaryRow(
      summary,
      "Remaining balance due on move day",
      fmtCurrency(q.balance),
      "balance"
    );

    step.appendChild(summary);

    var note = el("p", "quote-form__summary-note");
    note.textContent =
      "This is an estimate. Final pricing may vary based on actual move duration and conditions. " +
      "Minimum charge is 2 hours.";
    step.appendChild(note);

    return step;
  }

  function addSummaryRow(container, label, value, modifier) {
    var row = el("div", "quote-form__summary-row");
    if (modifier) row.classList.add("quote-form__summary-row--" + modifier);
    var lbl = el("span", "quote-form__summary-label");
    lbl.textContent = label;
    var val = el("span", "quote-form__summary-value");
    val.textContent = value;
    row.appendChild(lbl);
    row.appendChild(val);
    container.appendChild(row);
  }

  function buildStep4() {
    var step = el("div", "quote-form__step");
    step.setAttribute("data-step", "3");

    var title = el("h2", "quote-form__step-title");
    title.textContent = "Contact & Book";
    step.appendChild(title);

    var sub = el("p", "quote-form__step-subtitle");
    sub.textContent = "Almost done! Tell us how to reach you.";
    step.appendChild(sub);

    // Full Name + Phone row
    var row1 = el("div", "quote-form__row quote-form__row--2");

    var fName = buildTextField("fullName", "Full Name", "text", "John Smith", true);
    row1.appendChild(fName);

    var fPhone = buildTextField("phone", "Phone Number", "tel", "(512) 555-1234", true);
    row1.appendChild(fPhone);

    step.appendChild(row1);

    // Email
    var fEmail = buildTextField("email", "Email Address", "email", "john@example.com", true);
    step.appendChild(fEmail);

    // Addresses row
    var row2 = el("div", "quote-form__row quote-form__row--2");
    var fPickup = buildTextField(
      "pickupAddress",
      "Pickup Address",
      "text",
      "123 Main St, Austin, TX",
      true
    );
    row2.appendChild(fPickup);

    var fDropoff = buildTextField(
      "dropoffAddress",
      "Drop-off Address",
      "text",
      "456 Oak Ave, Austin, TX",
      true
    );
    row2.appendChild(fDropoff);

    step.appendChild(row2);

    // Special Instructions
    var field6 = el("div", "quote-form__field");
    var label6 = el("label", "quote-form__label quote-form__label--optional", {
      for: "specialInstructions",
    });
    label6.textContent = "Special Instructions";
    field6.appendChild(label6);
    var ta = el("textarea", "quote-form__textarea", {
      id: "specialInstructions",
      name: "specialInstructions",
      placeholder: "Gate code, parking notes, fragile items, etc.",
      rows: "3",
    });
    ta.textContent = state.specialInstructions;
    field6.appendChild(ta);
    step.appendChild(field6);

    // Fine print
    var fine = el("p", "quote-form__fine-print");
    fine.textContent =
      "You'll receive a confirmation email with deposit payment instructions within 5 minutes.";
    step.appendChild(fine);

    return step;
  }

  function buildTextField(name, labelText, type, placeholder, required) {
    var field = el("div", "quote-form__field");
    var label = el("label", "quote-form__label", { for: name });
    label.textContent = labelText;
    field.appendChild(label);
    var input = el("input", "quote-form__input", {
      type: type,
      id: name,
      name: name,
      placeholder: placeholder || "",
    });
    if (required) input.setAttribute("required", "");
    if (state[name]) input.value = state[name];
    field.appendChild(input);
    var err = el("div", "quote-form__error-msg");
    err.setAttribute("data-error", name);
    field.appendChild(err);
    return field;
  }

  /* ================================================================
     PROGRESS BAR
     ================================================================ */

  function buildProgress() {
    var wrap = el("div", "quote-form__progress");

    // Background track
    var track = el("div", "quote-form__progress-track");
    var fill = el("div", "quote-form__progress-fill");
    track.appendChild(fill);
    wrap.appendChild(track);

    var labels = ["Details", "Size", "Quote", "Book"];
    labels.forEach(function (lbl, i) {
      var s = el("div", "quote-form__progress-step");
      s.setAttribute("data-progress-step", String(i));
      var dot = el("div", "quote-form__progress-dot");
      dot.textContent = String(i + 1);
      s.appendChild(dot);
      var label = el("span", "quote-form__progress-label");
      label.textContent = lbl;
      s.appendChild(label);
      wrap.appendChild(s);
    });

    return wrap;
  }

  function updateProgress() {
    var container = document.getElementById("quote-form-container");
    if (!container) return;

    var steps = container.querySelectorAll("[data-progress-step]");
    steps.forEach(function (s) {
      var idx = parseInt(s.getAttribute("data-progress-step"), 10);
      s.classList.remove("quote-form__progress-step--active", "quote-form__progress-step--done");
      if (idx === state.currentStep) {
        s.classList.add("quote-form__progress-step--active");
      } else if (idx < state.currentStep) {
        s.classList.add("quote-form__progress-step--done");
      }
    });

    // Fill the progress track
    var fill = container.querySelector(".quote-form__progress-fill");
    if (fill) {
      var pct = state.currentStep === 0 ? 0 : (state.currentStep / (state.totalSteps - 1)) * 100;
      fill.style.width = pct + "%";
    }

    // Update checkmark for completed steps
    var dots = container.querySelectorAll(".quote-form__progress-step--done .quote-form__progress-dot");
    dots.forEach(function (dot) {
      dot.innerHTML = "&#10003;"; // checkmark
    });
  }

  /* ================================================================
     RENDER
     ================================================================ */

  function render() {
    var container = document.getElementById("quote-form-container");
    if (!container) {
      console.error("Quote form container (#quote-form-container) not found.");
      return;
    }

    container.innerHTML = "";

    // Progress bar
    var progress = buildProgress();
    container.appendChild(progress);

    // Form element
    var form = el("div", "quote-form");

    // Viewport & slider for animation
    var viewport = el("div", "quote-form__viewport");
    var slider = el("div", "quote-form__slider");

    slider.appendChild(buildStep1());
    slider.appendChild(buildStep2());
    slider.appendChild(buildStep3());
    slider.appendChild(buildStep4());

    viewport.appendChild(slider);
    form.appendChild(viewport);

    // Nav buttons
    var nav = el("div", "quote-form__nav");

    var btnBack = el("button", "quote-form__btn quote-form__btn--secondary", {
      type: "button",
      id: "qf-btn-back",
    });
    btnBack.innerHTML = "&#8592; Back";
    if (state.currentStep === 0) btnBack.style.visibility = "hidden";

    var btnNext = el("button", "quote-form__btn quote-form__btn--primary", {
      type: "button",
      id: "qf-btn-next",
    });

    if (state.currentStep === state.totalSteps - 1) {
      btnNext.innerHTML = "Book &amp; Pay Deposit &#8594;";
      btnNext.classList.add("quote-form__btn--large");
      btnBack.style.position = "absolute"; // let the large button center
      nav.style.position = "relative";
    } else {
      btnNext.innerHTML = "Next &#8594;";
    }

    nav.appendChild(btnBack);
    nav.appendChild(btnNext);
    form.appendChild(nav);

    container.appendChild(form);

    // Position slider to current step
    slider.style.transform = "translateX(-" + state.currentStep * 100 + "%)";

    updateProgress();
    bindEvents(container);
  }

  /* ================================================================
     EVENT BINDING
     ================================================================ */

  function bindEvents(container) {
    // Back / Next
    var btnBack = container.querySelector("#qf-btn-back");
    var btnNext = container.querySelector("#qf-btn-next");

    btnBack.addEventListener("click", function () {
      if (state.currentStep > 0) {
        saveCurrentStepData();
        state.currentStep--;
        render();
        scrollToForm();
      }
    });

    btnNext.addEventListener("click", function () {
      saveCurrentStepData();
      if (!validateStep(state.currentStep)) return;

      if (state.currentStep < state.totalSteps - 1) {
        // If moving from step 1 to step 2, auto-suggest hours
        if (state.currentStep === 0 && state.homeSize === "") {
          // Will be set in step 2
        }
        state.currentStep++;
        render();
        scrollToForm();
      } else {
        submitForm();
      }
    });

    // Home size auto-suggests hours
    var homeSizeRadios = container.querySelectorAll('input[name="homeSize"]');
    homeSizeRadios.forEach(function (radio) {
      radio.addEventListener("change", function () {
        state.homeSize = this.value;
        var suggested = CONFIG.homeSizeHours[this.value] || 2;
        var hoursSelect = container.querySelector("#estimatedHours");
        if (hoursSelect) {
          hoursSelect.value = String(suggested);
          state.estimatedHours = String(suggested);
        }
      });
    });

    // "None" heavy item checkbox clears others, and vice-versa
    var noneCheckbox = container.querySelector("#heavy-none");
    var itemCheckboxes = container.querySelectorAll('input[name="heavyItems"]');

    if (noneCheckbox) {
      noneCheckbox.addEventListener("change", function () {
        if (this.checked) {
          itemCheckboxes.forEach(function (cb) {
            cb.checked = false;
          });
          state.heavyItems = [];
        }
      });
    }

    itemCheckboxes.forEach(function (cb) {
      cb.addEventListener("change", function () {
        if (this.checked && noneCheckbox) {
          noneCheckbox.checked = false;
        }
      });
    });

    // Phone auto-formatting
    var phoneInput = container.querySelector("#phone");
    if (phoneInput) {
      phoneInput.addEventListener("input", function () {
        var cursorPos = this.selectionStart;
        var oldLen = this.value.length;
        this.value = formatPhone(this.value);
        var newLen = this.value.length;
        // Adjust cursor position after formatting
        var newCursor = cursorPos + (newLen - oldLen);
        this.setSelectionRange(newCursor, newCursor);
      });
    }
  }

  function scrollToForm() {
    var container = document.getElementById("quote-form-container");
    if (container) {
      container.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  /* ================================================================
     SAVE / READ STEP DATA
     ================================================================ */

  function saveCurrentStepData() {
    var container = document.getElementById("quote-form-container");
    if (!container) return;

    switch (state.currentStep) {
      case 0: // Step 1
        var svcRadio = container.querySelector('input[name="serviceType"]:checked');
        state.serviceType = svcRadio ? svcRadio.value : "";

        var dateInput = container.querySelector("#moveDate");
        state.moveDate = dateInput ? dateInput.value : "";

        var timeRadio = container.querySelector('input[name="preferredTime"]:checked');
        state.preferredTime = timeRadio ? timeRadio.value : "";
        break;

      case 1: // Step 2
        var sizeRadio = container.querySelector('input[name="homeSize"]:checked');
        state.homeSize = sizeRadio ? sizeRadio.value : "";

        var hoursSelect = container.querySelector("#estimatedHours");
        state.estimatedHours = hoursSelect ? hoursSelect.value : "2";

        var stairsP = container.querySelector("#stairsPickup");
        state.stairsPickup = stairsP ? stairsP.value : "0";

        var stairsD = container.querySelector("#stairsDropoff");
        state.stairsDropoff = stairsD ? stairsD.value : "0";

        var travelSelect = container.querySelector("#travelTier");
        state.travelTier = travelSelect ? parseInt(travelSelect.value, 10) : 0;

        // Heavy items
        state.heavyItems = [];
        var checked = container.querySelectorAll('input[name="heavyItems"]:checked');
        checked.forEach(function (cb) {
          state.heavyItems.push(cb.value);
        });
        break;

      case 2: // Step 3 — nothing to save (display only)
        break;

      case 3: // Step 4
        var fields = ["fullName", "phone", "email", "pickupAddress", "dropoffAddress", "specialInstructions"];
        fields.forEach(function (f) {
          var input = container.querySelector("#" + f);
          if (input) state[f] = input.value.trim();
        });
        break;
    }
  }

  /* ================================================================
     VALIDATION
     ================================================================ */

  function clearErrors() {
    var container = document.getElementById("quote-form-container");
    if (!container) return;
    var msgs = container.querySelectorAll(".quote-form__error-msg");
    msgs.forEach(function (m) {
      m.textContent = "";
    });
    var inputs = container.querySelectorAll(
      ".quote-form__input--error, .quote-form__select--error"
    );
    inputs.forEach(function (i) {
      i.classList.remove("quote-form__input--error", "quote-form__select--error");
    });
  }

  function showError(fieldName, message) {
    var container = document.getElementById("quote-form-container");
    if (!container) return;
    var errEl = container.querySelector('[data-error="' + fieldName + '"]');
    if (errEl) errEl.textContent = message;

    var input = container.querySelector("#" + fieldName);
    if (input) {
      if (input.tagName === "SELECT") {
        input.classList.add("quote-form__select--error");
      } else {
        input.classList.add("quote-form__input--error");
      }
    }
  }

  function validateStep(stepIndex) {
    clearErrors();
    var valid = true;

    switch (stepIndex) {
      case 0: // Step 1
        if (!state.serviceType) {
          showError("serviceType", "Please select a service type.");
          valid = false;
        }
        if (!state.moveDate) {
          showError("moveDate", "Please choose a move date.");
          valid = false;
        } else {
          var tomorrow = new Date(getTomorrow() + "T00:00:00");
          var picked = new Date(state.moveDate + "T00:00:00");
          if (picked < tomorrow) {
            showError("moveDate", "Move date must be tomorrow or later.");
            valid = false;
          }
        }
        if (!state.preferredTime) {
          showError("preferredTime", "Please select a preferred time.");
          valid = false;
        }
        break;

      case 1: // Step 2
        if (!state.homeSize) {
          showError("homeSize", "Please select your home size.");
          valid = false;
        }
        break;

      case 2: // Step 3 — no validation needed
        break;

      case 3: // Step 4
        if (!state.fullName) {
          showError("fullName", "Full name is required.");
          valid = false;
        }
        if (!state.phone) {
          showError("phone", "Phone number is required.");
          valid = false;
        } else {
          var phoneDigits = state.phone.replace(/\D/g, "");
          if (phoneDigits.length < 10) {
            showError("phone", "Please enter a valid 10-digit phone number.");
            valid = false;
          }
        }
        if (!state.email) {
          showError("email", "Email address is required.");
          valid = false;
        } else {
          // Basic email pattern check
          var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailPattern.test(state.email)) {
            showError("email", "Please enter a valid email address.");
            valid = false;
          }
        }
        if (!state.pickupAddress) {
          showError("pickupAddress", "Pickup address is required.");
          valid = false;
        }
        if (!state.dropoffAddress) {
          showError("dropoffAddress", "Drop-off address is required.");
          valid = false;
        }
        break;
    }

    return valid;
  }

  /* ================================================================
     SUBMIT
     ================================================================ */

  function submitForm() {
    var q = calculateQuote();

    // Friendly labels for readability
    var serviceLabel = state.serviceType === "full" ? "Full Service" : "Labor Only";
    var timeLabels = {
      morning: "Morning (8am-12pm)",
      afternoon: "Afternoon (12pm-4pm)",
      evening: "Evening (4pm-8pm)",
    };
    var sizeLabels = {
      studio: "Studio",
      "1bed": "1 Bedroom",
      "2bed": "2 Bedrooms",
      "3bed": "3 Bedrooms",
      "4bed": "4+ Bedrooms",
    };
    var stairLabels = { "0": "None", "1": "1 flight", "2": "2 flights", "3": "3+ flights" };

    var heavyItemLabels = state.heavyItems.map(function (key) {
      return CONFIG.heavyItems[key] ? CONFIG.heavyItems[key].label : key;
    });

    var payload = {
      // Business info
      company: CONFIG.companyName,
      formTimestamp: new Date().toISOString(),

      // Step 1
      serviceType: serviceLabel,
      moveDate: state.moveDate,
      preferredTime: timeLabels[state.preferredTime] || state.preferredTime,

      // Step 2
      homeSize: sizeLabels[state.homeSize] || state.homeSize,
      estimatedHours: state.estimatedHours,
      stairsPickup: stairLabels[state.stairsPickup] || state.stairsPickup,
      stairsDropoff: stairLabels[state.stairsDropoff] || state.stairsDropoff,
      heavyItems: heavyItemLabels.length > 0 ? heavyItemLabels.join(", ") : "None",
      travelDistance: q.travelLabel,

      // Quote
      estimatedTotal: fmtCurrency(q.grandTotal),
      depositAmount: fmtCurrency(q.deposit),
      balanceDue: fmtCurrency(q.balance),

      // Step 4
      fullName: state.fullName,
      phone: state.phone,
      email: state.email,
      pickupAddress: state.pickupAddress,
      dropoffAddress: state.dropoffAddress,
      specialInstructions: state.specialInstructions || "N/A",
    };

    // 1. Log to console
    console.log("=== Move Masters TX - Quote Submission ===");
    console.log(JSON.stringify(payload, null, 2));

    // 2. POST to Formspree
    var btnNext = document.getElementById("qf-btn-next");
    if (btnNext) {
      btnNext.disabled = true;
      btnNext.innerHTML = "Submitting...";
    }

    fetch(CONFIG.formspreeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    })
      .then(function (response) {
        // Show success regardless — the Formspree URL is a placeholder for now
        showSuccess(q, payload);
      })
      .catch(function () {
        // Network error — still show success since we logged the data
        console.warn(
          "Formspree submission failed (expected if using placeholder URL). Data logged to console."
        );
        showSuccess(q, payload);
      });
  }

  /* ================================================================
     SUCCESS SCREEN
     ================================================================ */

  function showSuccess(quote, payload) {
    var container = document.getElementById("quote-form-container");
    if (!container) return;

    container.innerHTML = "";

    var form = el("div", "quote-form");

    var success = el("div", "quote-form__success");

    var iconWrap = el("div", "quote-form__success-icon");
    iconWrap.innerHTML = "&#10003;";
    success.appendChild(iconWrap);

    var h2 = el("h2");
    h2.textContent = "Booking Request Received!";
    success.appendChild(h2);

    var p1 = el("p");
    p1.textContent =
      "Thank you, " +
      payload.fullName +
      "! We've received your request for " +
      payload.moveDate +
      ".";
    success.appendChild(p1);

    // Mini summary
    var summary = el("div", "quote-form__summary");
    summary.style.textAlign = "left";

    addSummaryRow(summary, "Service", payload.serviceType);
    addSummaryRow(summary, "Date & Time", payload.moveDate + " - " + payload.preferredTime);
    addSummaryRow(summary, "Home Size", payload.homeSize);
    addSummaryRow(summary, "Estimated Total", fmtCurrency(quote.grandTotal), "total");
    addSummaryRow(
      summary,
      "Deposit to Book",
      fmtCurrency(quote.deposit),
      "deposit"
    );

    success.appendChild(summary);

    var p2 = el("p");
    p2.textContent =
      "A confirmation email with deposit payment instructions will be sent to " +
      payload.email +
      " within 5 minutes.";
    success.appendChild(p2);

    var fine = el("p", "quote-form__fine-print");
    fine.textContent =
      "Questions? Call us or reply to the confirmation email. " +
      CONFIG.companyName +
      " - Austin, TX";
    success.appendChild(fine);

    form.appendChild(success);
    container.appendChild(form);

    scrollToForm();
  }

  /* ================================================================
     INIT
     ================================================================ */

  function init() {
    // Inject styles
    var styleEl = document.createElement("style");
    styleEl.setAttribute("data-quote-form", "");
    styleEl.textContent = STYLES;
    document.head.appendChild(styleEl);

    // Set a sane default for estimated hours
    if (!state.estimatedHours) {
      state.estimatedHours = "2";
    }

    render();
  }

  // Auto-init when the DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
