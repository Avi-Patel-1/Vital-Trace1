import { FilterSettings } from "../../types/signal";

function movingAverage(values: number[], windowSize: number) {
  if (windowSize <= 1) {
    return [...values];
  }

  const result = new Array(values.length).fill(0);
  let sum = 0;

  for (let index = 0; index < values.length; index += 1) {
    sum += values[index];
    if (index >= windowSize) {
      sum -= values[index - windowSize];
    }

    result[index] = sum / Math.min(windowSize, index + 1);
  }

  return result;
}

function detrend(values: number[]) {
  const n = values.length;
  if (n <= 2) {
    return [...values];
  }

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (let index = 0; index < n; index += 1) {
    sumX += index;
    sumY += values[index];
    sumXY += index * values[index];
    sumXX += index * index;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX || 1);
  const intercept = (sumY - slope * sumX) / n;

  return values.map((value, index) => value - (slope * index + intercept));
}

function normalize(values: number[]) {
  const maxAbs = Math.max(...values.map((value) => Math.abs(value)), 1e-6);
  return values.map((value) => value / maxAbs);
}

function lowPass(values: number[], sampleRateHz: number, cutoffHz: number) {
  if (cutoffHz <= 0) {
    return [...values];
  }

  const dt = 1 / sampleRateHz;
  const rc = 1 / (2 * Math.PI * cutoffHz);
  const alpha = dt / (rc + dt);
  const output = [...values];

  for (let index = 1; index < values.length; index += 1) {
    output[index] = output[index - 1] + alpha * (values[index] - output[index - 1]);
  }

  return output;
}

function highPass(values: number[], sampleRateHz: number, cutoffHz: number) {
  if (cutoffHz <= 0) {
    return [...values];
  }

  const dt = 1 / sampleRateHz;
  const rc = 1 / (2 * Math.PI * cutoffHz);
  const alpha = rc / (rc + dt);
  const output = [...values];

  for (let index = 1; index < values.length; index += 1) {
    output[index] =
      alpha * (output[index - 1] + values[index] - values[index - 1]);
  }

  return output;
}

function bandPass(
  values: number[],
  sampleRateHz: number,
  lowHz: number,
  highHz: number
) {
  return lowPass(highPass(values, sampleRateHz, lowHz), sampleRateHz, highHz);
}

function notch(values: number[], sampleRateHz: number, notchHz: number, q = 18) {
  if (notchHz <= 0 || notchHz >= sampleRateHz / 2) {
    return [...values];
  }

  const w0 = (2 * Math.PI * notchHz) / sampleRateHz;
  const alpha = Math.sin(w0) / (2 * q);
  const cosW0 = Math.cos(w0);

  const b0 = 1;
  const b1 = -2 * cosW0;
  const b2 = 1;
  const a0 = 1 + alpha;
  const a1 = -2 * cosW0;
  const a2 = 1 - alpha;

  const output = new Array(values.length).fill(0);

  for (let index = 0; index < values.length; index += 1) {
    const x0 = values[index];
    const x1 = values[index - 1] ?? 0;
    const x2 = values[index - 2] ?? 0;
    const y1 = output[index - 1] ?? 0;
    const y2 = output[index - 2] ?? 0;

    output[index] =
      (b0 / a0) * x0 +
      (b1 / a0) * x1 +
      (b2 / a0) * x2 -
      (a1 / a0) * y1 -
      (a2 / a0) * y2;
  }

  return output;
}

function baselineCorrection(values: number[], sampleRateHz: number) {
  const window = Math.max(3, Math.round(sampleRateHz * 0.75));
  const baseline = movingAverage(values, window);
  return values.map((value, index) => value - baseline[index]);
}

export const defaultFilterSettings: FilterSettings = {
  smoothingWindow: 1,
  movingAverageWindow: 1,
  lowPassHz: null,
  highPassHz: null,
  bandPassLowHz: null,
  bandPassHighHz: null,
  notchHz: null,
  baselineCorrection: false,
  detrend: false,
  normalize: false,
  rectify: false,
  envelope: false
};

export function applyFilterPipeline(
  input: number[],
  sampleRateHz: number,
  settings: FilterSettings
) {
  let output = [...input];

  if (settings.detrend) {
    output = detrend(output);
  }

  if (settings.baselineCorrection) {
    output = baselineCorrection(output, sampleRateHz);
  }

  if (
    settings.bandPassLowHz &&
    settings.bandPassHighHz &&
    settings.bandPassLowHz < settings.bandPassHighHz
  ) {
    output = bandPass(
      output,
      sampleRateHz,
      settings.bandPassLowHz,
      settings.bandPassHighHz
    );
  } else {
    if (settings.highPassHz) {
      output = highPass(output, sampleRateHz, settings.highPassHz);
    }

    if (settings.lowPassHz) {
      output = lowPass(output, sampleRateHz, settings.lowPassHz);
    }
  }

  if (settings.notchHz) {
    output = notch(output, sampleRateHz, settings.notchHz);
  }

  if (settings.smoothingWindow > 1) {
    output = movingAverage(output, settings.smoothingWindow);
  }

  if (settings.movingAverageWindow > 1) {
    output = movingAverage(output, settings.movingAverageWindow);
  }

  if (settings.rectify) {
    output = output.map((value) => Math.abs(value));
  }

  if (settings.envelope) {
    const envelopeSeed = output.map((value) => Math.abs(value));
    output = movingAverage(envelopeSeed, Math.max(3, Math.round(sampleRateHz * 0.06)));
  }

  if (settings.normalize) {
    output = normalize(output);
  }

  return output;
}
