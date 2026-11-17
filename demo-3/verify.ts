/**
 * Verifica locale della demo statica.
 *
 * Non è il motore simbolico del gioco vero: confronta la risposta con la
 * derivata attesa su un insieme di punti, accettando forme algebriche
 * equivalenti. Serve solo alla demo GitHub Pages, che non ha backend.
 */

export type VerificationStatus =
  "correct" | "incorrect" | "syntax_error" | "unsupported_expression";

export interface VerificationResult {
  status: VerificationStatus;
  message: string;
}

type Token =
  | { kind: "number"; value: number }
  | { kind: "ident"; value: string }
  | { kind: "op"; value: "+" | "-" | "*" | "/" | "^" }
  | { kind: "paren"; value: "(" | ")" }
  | { kind: "end" };

class ExpressionError extends Error {
  constructor(
    readonly kind: "syntax" | "unsupported",
    message: string,
  ) {
    super(message);
  }
}

const FUNCTIONS: Record<string, (value: number) => number> = {
  sqrt: Math.sqrt,
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  ln: Math.log,
  log: Math.log10,
  exp: Math.exp,
};

const CONSTANTS: Record<string, number> = {
  e: Math.E,
  pi: Math.PI,
};

const SAMPLE_POINTS = [-3.1, -2.3, -1.7, -1.1, -0.6, -0.2, 0.2, 0.6, 1.1, 1.7, 2.3, 3.1, 4.2];

const SUPERSCRIPTS: Record<string, string> = {
  "⁰": "^0",
  "¹": "^1",
  "²": "^2",
  "³": "^3",
  "⁴": "^4",
  "⁵": "^5",
  "⁶": "^6",
  "⁷": "^7",
  "⁸": "^8",
  "⁹": "^9",
};

export function normalizeExpression(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[−–—]/g, "-")
    .replace(/[×·⋅∗∙]/g, "*")
    .replace(/÷/g, "/")
    .replace(/\*\*/g, "^")
    .replace(/√/g, "sqrt")
    .replace(/π/g, "pi")
    .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (digit) => SUPERSCRIPTS[digit] ?? digit);
}

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;
  while (index < source.length) {
    const char = source[index];
    if (/\s/.test(char)) {
      index += 1;
      continue;
    }
    if (/\d/.test(char) || (char === "." && /\d/.test(source[index + 1] ?? ""))) {
      let end = index;
      let dots = 0;
      while (end < source.length && (/\d/.test(source[end]) || source[end] === ".")) {
        if (source[end] === ".") dots += 1;
        end += 1;
      }
      if (dots > 1) throw new ExpressionError("syntax", "Numero non valido.");
      const value = Number(source.slice(index, end));
      if (!Number.isFinite(value)) throw new ExpressionError("syntax", "Numero non valido.");
      tokens.push({ kind: "number", value });
      index = end;
      continue;
    }
    if (/[a-z]/.test(char)) {
      let end = index;
      while (end < source.length && /[a-z]/.test(source[end])) end += 1;
      tokens.push({ kind: "ident", value: source.slice(index, end) });
      index = end;
      continue;
    }
    if (char === "+" || char === "-" || char === "*" || char === "/" || char === "^") {
      tokens.push({ kind: "op", value: char });
      index += 1;
      continue;
    }
    if (char === "(" || char === ")") {
      tokens.push({ kind: "paren", value: char });
      index += 1;
      continue;
    }
    throw new ExpressionError("unsupported", `Carattere non supportato: ${char}`);
  }
  tokens.push({ kind: "end" });
  return tokens;
}

class Parser {
  private index = 0;

  constructor(
    private readonly tokens: Token[],
    private readonly variable: number,
  ) {}

  parse(): number {
    const value = this.parseSum();
    if (this.peek().kind !== "end") {
      throw new ExpressionError("syntax", "Espressione incompleta.");
    }
    return value;
  }

  private peek(): Token {
    return this.tokens[this.index] ?? { kind: "end" };
  }

  private take(): Token {
    const token = this.peek();
    this.index += 1;
    return token;
  }

  private parseSum(): number {
    let value = this.parseProduct();
    while (true) {
      const token = this.peek();
      if (token.kind !== "op" || (token.value !== "+" && token.value !== "-")) break;
      this.take();
      const right = this.parseProduct();
      value = token.value === "+" ? value + right : value - right;
    }
    return value;
  }

  private parseProduct(): number {
    let value = this.parseUnary();
    while (true) {
      const token = this.peek();
      if (token.kind === "op" && (token.value === "*" || token.value === "/")) {
        this.take();
        const right = this.parseUnary();
        value = token.value === "*" ? value * right : value / right;
        continue;
      }
      if (this.startsPrimary(token)) {
        value *= this.parseUnary();
        continue;
      }
      break;
    }
    return value;
  }

  private parseUnary(): number {
    const token = this.peek();
    if (token.kind === "op" && (token.value === "+" || token.value === "-")) {
      this.take();
      const value = this.parseUnary();
      return token.value === "-" ? -value : value;
    }
    return this.parsePower();
  }

  private parsePower(): number {
    const base = this.parsePrimary();
    const token = this.peek();
    if (token.kind === "op" && token.value === "^") {
      this.take();
      return Math.pow(base, this.parseUnary());
    }
    return base;
  }

  private parsePrimary(): number {
    const token = this.take();
    if (token.kind === "number") return token.value;
    if (token.kind === "paren" && token.value === "(") {
      const value = this.parseSum();
      const close = this.take();
      if (close.kind !== "paren" || close.value !== ")") {
        throw new ExpressionError("syntax", "Parentesi non chiuse.");
      }
      return value;
    }
    if (token.kind === "ident") {
      if (token.value === "x") return this.variable;
      if (token.value in CONSTANTS) return CONSTANTS[token.value];
      const fn = FUNCTIONS[token.value];
      if (!fn) {
        throw new ExpressionError("unsupported", `Funzione non supportata: ${token.value}`);
      }
      if (this.peek().kind === "paren" && (this.peek() as { value?: string }).value === "(") {
        this.take();
        const argument = this.parseSum();
        const close = this.take();
        if (close.kind !== "paren" || close.value !== ")") {
          throw new ExpressionError("syntax", "Parentesi non chiuse.");
        }
        return fn(argument);
      }
      // Forma breve, per esempio "sin x" o "sqrt x".
      const argument = this.parseUnary();
      return fn(argument);
    }
    throw new ExpressionError("syntax", "Espressione incompleta.");
  }

  private startsPrimary(token: Token): boolean {
    if (token.kind === "number" || token.kind === "ident") return true;
    return token.kind === "paren" && token.value === "(";
  }
}

export function compileExpression(source: string): (x: number) => number {
  const normalized = normalizeExpression(source);
  if (!normalized) throw new ExpressionError("syntax", "Espressione vuota.");
  const tokens = tokenize(normalized);
  // Valida subito la grammatica: l'errore di sintassi non deve comparire
  // soltanto al momento del confronto numerico.
  new Parser(tokens, 1).parse();
  return (x: number) => new Parser(tokens, x).parse();
}

function sameValue(expected: number, actual: number): boolean {
  const scale = Math.max(1, Math.abs(expected), Math.abs(actual));
  return Math.abs(expected - actual) <= 1e-7 * scale;
}

/**
 * Confronta due espressioni in x su punti campione. Se una forma non è
 * definita in un punto, il punto viene saltato per entrambe; se la risposta
 * non è definita dove la derivata attesa lo è, la risposta è considerata
 * errata.
 */
export function equivalentExpressions(expected: string, actual: string): boolean {
  const expectedFn = compileExpression(expected);
  const actualFn = compileExpression(actual);
  let compared = 0;
  for (const x of SAMPLE_POINTS) {
    const expectedValue = expectedFn(x);
    if (!Number.isFinite(expectedValue) || Math.abs(expectedValue) > 1e9) continue;
    let actualValue: number;
    try {
      actualValue = actualFn(x);
    } catch {
      return false;
    }
    if (!Number.isFinite(actualValue) || Math.abs(actualValue) > 1e9) return false;
    if (!sameValue(expectedValue, actualValue)) return false;
    compared += 1;
  }
  return compared >= 3;
}

export function verifyDerivative(input: string, expectedDerivative: string): VerificationResult {
  const normalized = normalizeExpression(input);
  if (!normalized) {
    return { status: "syntax_error", message: "Scrivi una derivata prima di verificare." };
  }
  try {
    compileExpression(input);
  } catch (error) {
    if (error instanceof ExpressionError) {
      return {
        status: error.kind === "syntax" ? "syntax_error" : "unsupported_expression",
        message:
          error.kind === "syntax"
            ? "La sintassi non è completa: controlla parentesi, operatori e potenze."
            : "Usa soltanto x, numeri e le funzioni sqrt, sin, cos, tan, ln, log ed exp.",
      };
    }
    return { status: "syntax_error", message: "La risposta non è un'espressione supportata." };
  }

  try {
    if (equivalentExpressions(expectedDerivative, input)) {
      return {
        status: "correct",
        message: "Esatto! La derivata è equivalente a quella attesa. Il meccanismo si riattiva.",
      };
    }
  } catch {
    return {
      status: "unsupported_expression",
      message: "La verifica locale non riesce a interpretare questa forma. Prova a riscriverla.",
    };
  }

  return {
    status: "incorrect",
    message:
      "La derivata non è ancora equivalente a quella attesa. Rivedi la regola applicata e i calcoli.",
  };
}
