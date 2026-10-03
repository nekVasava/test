# CalcNest RC2 — Dependable, Offline-First PWA & Calculator Suite

CalcNest is a production-grade, offline-first Progressive Web Application (PWA) and calculator suite featuring **20 specialized calculators** across financial, health, mathematical, and unit conversion domains.

---

## 🛠️ Prerequisites

* **Node.js**: v18.0.0 or higher (LTS recommended)
* **npm**: v9.0.0 or higher

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Type Check (Lint)
Runs static TypeScript type checking across all calculators and utilities without emitting files:
```bash
npm run lint
```

### 3. Run Automated Regression Tests
Executes the full **34-test suite** (14 core regression cases + 20 calculator unit tests) in the terminal:
```bash
npm run test
```

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Production & PWA Deployment

### Build Production Bundle
Generates optimized PWA static assets in `dist/`:
```bash
npm run build
```

### Preview Production Build Offline
```bash
npm run preview
```
Open the preview URL (typically `http://localhost:4173`) in Chrome DevTools to test Service Worker registration, PWA installation, and offline performance.

---

## 🧪 Automated Test Suite (34 Tests)

CalcNest includes an automated test runner covering:
* **Section 7 Minimum Regression Cases (14 Tests)**:
  * EMI zero-interest handling ($120k / 120 mo = $1,000/mo)
  * 40-Year loan schedule completeness (**480 monthly rows**)
  * Compound interest zero-rate ($10k + $500/mo * 5 yr = $40k) & frequency ordering ($FV_{\text{Monthly}} > FV_{\text{Quarterly}} > FV_{\text{Semi-Annual}} > FV_{\text{Annual}}$)
  * Strict date validation (rejects invalid dates like Feb 31, handles leap years)
  * Free tier 50-entry history cap enforcement
  * Storage fallback read-after-write consistency under simulated `localStorage` failures
  * CSV spreadsheet formula injection protection
  * PWA strict cache scoping (`calcnest-` prefix isolation)
* **20 Calculator Integration Tests**:
  * EMI, Compound Interest, Mortgage, Tip, Discount, Currency, BMI, BMR, Body Fat, Water Intake, Age & Date, Percentage, Scientific Math, Time Duration, GPA, Unit Conversion, Temperature, Fuel Cost, Data Transfer, and Number Base.

---

## 🛡️ Security & Privacy Features

* **Spreadsheet Formula Injection Protection**: All exported CSV cells starting with `=`, `+`, `-`, `@`, `\t`, or `\r` are safely escaped by prepending `'`.
* **Private & Local-First**: History, custom exchange rates, and Pro Demo settings are stored locally on-device. No data is sent to external servers.
* **Storage Fallback**: If browser `localStorage` is disabled or full, CalcNest automatically falls back to an in-memory storage manager to ensure zero crashes.
