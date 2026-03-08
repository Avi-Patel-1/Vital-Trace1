export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function formatSeconds(value: number) {
  if (!Number.isFinite(value)) {
    return "0.0 s";
  }

  if (value >= 60) {
    const minutes = Math.floor(value / 60);
    const seconds = value % 60;
    return `${minutes}m ${seconds.toFixed(1)}s`;
  }

  return `${value.toFixed(1)} s`;
}

export function formatFrequency(value: number) {
  return `${value.toFixed(1)} Hz`;
}

export function formatPercent(value: number) {
  return `${value.toFixed(0)}%`;
}

export function formatMetric(value: number, digits = 2) {
  if (!Number.isFinite(value)) {
    return "0";
  }

  return value.toFixed(digits);
}

export function formatDateTime(date = new Date()) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
