import { expect, test, type Page } from "@playwright/test";

async function enterCourtyard(page: Page): Promise<void> {
  await page.goto("/");
  const welcome = page.locator("#welcome-dialog");
  await expect(welcome).toBeVisible();
  await page.getByRole("button", { name: /Entra nella corte/ }).click();
  await expect(welcome).not.toBeVisible();
}

async function openPuzzle(page: Page, title: RegExp): Promise<void> {
  await page.getByRole("button", { name: title }).click();
  await expect(page.locator("#puzzle-dialog")).toBeVisible();
}

async function answer(page: Page, latex: string): Promise<void> {
  await page.locator("#answer-field").evaluate((field, value) => {
    (field as HTMLElement & { setValue(value: string): void }).setValue(value);
  }, latex);
  await page.getByRole("button", { name: /Verifica e attiva/ }).click();
}

async function solve(page: Page, title: RegExp, latex: string): Promise<void> {
  await openPuzzle(page, title);
  await answer(page, latex);
  await expect(page.locator("#verification-feedback")).toContainText("Esatto");
  await expect(page.locator("#answer-row")).toHaveClass(/is-correct/);
  await expect(page.locator("#puzzle-dialog")).not.toBeVisible({ timeout: 5_000 });
}

test.describe("vertical slice demo-1", () => {
  test("ingresso, blocco sequenziale e chiusura del pannello", async ({ page }) => {
    await enterCourtyard(page);
    await expect(page.getByRole("heading", { name: /Ridai movimento/ })).toBeVisible();
    await expect(page.locator("#hud-score")).toHaveText("0");
    await expect(page.getByRole("button", { name: /Ingranaggi gemelli/ })).toBeDisabled();

    await openPuzzle(page, /Primo sigillo/);
    await page.keyboard.press("Escape");
    await expect(page.locator("#puzzle-dialog")).not.toBeVisible();
    await expect(page.locator("#mechanism-list").getByRole("button").first()).toBeFocused();
  });

  test("errore, sintassi e indizio restano nel pannello senza bloccare @smoke", async ({
    page,
  }) => {
    await enterCourtyard(page);
    await openPuzzle(page, /Primo sigillo/);

    await answer(page, "x");
    const feedback = page.locator("#verification-feedback");
    await expect(feedback).toContainText("non è equivalente");
    await expect(page.locator("#answer-row")).toHaveClass(/is-error/);
    await expect(page.locator("#puzzle-dialog")).toBeVisible();

    await answer(page, "6x+");
    await expect(feedback).toContainText("sintassi");

    await page.getByRole("button", { name: /Rivela il primo indizio/ }).click();
    await expect(page.locator("#hint-count")).toHaveText("1 / 3");
    await expect(page.locator("#hint-list")).toContainText("tre termini");
  });

  test("completa la corte accettando forme equivalenti e apre la porta @smoke", async ({
    page,
  }) => {
    await enterCourtyard(page);

    await solve(page, /Primo sigillo/, "6x-5");
    await expect(page.getByRole("button", { name: /Ingranaggi gemelli/ })).toBeEnabled();
    await expect(page.locator("#progress-fraction")).toHaveText("1 / 3");

    await solve(page, /Ingranaggi gemelli/, "6x(x+1)+3x^{2}-2");
    await solve(page, /Fontana del tempo/, "(3+6x)/(2\\sqrt{x})");

    await expect(page.locator("#completion-dialog")).toBeVisible({ timeout: 8_000 });
    await expect(page.locator("#completion-title")).toHaveText("La via è aperta.");
    await expect(page.locator("#final-score")).toHaveText("300");
    await page.screenshot({ path: "artifacts/demo-complete.png", fullPage: true });
    await page.getByRole("button", { name: /Ammira la corte/ }).click();
    await expect(page.locator("#scene-state")).toHaveText("LA PORTA È APERTA");
  });

  test("ripristina il progresso dopo un reload", async ({ page }) => {
    await enterCourtyard(page);
    await solve(page, /Primo sigillo/, "6x-5");
    await page.reload();
    const sigillo = page.getByRole("button", { name: /Primo sigillo/ });
    await expect(sigillo).toContainText("100 punti");
    await expect(sigillo).toHaveAttribute("aria-label", /Attivo/);
    await expect(page.locator("#progress-fraction")).toHaveText("1 / 3");
    await expect(page.locator("#hud-score")).toHaveText("100");
    await expect(page.getByRole("button", { name: /Ingranaggi gemelli/ })).toBeEnabled();
  });

  test("la scena resta giocabile e senza overflow sul portrait", async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== "portrait-chromium",
      "Controllo specifico del formato verticale",
    );
    await enterCourtyard(page);
    await expect(page.locator("#game-container canvas")).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
    await page.screenshot({ path: "artifacts/demo-mobile.png", fullPage: true });

    await openPuzzle(page, /Primo sigillo/);
    await expect(page.locator("#answer-field")).toBeVisible();
    await expect(page.getByRole("button", { name: /Verifica e attiva/ })).toBeVisible();
    const panelOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(panelOverflow).toBeLessThanOrEqual(1);
  });

  test("cattura il desktop per la revisione", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chromium", "Controllo specifico del desktop");
    await enterCourtyard(page);
    await page.screenshot({ path: "artifacts/demo-desktop.png", fullPage: true });
  });
});
