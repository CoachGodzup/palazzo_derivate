import { describe, expect, it } from "vitest";
import campaign from "../demo-2/campaign.json";
import { equivalentExpressions, verifyDerivative } from "../demo-2/verify";

const rooms = campaign.chapters.flatMap((chapter) => chapter.rooms);

describe("demo 2 · contenuti", () => {
  it("contiene sei capitoli, ventiquattro stanze principali e sei stanze segrete", () => {
    expect(campaign.chapters).toHaveLength(6);
    expect(rooms.filter((room) => !room.secret)).toHaveLength(24);
    expect(rooms.filter((room) => room.secret)).toHaveLength(6);
  });

  it("tiene le stanze segrete nei contenuti ma disattivate dal docente", () => {
    expect(campaign.teacher.secretRooms).toBe(false);
    expect(new Set(rooms.map((room) => room.id)).size).toBe(rooms.length);
  });

  it("accetta la derivata attesa di ogni stanza", () => {
    for (const room of rooms) {
      const result = verifyDerivative(room.derivativeSympy, room.derivativeSympy);
      expect(result.status, room.id).toBe("correct");
    }
  });
});

describe("demo 2 · verifica locale", () => {
  it("accetta forme equivalenti non semplificate", () => {
    expect(equivalentExpressions("6*x-5", "3*2*x-5")).toBe(true);
    expect(equivalentExpressions("9*x^2+6*x-2", "6*x*(x+1)+3*x^2-2")).toBe(true);
    expect(equivalentExpressions("30*x*(3*x^2+1)^4", "5*(3*x^2+1)^4*6*x")).toBe(true);
    expect(equivalentExpressions("(x^2+2*x-3)/(x+1)^2", "(2*x*(x+1)-(x^2+3))/(x+1)^2")).toBe(true);
  });

  it("rifiuta una risposta errata", () => {
    expect(verifyDerivative("6*x", "6*x-5").status).toBe("incorrect");
    expect(verifyDerivative("9*x^2+6*x", "9*x^2+6*x-2").status).toBe("incorrect");
  });

  it("distingue sintassi incompleta e funzione non supportata", () => {
    expect(verifyDerivative("6*x-", "6*x-5").status).toBe("syntax_error");
    expect(verifyDerivative("gamma(x)", "6*x-5").status).toBe("unsupported_expression");
  });
});
