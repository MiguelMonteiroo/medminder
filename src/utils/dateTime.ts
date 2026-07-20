export function formatLocalDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

export function formatLocalDateTime(date: Date): string {
  const time = `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}:${String(date.getSeconds()).padStart(2, "0")}.${String(
    date.getMilliseconds()
  ).padStart(3, "0")}`;
  return `${formatLocalDate(date)}T${time}`;
}

export function normalizeDoseDateTime(value: string): string {
  if (!/[zZ]|[+-]\d{2}:\d{2}$/.test(value)) return value;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? formatLocalDateTime(parsed) : value;
}

export function formatDoseTime(value: string): string {
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) {
    return value.split("T")[1]?.substring(0, 5) || "--:--";
  }
  return `${String(parsed.getHours()).padStart(2, "0")}:${String(
    parsed.getMinutes()
  ).padStart(2, "0")}`;
}
