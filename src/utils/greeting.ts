export type Greeting = "Bom dia" | "Boa tarde" | "Boa noite";

export function getGreetingForHour(hour: number): Greeting {
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
    throw new RangeError("Hour must be an integer between 0 and 23.");
  }

  if (hour >= 5 && hour < 12) return "Bom dia";
  if (hour >= 12 && hour < 18) return "Boa tarde";
  return "Boa noite";
}

export function getNextGreetingChange(now: Date): Date {
  const next = new Date(now);
  const hour = now.getHours();

  if (hour < 5) next.setHours(5, 0, 0, 0);
  else if (hour < 12) next.setHours(12, 0, 0, 0);
  else if (hour < 18) next.setHours(18, 0, 0, 0);
  else {
    next.setDate(next.getDate() + 1);
    next.setHours(5, 0, 0, 0);
  }

  return next;
}
