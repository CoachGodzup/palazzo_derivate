import type itCatalog from "../content/locales/it.json";

export type LocaleCatalog = typeof itCatalog;

export const DEFAULT_LOCALE = "it";
const LOCALE_STORAGE_KEY = "palazzo-lang";

const catalogs = import.meta.glob<LocaleCatalog>("../content/locales/*.json", {
  eager: true,
  import: "default",
});

const catalogsByLanguage: Record<string, LocaleCatalog> = {};
for (const [path, catalog] of Object.entries(catalogs)) {
  const language = path
    .split("/")
    .at(-1)
    ?.replace(/\.json$/, "");
  if (language) catalogsByLanguage[language] = catalog;
}

let activeLocale = DEFAULT_LOCALE;

export function availableLocales(): string[] {
  return Object.keys(catalogsByLanguage).sort();
}

export function getLocale(): string {
  return activeLocale;
}

export function setLocale(language: string): boolean {
  if (!catalogsByLanguage[language]) return false;
  activeLocale = language;
  return true;
}

/**
 * Ordine di scelta: ?lang=, preferenza salvata, lingua del browser, italiano.
 * Le lingue senza catalogo ricadono sull'italiano.
 */
export function detectLocale(): string {
  if (typeof window === "undefined") return activeLocale;
  const fromQuery = new URLSearchParams(window.location.search).get("lang");
  let stored: string | null = null;
  try {
    stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  } catch {
    stored = null;
  }
  const fromBrowser =
    typeof navigator !== "undefined" ? navigator.language.split("-")[0] : undefined;
  for (const candidate of [fromQuery, stored, fromBrowser]) {
    if (candidate && catalogsByLanguage[candidate]) {
      activeLocale = candidate;
      if (candidate !== stored) {
        try {
          window.localStorage.setItem(LOCALE_STORAGE_KEY, candidate);
        } catch {
          // La lingua resta attiva anche senza storage disponibile.
        }
      }
      return candidate;
    }
  }
  activeLocale = DEFAULT_LOCALE;
  return activeLocale;
}

function lookup(catalog: LocaleCatalog, key: string): unknown {
  return key.split(".").reduce<unknown>((value, part) => {
    if (value && typeof value === "object" && part in value) {
      return (value as Record<string, unknown>)[part];
    }
    return undefined;
  }, catalog);
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

/**
 * Restituisce un testo del catalogo attivo. Se la chiave manca nella lingua
 * scelta, ricade sull'italiano; una chiave assente ovunque resta visibile
 * come nome tecnico per rendere immediato l'errore in revisione.
 */
export function t(key: string, params?: Record<string, string | number>): string {
  const value =
    lookup(catalogsByLanguage[activeLocale] ?? catalogsByLanguage[DEFAULT_LOCALE], key) ??
    lookup(catalogsByLanguage[DEFAULT_LOCALE], key);
  if (typeof value !== "string") {
    console.warn(`[i18n] Testo mancante: ${key}`);
    return key;
  }
  return interpolate(value, params);
}

/**
 * Applica i testi del catalogo agli elementi HTML annotati:
 * data-i18n (testo), data-i18n-html (markup fidato), data-i18n-<attributo>.
 */
export function applyStaticTranslations(root: ParentNode = document): void {
  for (const element of root.querySelectorAll<HTMLElement>("[data-i18n]")) {
    element.textContent = t(element.dataset.i18n ?? "");
  }
  for (const element of root.querySelectorAll<HTMLElement>("[data-i18n-html]")) {
    element.innerHTML = t(element.dataset.i18nHtml ?? "");
  }
  for (const element of root.querySelectorAll<HTMLElement>(
    "[data-i18n], [data-i18n-html], [data-i18n-aria-label], [data-i18n-title], [data-i18n-placeholder]",
  )) {
    for (const name of element.getAttributeNames()) {
      if (!name.startsWith("data-i18n-") || name === "data-i18n-html") continue;
      const attribute = name.slice("data-i18n-".length);
      element.setAttribute(attribute, t(element.getAttribute(name) ?? ""));
    }
  }
}

export function initI18n(): string {
  const language = detectLocale();
  applyStaticTranslations();
  if (typeof document !== "undefined") {
    document.documentElement.lang = language;
    document.title = t("meta.title");
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", t("meta.description"));
  }
  return language;
}
