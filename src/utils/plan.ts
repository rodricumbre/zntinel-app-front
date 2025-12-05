// src/utils/plan.ts

export type PlanId = "free" | "business" | "premium" | string | undefined;

/** Nombre del plan visible para el usuario */
export function getPlanLabel(plan: PlanId): string {
  switch (plan) {
    case "free":
      return "Starter";
    case "business":
      return "Business";
    case "premium":
      return "Enterprise";
    default:
      return "—";
  }
}

/** Pequeña descripción según el plan contratado */
export function getPlanDetail(plan: PlanId): string {
  switch (plan) {
    case "free":
      return "1 dominio · 1 usuario";
    case "business":
      return "hasta 2 dominios · 5 usuarios";
    case "premium":
      return "dominios y seats ampliables";
    default:
      return "Plan no asignado";
  }
}

/** Límite de dominios permitido (para API / lógica interna) */
export function getPlanMaxDomains(plan: PlanId): number {
  switch (plan) {
    case "free":
      return 1;
    case "business":
      return 2;
    case "premium":
      return 4;
    default:
      return 1;
  }
}
