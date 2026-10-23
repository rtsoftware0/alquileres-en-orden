import { describe, expect, it } from "vitest";
import { demoPortfolio as data } from "@/features/portfolio/data/demo-data";
import { pendingCents } from "@/features/money/selectors";
import { expenseTotals } from "@/features/money/expenses";
import { summarizeOccupancy } from "@/features/portfolio/selectors";
import { filterIncidents, filterTasks, getIncident, isOverdue, isTaskOverdue, taskCounts, tasksOfIncident } from "./selectors";
import { applySimAction, availableActions, initialSim } from "./simulator";
import { emptyIncidentDraft, validateIncidentFollowUp, validateIncidentPlace } from "./draft";

const all = { q: "", propertyId: "todos", roomId: "todos", priority: "todos", status: "todos", assignee: "todos", overdueOnly: false } as const;

describe("incident data stays exactly the approved scenario", () => {
  it("keeps the 3 original incidents with ids, titles, places and dates", () => {
    expect(data.incidents).toHaveLength(3);
    const [i1, i2, i3] = [getIncident(data, "inc-1")!, getIncident(data, "inc-2")!, getIncident(data, "inc-3")!];
    expect([i1.title, i1.propertyId, i1.roomId, i1.openedOn]).toEqual(["Humedad en pared", "casa-azahar", "aza-06", "2026-10-14"]);
    expect([i2.title, i2.propertyId, i2.roomId, i2.openedOn]).toEqual(["Persiana atascada", "casa-olivo", "oli-01", "2026-10-18"]);
    expect([i3.title, i3.propertyId, i3.roomId, i3.openedOn]).toEqual(["Revisión de caldera", "casa-olivo", undefined, "2026-10-20"]);
    expect(i1.providerId).toBe("con-012");
  });

  it("inc-2 links the pre-existing expense GS-EJ-001 of 120 €, and no expense was added", () => {
    expect(getIncident(data, "inc-2")!.linkedExpenseId).toBe("gs-ej-001");
    expect(data.expenses.find((e) => e.id === "gs-ej-001")!.amountCents).toBe(12000);
    expect(data.expenses).toHaveLength(4);
  });

  it("overdue derives from the fixed reference date and non-final status", () => {
    expect(isOverdue(data, getIncident(data, "inc-1")!)).toBe(false); // target 28/10
    expect(isOverdue(data, getIncident(data, "inc-2")!)).toBe(false); // target 24/10
    expect(isOverdue(data, { ...getIncident(data, "inc-2")!, targetDate: "2026-10-20" })).toBe(true);
    expect(isOverdue(data, { ...getIncident(data, "inc-2")!, targetDate: "2026-10-20", status: "cerrada" })).toBe(false);
  });

  it("filters combine and can return zero results", () => {
    expect(filterIncidents(data, { ...all, propertyId: "casa-azahar" }).map((i) => i.id)).toEqual(["inc-1"]);
    expect(filterIncidents(data, { ...all, status: "nueva" }).map((i) => i.id)).toEqual(["inc-3"]);
    expect(filterIncidents(data, { ...all, priority: "alta", status: "en_curso" }).map((i) => i.id)).toEqual(["inc-1"]);
    expect(filterIncidents(data, { ...all, q: "zzz" })).toHaveLength(0);
  });
});

describe("tasks", () => {
  it("4 tasks: 3 linked to incidents, 1 independent; counts and overdue derive from the fixed date", () => {
    expect(data.tasks).toHaveLength(4);
    expect(data.tasks.filter((t) => t.incidentId)).toHaveLength(3);
    expect(taskCounts(data)).toEqual({ pendientes: 3, vencidas: 1, completadas: 1 });
    expect(isTaskOverdue(data, data.tasks.find((t) => t.id === "tar-1")!)).toBe(true);
    expect(tasksOfIncident(data, "inc-2").map((t) => t.id)).toEqual(["tar-2"]);
  });

  it("task filters combine and can return zero", () => {
    expect(filterTasks(data, { q: "", status: "pendiente", overdueOnly: true }).map((t) => t.id)).toEqual(["tar-1"]);
    expect(filterTasks(data, { q: "zzz", status: "todos", overdueOnly: false })).toHaveLength(0);
  });
});

describe("incident follow-up simulator", () => {
  const inc2 = getIncident(data, "inc-2")!; // pendiente_aprobacion, budget 120 proposed
  const inc3 = getIncident(data, "inc-3")!; // nueva

  it("inc-2 base: only approve/reject are offered; approval never creates expense or payment", () => {
    const s = initialSim(inc2);
    expect(availableActions(s)).toEqual(["aprobar", "rechazar"]);
    const ok = applySimAction(data, s, { type: "aprobar" });
    expect(ok).toMatchObject({ ok: true });
    if (ok.ok) expect([ok.state.status, ok.state.budget?.status]).toEqual(["en_curso", "aprobado"]);
    expect(data.expenses).toHaveLength(4);
    expect(expenseTotals(data).pendingCents).toBe(37000);
  });

  it("rejection is not approval: back to asignada with rejected budget", () => {
    const r = applySimAction(data, initialSim(inc2), { type: "rechazar" });
    if (!r.ok) throw new Error("expected ok");
    expect([r.state.status, r.state.budget?.status]).toEqual(["asignada", "rechazado"]);
    // a rejected budget cannot be approved
    expect(applySimAction(data, r.state, { type: "aprobar" }).ok).toBe(false);
    // a new proposal bumps the version
    const p = applySimAction(data, r.state, { type: "presentar_presupuesto", amountCents: 12000 });
    if (!p.ok) throw new Error("expected ok");
    expect(p.state.budget?.version).toBe(2);
  });

  it("changing provider invalidates the budget; full path needs each requirement", () => {
    let s = initialSim(inc3);
    expect(applySimAction(data, s, { type: "presentar_presupuesto", amountCents: 100 }).ok).toBe(false);
    expect(applySimAction(data, s, { type: "resolver", result: "x" }).ok).toBe(false);
    let r = applySimAction(data, s, { type: "asignar_proveedor", providerId: "con-012" });
    if (!r.ok) throw new Error("expected ok");
    s = r.state;
    r = applySimAction(data, s, { type: "presentar_presupuesto", amountCents: 12000 });
    if (!r.ok) throw new Error("expected ok");
    s = r.state;
    // reassigning is not allowed mid-flow; but a fresh assignment clears budget
    expect(applySimAction(data, s, { type: "asignar_proveedor", providerId: "con-015" }).ok).toBe(false);
    r = applySimAction(data, s, { type: "aprobar" });
    if (!r.ok) throw new Error("expected ok");
    s = r.state;
    expect(applySimAction(data, s, { type: "resolver", result: "  " }).ok).toBe(false); // result required
    r = applySimAction(data, s, { type: "resolver", result: "Caldera revisada (simulado)." });
    if (!r.ok) throw new Error("expected ok");
    s = r.state;
    expect(s.status).toBe("resuelta");
    expect(applySimAction(data, s, { type: "cerrar", result: "" }).ok).toBe(false); // result required to close
    r = applySimAction(data, s, { type: "cerrar", result: "Cierre de ejemplo." });
    if (!r.ok) throw new Error("expected ok");
    s = r.state;
    expect(s.status).toBe("cerrada");
    expect(applySimAction(data, s, { type: "reabrir", motive: "" }).ok).toBe(false); // motive required
    r = applySimAction(data, s, { type: "reabrir", motive: "Reaparece el ruido (ejemplo)." });
    if (!r.ok) throw new Error("expected ok");
    expect([r.state.status, r.state.resolution]).toEqual(["en_revision", undefined]);
  });

  it("reassigning provider from en_revision clears a previous budget", () => {
    const base = initialSim({ ...inc3, status: "en_revision", providerId: "con-012", budget: { amountCents: 5000, status: "rechazado", version: 1 } });
    const r = applySimAction(data, base, { type: "asignar_proveedor", providerId: "con-015" });
    if (!r.ok) throw new Error("expected ok");
    expect(r.state.budget).toBeUndefined();
    expect(r.state.providerId).toBe("con-015");
  });

  it("rejection blocks iniciar until a new budget version is approved", () => {
    const r = applySimAction(data, initialSim(inc2), { type: "rechazar" });
    if (!r.ok) throw new Error("expected ok");
    // rejected budget: iniciar is not offered and is rejected by the engine
    expect(availableActions(r.state)).toEqual(["presentar_presupuesto"]);
    expect(applySimAction(data, r.state, { type: "iniciar" }).ok).toBe(false);
    // new version + approval makes iniciar unnecessary: approval moves to en_curso
    const p = applySimAction(data, r.state, { type: "presentar_presupuesto", amountCents: 12000 });
    if (!p.ok) throw new Error("expected ok");
    const a = applySimAction(data, p.state, { type: "aprobar" });
    if (!a.ok) throw new Error("expected ok");
    expect(a.state.status).toBe("en_curso");
  });

  it("iniciar without any budget is valid; resolving then closing keeps both results", () => {
    let s = initialSim(inc3); // nueva, no budget ever
    let r = applySimAction(data, s, { type: "asignar_proveedor", providerId: "con-012" });
    if (!r.ok) throw new Error("expected ok");
    s = r.state;
    expect(availableActions(s)).toEqual(["presentar_presupuesto", "iniciar"]);
    r = applySimAction(data, s, { type: "iniciar" });
    if (!r.ok) throw new Error("expected ok");
    s = r.state;
    r = applySimAction(data, s, { type: "resolver", result: "Resultado A: caldera revisada." });
    if (!r.ok) throw new Error("expected ok");
    s = r.state;
    r = applySimAction(data, s, { type: "cerrar", result: "Resultado B: cierre verificado." });
    if (!r.ok) throw new Error("expected ok");
    s = r.state;
    // close result B is preserved separately; resolution A is not overwritten
    expect(s.closure).toBe("Resultado B: cierre verificado.");
    expect(s.resolution).toBe("Resultado A: caldera revisada.");
    // reopening clears both results coherently
    const re = applySimAction(data, s, { type: "reabrir", motive: "Vuelve el fallo (ejemplo)." });
    if (!re.ok) throw new Error("expected ok");
    expect([re.state.resolution, re.state.closure]).toEqual([undefined, undefined]);
  });

  it("never mutates the dataset, money, occupancy or room status", () => {
    const before = JSON.stringify(data);
    let s = initialSim(inc2);
    for (const a of [
      { type: "aprobar" } as const,
      { type: "resolver", result: "Reparada (simulado)." } as const,
      { type: "cerrar", result: "Cerrada (simulado)." } as const,
    ]) {
      const r = applySimAction(data, s, a);
      if (r.ok) s = r.state;
    }
    expect(JSON.stringify(data)).toBe(before);
    expect(pendingCents(data)).toBe(140000);
    expect(expenseTotals(data).costCents).toBe(54000);
    expect(summarizeOccupancy(data.rooms).occupied).toBe(8);
    expect(data.rooms.find((r) => r.id === "aza-06")!.status).toBe("bloqueada"); // closing humidity never unlocks AZA-06
  });
});

describe("incident draft validation", () => {
  const base = {
    ...emptyIncidentDraft, propertyId: "casa-olivo", roomId: "", category: "Reparación",
    title: "Goteo en cocina", description: "Goteo de ejemplo en la cocina común.",
    priority: "media", contactId: "", openedOn: "2026-10-21",
    assigneeName: "Administrador de demostración", targetDate: "2026-10-30", providerId: "",
  };

  it("valid draft passes; required fields and invalid values fail per field", () => {
    expect(validateIncidentPlace(base, data)).toEqual({});
    expect(validateIncidentFollowUp(base, data)).toEqual({});
    expect(validateIncidentPlace(emptyIncidentDraft, data)).toMatchObject({ propertyId: expect.any(String), title: expect.any(String), openedOn: expect.any(String) });
    expect(validateIncidentPlace({ ...base, openedOn: "2026-13-40" }, data).openedOn).toBeDefined();
    expect(validateIncidentFollowUp({ ...base, assigneeName: " " }, data).assigneeName).toBeDefined();
    expect(validateIncidentFollowUp({ ...base, providerId: "con-001" }, data).providerId).toBeDefined();
    expect(validateIncidentPlace({ ...base, contactId: "zzz" }, data).contactId).toBeDefined();
  });

  it("a unit from another property or unknown is rejected; common areas allowed", () => {
    expect(validateIncidentPlace({ ...base, roomId: "aza-01" }, data).roomId).toBeDefined();
    expect(validateIncidentPlace({ ...base, roomId: "zzz-99" }, data).roomId).toBeDefined();
    expect(validateIncidentPlace({ ...base, roomId: "oli-01" }, data)).toEqual({});
  });
});
