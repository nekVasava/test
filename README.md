# CalcNest 1.0.0-rc.2 (RC2) — Offline-First Calculator Suite

CalcNest is a production-grade, offline-first Progressive Web Application (PWA) and calculator suite featuring **20 specialized calculators** across financial, health, mathematical, and unit conversion domains.

---

## 🛠️ Prerequisites

* **Node.js**: v20.19.0 or higher, or v22.12.0 or higher (LTS recommended)
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

## 🧪 Automated Test Suite (41 Tests)

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
* **7 Accessibility Regression Tests**:
  * Named calculator icon actions, modal semantics, keyboard-operable history restoration, financial disclaimer semantics, Escape dismissal, and forward/reverse Tab wrapping.

---

## 🛡️ Security & Privacy Features

* **Spreadsheet Formula Injection Protection**: All exported CSV cells starting with `=`, `+`, `-`, `@`, `\t`, or `\r` are safely escaped by prepending `'`.
* **Local calculation data**: Calculator inputs are processed in the browser. History, custom exchange rates, and Pro Demo settings use this browser's local storage. The app has no calculation API or server endpoint in this release.
* **Sharing and export**: Share links contain the selected calculator and its input values. The Share action copies that link to the clipboard; values are sent to others only if you share or open the link. CSV export downloads a copy of history to the device.
* **Hosting requests**: The app and its static assets are served by GitHub Pages. As with any hosted website, GitHub may process ordinary connection data such as IP address, browser details, and requested files under its privacy statement.
* **Storage Fallback**: If browser `localStorage` is disabled or full, CalcNest automatically falls back to an in-memory storage manager to ensure zero crashes.

## Release Details

CalcNest uses Semantic Versioning. Release candidates use the `MAJOR.MINOR.PATCH-rc.N` format; this release is `1.0.0-rc.2`. The PWA manifest has no version field; the package version and this README are the release identity.

The privacy disclosure served with the app is [`privacy.html`](public/privacy.html). For support or bug reports, use [GitHub Issues](https://github.com/nekVasava/test/issues). This repository does not publish a support email address.

## GitHub Pages Base Path

Local builds use `/` by default for the local preview. The Pages workflow sets `VITE_BASE_PATH=/test/`, which scopes the generated manifest, icons, assets, and service worker to this repository's project-site path.
