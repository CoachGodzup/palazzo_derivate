---
name: palazzo-demo
description: Use when implementing, debugging or reviewing Il Palazzo delle Derivate, demo-1, Phaser rooms, MathLive answers, SymPy verification, puzzle JSON or local game progress.
---

# Palazzo delle Derivate — Demo workflow

Use this skill for gameplay and math changes in this repository.

## Before editing

1. Read `AGENTS.md` and `docs/DEMO_SCOPE.md`.
2. Check the current contract in `client/types.ts` and `server/app/schemas.py`.
3. Keep the three services separate: Phaser renders and animates; HTML/MathLive collects input; FastAPI/SymPy validates.
4. Treat `content/demo.json` as the only source of puzzle content. Do not duplicate formulas or expected answers in the client.

## Implementing a puzzle or mechanism

1. Add or modify the JSON content and validate it through the backend schema.
2. Confirm `/api/demo` exposes only public fields.
3. Test the derivative from the original function, not the stored answer.
4. Add at least one expanded and one non-simplified equivalent answer to backend tests.
5. Connect a correct result to a visible environmental reaction and update the local progress exactly once.
6. Check locked, active and solved states both on canvas hotspots and HTML mechanism buttons.
7. Add Playwright coverage for the new flow where practical.

## Math input

Send `answerField.getValue("ascii-math")` to the verify endpoint. Supported syntax includes `^`, `*`, implicit multiplication, `/`, parentheses, `sqrt`, `exp`, `ln`, `sin`, and `cos`. Never send the LaTeX value to the symbolic parser and never add a client-side string comparison.

Suggested demo checks:

- `6x-5` and `3*2*x-5`
- `9x^2+6x-2` and `6x(x+1)+3x^2-2`
- `3/(2sqrt(x))+3sqrt(x)` and `(3+6x)/(2sqrt(x))`
- incorrect `6x`, the product misconception `6x`, syntax `6x+`, unsupported `tan(x)`

A diagnostic hint is appropriate only if independently verified; otherwise show the generic incorrect response.

## Browser review

Start with `npm run dev`, then use Playwright at desktop 1440×900 and portrait 390×844. Exercise the real backend and MathLive, not API mocks. Test keyboard operation, hints, reload persistence, final door and reset. Capture `artifacts/demo-desktop.png`, `artifacts/demo-mobile.png` and `artifacts/demo-complete.png` when completing a review build.

Run `npm run build` and `npm run test:local` before reporting completion locally: API and unit suites run in full, while E2E executes only the desktop `@smoke` subset. The full E2E matrix runs in GitHub Actions (`.github/workflows/ci.yml`); use `npm run test:e2e` locally only when CI parity is needed. If browser binaries are missing, install Chromium with `PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright npx playwright install chromium`; keep dependencies inside the project.

## Finish

Report what is playable, test results, startup URL and any remaining limitations. Do not claim the campaign, accounts, teacher dashboard or server persistence are implemented in demo-1.
