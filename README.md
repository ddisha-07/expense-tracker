# Montra — "Track less. Understand more."

Montra is an ultra-premium, privacy-first mobile-friendly website application designed for students and young adults to manage daily spending, budgets, and financial habits. 

To completely bypass local system disk space limits (`ENOSPC`) and avoid native binary rebuild conflicts, Montra is engineered as an **ultra-premium, zero-dependency Single-Page Application (SPA)**. It relies on standard browser technologies, loading instantly with **zero installation lag**.

---

## Catchy UI & Design Inspiration

The Montra visual and operational experience draws inspiration from the finest finance trackers in the industry:
1. **Wallet-Inspired Stats Grids**: Beautiful glassmorphic summary cards displaying balance, inflow, outflow, and progress caps.
2. **Spendee-Inspired Clean Dashboard**: Obsidian-dark backdrop with vibrant radial glowing visual accents, and customized neon progress borders.
3. **YNAB-Inspired Budgeting**: Category-wise budgeting targets with dynamic slider alerts that visualizes allowance thresholds.
4. **Monefy-Inspired Fast entry (maximum 2-3 taps)**: Slides open an overlay grid featuring 8 student categories and a responsive custom numerical keyboard pad (numbers 1-9, 0, clear, backspace). Tapping an amount and selecting a category logs it immediately in a single screen!
5. **Axio/Walnut-Inspired Smart Insights**: Client-side queries engine parsing transaction categories to trigger student spending alerts.

---

## Modular Zero-Dependency Visualizations

Instead of heavy external packages, Montra features **custom reactive SVG charts** built natively:
- **Dynamic Daily Trend Line**: Generates smooth cubic bezier paths plotting 7-day comparative history of credit and debit levels with floating tooltip highlights.
- **Proportional Category Donut**: An animated circle slice wheel demonstrating spending ratios, featuring interactive legend mouse-enters that display category amounts inside the donut center.
- **Weekday Average Bar Columns**: SVG rounded columns indicating daily expenditures.

---

## File Structure

- [index.html](file:///c:/Users/Shekhar/Downloads/expense-tracker/index.html): Houses the stepped onboarding track, Spendee dashboard tab layout, fixed obligations checklists, and rapid entry numpad panels.
- [css/style.css](file:///c:/Users/Shekhar/Downloads/expense-tracker/css/style.css): Holds custom property variable themes (Deep Obsidian vs Alabaster Light), glass blur formulas, custom scrollbars, and keyframe slide transitions.
- [js/app.js](file:///c:/Users/Shekhar/Downloads/expense-tracker/js/app.js): Drives the local stepper transitions, numpad calculations, rules insights alerts, SVG grid coordinate plotters, and backup downloads.
- [package.json](file:///c:/Users/Shekhar/Downloads/expense-tracker/package.json): Minimal local static server configurations.

---

## Quick Start & Dev Server

1. **Launch Server**:
   To run a local static server, open a terminal in the folder and execute:
   ```bash
   npm install && npm run dev
   ```
2. **Zero-Setup Launch**:
   Alternatively, you can double-click **`index.html`** or open the file directly in any modern web browser. It operates flawlessly with no local package footprint!
