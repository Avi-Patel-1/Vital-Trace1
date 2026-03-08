import { clamp } from "../../lib/formatting/format";

export function sampleRange(values: number[], maxPoints = 720) {
  if (values.length <= maxPoints) {
    return values.map((value, index) => ({ index, value }));
  }

  const step = values.length / maxPoints;
  return Array.from({ length: maxPoints }, (_, pointIndex) => {
    const sourceIndex = Math.floor(pointIndex * step);
    return {
      index: sourceIndex,
      value: values[sourceIndex]
    };
  });
}

export function linePath(
  points: { x: number; y: number }[],
  radius = 0
) {
  if (!points.length) {
    return "";
  }

  if (!radius) {
    return points
      .map((point, index) =>
        `${index === 0 ? "M" : "L"}${point.x.toFixed(2)},${point.y.toFixed(2)}`
      )
      .join(" ");
  }

  return points
    .map((point, index) => {
      if (index === 0) {
        return `M${point.x.toFixed(2)},${point.y.toFixed(2)}`;
      }

      const previous = points[index - 1];
      const midX = ((previous.x + point.x) / 2).toFixed(2);
      const prevY = previous.y.toFixed(2);
      return `Q${midX},${prevY} ${point.x.toFixed(2)},${point.y.toFixed(2)}`;
    })
    .join(" ");
}

export function normalizeSeries(values: number[]) {
  const maxAbs = Math.max(...values.map((value) => Math.abs(value)), 1e-6);
  return values.map((value) => value / maxAbs);
}

export function toPlotPoints(
  values: number[],
  xStart: number,
  xEnd: number,
  yTop: number,
  yBottom: number
) {
  const sampled = sampleRange(values);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = Math.max(max - min, 1e-6);
  return sampled.map((entry) => {
    const x = xStart + (entry.index / Math.max(values.length - 1, 1)) * (xEnd - xStart);
    const normalized = (entry.value - min) / spread;
    const y = yBottom - normalized * (yBottom - yTop);
    return { x, y };
  });
}

export function heatColor(intensity: number) {
  const clamped = clamp(intensity, 0, 1);
  const r = Math.round(40 + clamped * 181);
  const g = Math.round(82 + clamped * 120);
  const b = Math.round(84 + (1 - clamped) * 118);
  return `rgb(${r}, ${g}, ${b})`;
}
