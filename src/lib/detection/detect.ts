import {
  DetectedEvent,
  DetectedRegion,
  DetectionResult,
  SignalType
} from "../../types/signal";

function mean(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
}

function standardDeviation(values: number[]) {
  const avg = mean(values);
  const variance =
    values.reduce((sum, value) => sum + (value - avg) ** 2, 0) /
    Math.max(values.length, 1);
  return Math.sqrt(variance);
}

function localExtrema(
  values: number[],
  sampleRateHz: number,
  polarity: "peak" | "trough",
  threshold: number,
  minDistanceSec: number
) {
  const events: DetectedEvent[] = [];
  const distance = Math.max(1, Math.round(sampleRateHz * minDistanceSec));

  for (let index = 1; index < values.length - 1; index += 1) {
    const left = values[index - 1];
    const current = values[index];
    const right = values[index + 1];
    const isMatch =
      polarity === "peak"
        ? current >= left && current > right && current >= threshold
        : current <= left && current < right && current <= threshold;

    if (!isMatch) {
      continue;
    }

    const lastEvent = events[events.length - 1];
    if (lastEvent && index - lastEvent.index < distance) {
      const shouldReplace =
        polarity === "peak"
          ? current > lastEvent.amplitude
          : current < lastEvent.amplitude;
      if (shouldReplace) {
        events[events.length - 1] = {
          ...lastEvent,
          index,
          time: index / sampleRateHz,
          amplitude: current
        };
      }
      continue;
    }

    events.push({
      id: `${polarity}-${index}`,
      kind: polarity,
      index,
      time: index / sampleRateHz,
      amplitude: current,
      label: polarity === "peak" ? "Peak" : "Trough"
    });
  }

  return events;
}

function thresholdRegions(
  values: number[],
  sampleRateHz: number,
  threshold: number,
  minDurationSec: number,
  label: string
) {
  const regions: DetectedRegion[] = [];
  const minSamples = Math.max(1, Math.round(sampleRateHz * minDurationSec));
  let startIndex = -1;

  for (let index = 0; index < values.length; index += 1) {
    if (values[index] >= threshold && startIndex === -1) {
      startIndex = index;
    }

    const isRegionEnd =
      startIndex !== -1 &&
      (values[index] < threshold || index === values.length - 1);

    if (isRegionEnd) {
      const endIndex = values[index] < threshold ? index - 1 : index;
      if (endIndex - startIndex + 1 >= minSamples) {
        regions.push({
          id: `${label}-${startIndex}`,
          startIndex,
          endIndex,
          startTime: startIndex / sampleRateHz,
          endTime: endIndex / sampleRateHz,
          label
        });
      }
      startIndex = -1;
    }
  }

  return regions;
}

function intervalsFromEvents(events: DetectedEvent[]) {
  const intervals: number[] = [];
  for (let index = 1; index < events.length; index += 1) {
    intervals.push(events[index].time - events[index - 1].time);
  }
  return intervals;
}

function qualityScore(values: number[], peaks: DetectedEvent[], intervals: number[]) {
  const amplitudeSpread = standardDeviation(values);
  const intervalStability = standardDeviation(intervals.length ? intervals : [0.75]);
  const eventDensity = peaks.length / Math.max(values.length, 1);

  const amplitudeTerm = Math.min(1, amplitudeSpread / 0.25);
  const stabilityTerm = 1 - Math.min(1, intervalStability / 0.2);
  const densityTerm = Math.min(1, eventDensity * 120);

  return Math.round((0.45 * amplitudeTerm + 0.35 * stabilityTerm + 0.2 * densityTerm) * 100);
}

export function detectSignalFeatures(
  values: number[],
  sampleRateHz: number,
  signalType: SignalType
): DetectionResult {
  const avg = mean(values);
  const sd = standardDeviation(values);

  let peaks: DetectedEvent[] = [];
  let troughs: DetectedEvent[] = [];
  let regions: DetectedRegion[] = [];

  if (signalType === "ecg") {
    peaks = localExtrema(values, sampleRateHz, "peak", avg + sd * 0.9, 0.28);
    troughs = localExtrema(values, sampleRateHz, "trough", avg - sd * 0.3, 0.18);
  } else if (signalType === "ppg") {
    peaks = localExtrema(values, sampleRateHz, "peak", avg + sd * 0.35, 0.4);
    troughs = localExtrema(values, sampleRateHz, "trough", avg - sd * 0.2, 0.25);
  } else if (signalType === "emg") {
    peaks = localExtrema(values, sampleRateHz, "peak", avg + sd * 0.7, 0.08);
    regions = thresholdRegions(values, sampleRateHz, avg + sd * 0.65, 0.12, "Activation");
  } else if (signalType === "respiration") {
    peaks = localExtrema(values, sampleRateHz, "peak", avg + sd * 0.1, 0.9);
    troughs = localExtrema(values, sampleRateHz, "trough", avg - sd * 0.1, 0.9);
  } else if (signalType === "motion") {
    peaks = localExtrema(values, sampleRateHz, "peak", avg + sd * 0.45, 0.18);
    troughs = localExtrema(values, sampleRateHz, "trough", avg - sd * 0.45, 0.18);
  } else {
    peaks = localExtrema(values, sampleRateHz, "peak", avg + sd * 0.3, 0.15);
    troughs = localExtrema(values, sampleRateHz, "trough", avg - sd * 0.3, 0.15);
    regions = thresholdRegions(values, sampleRateHz, avg + sd * 0.45, 0.18, "Threshold region");
  }

  const intervalsSec = intervalsFromEvents(peaks);

  return {
    signalType,
    peaks,
    troughs,
    regions,
    intervalsSec,
    qualityScore: qualityScore(values, peaks, intervalsSec)
  };
}
