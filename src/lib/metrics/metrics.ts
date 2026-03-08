import {
  DetectionResult,
  MetricCard,
  SignalType,
  SpectrumPoint,
  TimeRange
} from "../../types/signal";
import { formatMetric, formatPercent } from "../formatting/format";

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
  const power =
    values.reduce((sum, value) => sum + value * value, 0) / Math.max(values.length, 1);
  return Math.sqrt(power);
}

function zeroCrossings(values: number[]) {
  let total = 0;
  for (let index = 1; index < values.length; index += 1) {
    if (
      (values[index - 1] <= 0 && values[index] > 0) ||
      (values[index - 1] >= 0 && values[index] < 0)
    ) {
      total += 1;
    }
  }
  return total;
}

function dominantFrequency(spectrum: SpectrumPoint[]) {
  return spectrum.reduce(
    (best, point) => (point.amplitude > best.amplitude ? point : best),
    spectrum[0] ?? { frequency: 0, amplitude: 0 }
  );
}

function bandEnergy(spectrum: SpectrumPoint[], lowHz: number, highHz: number) {
  return spectrum
    .filter((point) => point.frequency >= lowHz && point.frequency < highHz)
    .reduce((sum, point) => sum + point.amplitude, 0);
}

export function computeMetrics(
  values: number[],
  sampleRateHz: number,
  signalType: SignalType,
  detection: DetectionResult,
  spectrum: SpectrumPoint[],
  selectedRange: TimeRange
): MetricCard[] {
  const avg = mean(values);
  const sd = standardDeviation(values);
  const rootMeanSquare = rms(values);
  const dominant = dominantFrequency(spectrum);
  const intervals = detection.intervalsSec;
  const intervalMean =
    intervals.reduce((sum, value) => sum + value, 0) / Math.max(intervals.length, 1);
  const lowBand = bandEnergy(spectrum, 0, 5);
  const midBand = bandEnergy(spectrum, 5, 15);
  const highBand = bandEnergy(spectrum, 15, 40);
  const totalBand = lowBand + midBand + highBand || 1;

  const cards: MetricCard[] = [
    {
      id: "quality",
      label: "Signal quality",
      value: formatPercent(detection.qualityScore),
      tone: "accent",
      note: "Regularity and amplitude stability"
    },
    {
      id: "window",
      label: "Selected window",
      value: `${formatMetric(selectedRange.end - selectedRange.start, 1)} s`,
      note: "Active analysis span"
    },
    {
      id: "rms",
      label: "RMS",
      value: formatMetric(rootMeanSquare, 3),
      note: "Windowed energy"
    },
    {
      id: "spread",
      label: "Std. dev.",
      value: formatMetric(sd, 3),
      note: "Amplitude spread"
    },
    {
      id: "dominant",
      label: "Dominant band",
      value: `${formatMetric(dominant.frequency, 1)} Hz`,
      note: "Highest spectral amplitude"
    }
  ];

  if (signalType === "ecg" || signalType === "ppg") {
    const bpm = intervalMean ? 60 / intervalMean : 0;
    const variability = standardDeviation(intervals) * 1000;
    cards.push(
      {
        id: "rate",
        label: signalType === "ecg" ? "Heart rate" : "Pulse rate",
        value: `${formatMetric(bpm, 0)} bpm`,
        tone: "warm",
        note: "Derived from detected intervals"
      },
      {
        id: "interval",
        label: "Inter-beat interval",
        value: `${formatMetric(intervalMean * 1000, 0)} ms`,
        note: "Mean spacing between peaks"
      },
      {
        id: "variability",
        label: "Beat variability",
        value: `${formatMetric(variability, 0)} ms`,
        note: "Simple interval spread"
      }
    );
  } else if (signalType === "emg") {
    const activationDuration = detection.regions.reduce(
      (sum, region) => sum + (region.endTime - region.startTime),
      0
    );
    cards.push(
      {
        id: "activations",
        label: "Activations",
        value: `${detection.regions.length}`,
        note: "Threshold segments"
      },
      {
        id: "activation-duration",
        label: "Active duration",
        value: `${formatMetric(activationDuration, 1)} s`,
        tone: "warm",
        note: "Total time above threshold"
      },
      {
        id: "mean-activity",
        label: "Mean activity",
        value: formatMetric(avg, 3),
        note: "Average rectified level"
      }
    );
  } else if (signalType === "respiration") {
    const breathingRate = intervalMean ? 60 / intervalMean : 0;
    cards.push(
      {
        id: "cycles",
        label: "Detected cycles",
        value: `${detection.peaks.length}`,
        note: "Respiratory peaks in window"
      },
      {
        id: "rate",
        label: "Breathing rate",
        value: `${formatMetric(breathingRate, 1)} bpm`,
        tone: "warm",
        note: "Peak-to-peak estimate"
      }
    );
  } else {
    cards.push(
      {
        id: "peaks",
        label: "Peaks",
        value: `${detection.peaks.length}`,
        note: "Detected local maxima"
      },
      {
        id: "zero-crossings",
        label: "Zero crossings",
        value: `${zeroCrossings(values)}`,
        note: "Sign changes in window"
      }
    );
  }

  cards.push(
    {
      id: "low-band",
      label: "0-5 Hz energy",
      value: formatPercent((lowBand / totalBand) * 100),
      note: "Slow-wave contribution"
    },
    {
      id: "mid-band",
      label: "5-15 Hz energy",
      value: formatPercent((midBand / totalBand) * 100),
      note: "Mid-band contribution"
    },
    {
      id: "high-band",
      label: "15-40 Hz energy",
      value: formatPercent((highBand / totalBand) * 100),
      note: "High-band contribution"
    }
  );

  return cards;
}
