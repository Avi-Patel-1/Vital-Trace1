import { FilterSettings, QualityFlag, QualityReview, QualitySegment, SignalType } from "../../types/signal";

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

function rms(values: number[]) {
  return Math.sqrt(
    values.reduce((sum, value) => sum + value * value, 0) / Math.max(values.length, 1)
  );
}

function derivativeEnergy(values: number[]) {
  if (values.length < 2) {
    return 0;
  }

  let total = 0;
  for (let index = 1; index < values.length; index += 1) {
    total += Math.abs(values[index] - values[index - 1]);
  }
  return total / (values.length - 1);
}

function ratingFromScore(score: number): QualityReview["rating"] {
  if (score >= 82) {
    return "excellent";
  }
  if (score >= 66) {
    return "good";
  }
  if (score >= 46) {
    return "mixed";
  }
  return "poor";
}

function presetSuggestion(signalType: SignalType, dominantIssue: QualityReview["dominantIssue"]) {
  if (dominantIssue === "motion artifact" || dominantIssue === "baseline drift" || dominantIssue === "high-frequency noise") {
    return "cleanup-mode";
  }

  return `${signalType}-review`;
}

function buildFlagNote(kind: QualityFlag["kind"]) {
  switch (kind) {
    case "motion artifact":
      return "Rapid shape shift and unstable amplitude.";
    case "clipping":
      return "Signal ceiling reached in this segment.";
    case "flatline":
      return "Very low variation or dropout.";
    case "baseline drift":
      return "Slow offset movement dominates the segment.";
    case "high-frequency noise":
      return "Fine-grain noise is stronger than expected.";
    case "weak signal":
      return "Amplitude stays low relative to the recording.";
    case "unstable":
      return "Signal behavior changes sharply across the segment.";
    default:
      return "Review this segment.";
  }
}

export function qualityPresetNote(filters: FilterSettings) {
  if (filters.notchHz || filters.bandPassLowHz || filters.bandPassHighHz) {
    return "Current filter chain already targets cleanup.";
  }

  if (filters.baselineCorrection || filters.smoothingWindow > 1) {
    return "Current view has some cleanup enabled.";
  }

  return "Cleanup View may help clarify flagged sections.";
}

export function computeQualityReview(
  raw: number[],
  filtered: number[],
  sampleRateHz: number,
  signalType: SignalType
): QualityReview {
  const segmentLength = Math.max(Math.round(sampleRateHz * 1.2), 48);
  const globalAbs = Math.max(...raw.map((value) => Math.abs(value)), 1e-6);
  const globalStd = standardDeviation(filtered) || 1e-6;
  const globalDerivative = derivativeEnergy(filtered) || 1e-6;
  const flags: QualityFlag[] = [];
  const timeline: QualitySegment[] = [];

  for (let start = 0; start < filtered.length; start += segmentLength) {
    const end = Math.min(filtered.length, start + segmentLength);
    const rawSlice = raw.slice(start, end);
    const filteredSlice = filtered.slice(start, end);
    if (!filteredSlice.length) {
      continue;
    }

    const maxValue = Math.max(...rawSlice.map((value) => Math.abs(value)), 0);
    const amplitude = Math.max(...filteredSlice) - Math.min(...filteredSlice);
    const rmsValue = rms(filteredSlice);
    const derivative = derivativeEnergy(filteredSlice);
    const drift =
      Math.abs(mean(rawSlice) - mean(filteredSlice)) / Math.max(globalAbs, 1e-6);
    const clippingRatio =
      rawSlice.filter((value) => Math.abs(value) >= globalAbs * 0.97).length /
      rawSlice.length;

    let flatlineSamples = 0;
    for (let index = 1; index < rawSlice.length; index += 1) {
      if (Math.abs(rawSlice[index] - rawSlice[index - 1]) <= globalAbs * 0.0025) {
        flatlineSamples += 1;
      }
    }
    const flatlineRatio = flatlineSamples / Math.max(rawSlice.length - 1, 1);

    const labels: QualitySegment["labels"] = [];
    let score = 100;

    if (drift > 0.18) {
      labels.push("baseline drift");
      score -= 15;
    }
    if (clippingRatio > 0.08) {
      labels.push("clipping");
      score -= 22;
    }
    if (flatlineRatio > 0.72) {
      labels.push("flatline");
      score -= 28;
    }
    if (amplitude < globalStd * 0.4 || rmsValue < globalAbs * 0.05) {
      labels.push("weak signal");
      score -= 14;
    }
    if (derivative > globalDerivative * 1.65) {
      labels.push("high-frequency noise");
      score -= 16;
    }
    if (maxValue > globalAbs * 0.92 && derivative > globalDerivative * 1.35) {
      labels.push("motion artifact");
      score -= 18;
    }
    if (standardDeviation(filteredSlice) > globalStd * 1.75) {
      labels.push("unstable");
      score -= 12;
    }

    const boundedScore = Math.max(6, Math.min(100, Math.round(score)));
    const startTime = start / sampleRateHz;
    const endTime = end / sampleRateHz;

    timeline.push({
      id: `quality-${start}`,
      startTime,
      endTime,
      score: boundedScore,
      labels
    });

    labels.forEach((kind, index) => {
      flags.push({
        id: `${kind}-${start}-${index}`,
        kind,
        startTime,
        endTime,
        severity: boundedScore < 38 ? "high" : boundedScore < 62 ? "medium" : "low",
        note: buildFlagNote(kind)
      });
    });
  }

  const overallScore = Math.round(
    timeline.reduce((sum, segment) => sum + segment.score, 0) / Math.max(timeline.length, 1)
  );

  const issueCounts = flags.reduce<Record<string, number>>((counts, flag) => {
    counts[flag.kind] = (counts[flag.kind] ?? 0) + 1;
    return counts;
  }, {});
  const dominantIssue =
    (Object.entries(issueCounts).sort((left, right) => right[1] - left[1])[0]?.[0] as
      | QualityReview["dominantIssue"]
      | undefined) ?? null;

  return {
    overallScore,
    rating: ratingFromScore(overallScore),
    dominantIssue,
    suggestedPresetId: presetSuggestion(signalType, dominantIssue),
    timeline,
    flags: flags.sort((left, right) => left.startTime - right.startTime)
  };
}
