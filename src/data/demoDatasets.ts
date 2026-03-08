import { CaseStudy, SignalChannel, SignalDataset } from "../types/signal";
import { biosignalPalette } from "../lib/theme/palette";

function mulberry32(seed: number) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(x: number, center: number, width: number, amplitude: number) {
  return amplitude * Math.exp(-((x - center) ** 2) / (2 * width * width));
}

function timeAxis(durationSec: number, sampleRateHz: number) {
  const count = Math.round(durationSec * sampleRateHz);
  return Array.from({ length: count }, (_, index) => index / sampleRateHz);
}

function createEcgWave(
  times: number[],
  heartRateBpm: number,
  seed: number,
  motion = 0
) {
  const random = mulberry32(seed);
  const values = new Array(times.length).fill(0);
  let beatTime = 0.35;
  const intervalBase = 60 / heartRateBpm;

  while (beatTime < times[times.length - 1] + 1) {
    const interval = intervalBase + (random() - 0.5) * 0.08;
    beatTime += interval;

    for (let index = 0; index < times.length; index += 1) {
      const t = times[index];
      values[index] += gaussian(t, beatTime - 0.18, 0.03, 0.08);
      values[index] += gaussian(t, beatTime - 0.035, 0.009, -0.16);
      values[index] += gaussian(t, beatTime, 0.012, 1.12);
      values[index] += gaussian(t, beatTime + 0.03, 0.009, -0.24);
      values[index] += gaussian(t, beatTime + 0.22, 0.065, 0.32);
    }
  }

  return values.map((value, index) => {
    const t = times[index];
    const wander = Math.sin(2 * Math.PI * 0.22 * t) * 0.05;
    const mains = Math.sin(2 * Math.PI * 60 * t) * 0.012;
    const motionArtifact =
      motion *
      (Math.sin(2 * Math.PI * 1.2 * t) * 0.12 +
        Math.sin(2 * Math.PI * 2.7 * t) * 0.08);
    const noise = (random() - 0.5) * (0.04 + motion * 0.08);
    return value + wander + mains + motionArtifact + noise;
  });
}

function createPpgWave(times: number[], bpm: number, seed: number) {
  const random = mulberry32(seed);
  const values = new Array(times.length).fill(0);
  let beatTime = 0.25;

  while (beatTime < times[times.length - 1] + 1) {
    const interval = 60 / bpm + (random() - 0.5) * 0.07;
    beatTime += interval;
    for (let index = 0; index < times.length; index += 1) {
      const t = times[index] - beatTime;
      if (t < 0 || t > 0.9) {
        continue;
      }
      const systolic = 1.1 * t * Math.exp(-9 * t);
      const notch = 0.23 * Math.exp(-((t - 0.24) ** 2) / 0.002);
      values[index] += systolic + notch;
    }
  }

  return values.map((value, index) => {
    const t = times[index];
    return (
      value +
      0.12 * Math.sin(2 * Math.PI * 0.12 * t) +
      0.02 * Math.sin(2 * Math.PI * 7 * t) +
      (random() - 0.5) * 0.03
    );
  });
}

function createRespiration(times: number[], bpm: number, seed: number) {
  const random = mulberry32(seed);
  return times.map((time) => {
    const depth = 0.9 + 0.18 * Math.sin(2 * Math.PI * 0.015 * time);
    const base =
      depth * Math.sin(2 * Math.PI * (bpm / 60) * time) +
      0.12 * Math.sin(2 * Math.PI * (bpm / 120) * time + 1.1);
    return base + (random() - 0.5) * 0.035;
  });
}

function createEmg(times: number[], seed: number) {
  const random = mulberry32(seed);
  const bursts = [
    [1.2, 2.1],
    [3.6, 4.1],
    [5.8, 6.9],
    [8.1, 9.7]
  ];

  return times.map((time) => {
    const burstLevel = bursts.some(([start, end]) => time >= start && time <= end)
      ? 1
      : 0.08;
    const carrier =
      Math.sin(2 * Math.PI * 38 * time) * 0.18 +
      Math.sin(2 * Math.PI * 74 * time) * 0.12 +
      Math.sin(2 * Math.PI * 112 * time) * 0.06;
    return burstLevel * carrier + (random() - 0.5) * 0.32 * burstLevel;
  });
}

function createMotionTrace(times: number[], seed: number) {
  const random = mulberry32(seed);
  return times.map((time) => {
    const gesture =
      gaussian(time, 4.3, 0.4, 1.6) -
      gaussian(time, 4.8, 0.2, 1.2) +
      gaussian(time, 8.5, 0.32, 1.25);
    return (
      gesture +
      0.4 * Math.sin(2 * Math.PI * 0.4 * time) +
      0.18 * Math.sin(2 * Math.PI * 3.2 * time) +
      (random() - 0.5) * 0.12
    );
  });
}

function createSynthetic(times: number[], seed: number) {
  const random = mulberry32(seed);
  return times.map((time) => {
    return (
      0.6 * Math.sin(2 * Math.PI * 2.2 * time) +
      0.28 * Math.sin(2 * Math.PI * 17 * time) +
      0.14 * Math.sin(2 * Math.PI * 31 * time) +
      gaussian(time, 5.3, 0.18, 1.5) -
      gaussian(time, 7.1, 0.14, 1.1) +
      (random() - 0.5) * 0.34
    );
  });
}

function channel(
  id: string,
  name: string,
  unit: string,
  color: string,
  values: number[]
): SignalChannel {
  return { id, name, unit, color, values };
}

function createDataset(dataset: Omit<SignalDataset, "channels"> & { channels: SignalChannel[] }) {
  return dataset;
}

const ecgTimes = timeAxis(14, 240);
const emgTimes = timeAxis(11, 400);
const ppgTimes = timeAxis(18, 120);
const respTimes = timeAxis(20, 60);
const motionTimes = timeAxis(12, 120);

export const demoDatasets: SignalDataset[] = [
  createDataset({
    id: "ecg-resting",
    title: "Resting ECG",
    shortLabel: "ECG Rest",
    description: "Lead-like resting trace with mild baseline wander and clean QRS structure.",
    context: "Short seated capture with stable rhythm and light respiration coupling.",
    signalType: "ecg",
    sampleRateHz: 240,
    durationSec: 14,
    fileName: "ecg_rest.csv",
    source: "demo",
    tags: ["cardiac", "resting", "clean rhythm"],
    suggestedPresetId: "ecg-review",
    defaultWindow: { start: 2.2, end: 8.2 },
    channels: [
      channel("ecg-main", "Lead II", "mV", biosignalPalette.white, createEcgWave(ecgTimes, 68, 11)),
      channel("ecg-ppg-ref", "Pulse reference", "a.u.", biosignalPalette.amber, createPpgWave(ecgTimes, 68, 12)),
      channel("ecg-resp", "Respiration belt", "a.u.", biosignalPalette.green, createRespiration(ecgTimes, 14, 13))
    ]
  }),
  createDataset({
    id: "ecg-motion",
    title: "Motion-corrupted ECG",
    shortLabel: "ECG Motion",
    description: "ECG trace with abrupt movement artifact and stronger mains interference.",
    context: "Wearable capture during light task movement.",
    signalType: "ecg",
    sampleRateHz: 240,
    durationSec: 14,
    fileName: "ecg_motion.csv",
    source: "demo",
    tags: ["artifact", "wearable", "motion noise"],
    suggestedPresetId: "cleanup-mode",
    defaultWindow: { start: 3.1, end: 9.6 },
    channels: [
      channel("ecg-motion-main", "Chest lead", "mV", biosignalPalette.white, createEcgWave(ecgTimes, 76, 21, 1)),
      channel("ecg-motion-accel", "Accel magnitude", "g", biosignalPalette.sky, createMotionTrace(ecgTimes, 22)),
      channel("ecg-motion-resp", "Respiration", "a.u.", biosignalPalette.green, createRespiration(ecgTimes, 16, 23))
    ]
  }),
  createDataset({
    id: "emg-burst",
    title: "EMG activation example",
    shortLabel: "EMG Burst",
    description: "Burst-style muscle activity with four activation windows.",
    context: "Forearm activation during repeated grip effort.",
    signalType: "emg",
    sampleRateHz: 400,
    durationSec: 11,
    fileName: "emg_burst.csv",
    source: "demo",
    tags: ["muscle", "activation", "threshold view"],
    suggestedPresetId: "emg-review",
    defaultWindow: { start: 1, end: 9.8 },
    channels: [
      channel("emg-main", "Flexor channel", "mV", biosignalPalette.roseSoft, createEmg(emgTimes, 31)),
      channel("emg-force", "Force proxy", "N", biosignalPalette.green, emgTimes.map((time) => {
        const envelope =
          gaussian(time, 1.55, 0.3, 0.8) +
          gaussian(time, 3.85, 0.22, 0.68) +
          gaussian(time, 6.3, 0.36, 0.92) +
          gaussian(time, 8.85, 0.48, 1.1);
        return envelope + Math.sin(time * 0.8) * 0.02;
      }))
    ]
  }),
  createDataset({
    id: "ppg-rest",
    title: "PPG resting pulse",
    shortLabel: "PPG Rest",
    description: "Finger PPG with clear systolic peaks and slow amplitude drift.",
    context: "Resting peripheral pulse capture from an optical sensor.",
    signalType: "ppg",
    sampleRateHz: 120,
    durationSec: 18,
    fileName: "ppg_rest.csv",
    source: "demo",
    tags: ["pulse", "wearable", "amplitude drift"],
    suggestedPresetId: "ppg-review",
    defaultWindow: { start: 4, end: 12 },
    channels: [
      channel("ppg-main", "Optical pulse", "a.u.", biosignalPalette.sky, createPpgWave(ppgTimes, 63, 41)),
      channel("ppg-resp", "Respiration", "a.u.", biosignalPalette.green, createRespiration(ppgTimes, 13, 42))
    ]
  }),
  createDataset({
    id: "respiration-belt",
    title: "Respiration trend analysis",
    shortLabel: "Respiration",
    description: "Slow respiratory rhythm with mild drift and depth change.",
    context: "Belt transducer during paced breathing.",
    signalType: "respiration",
    sampleRateHz: 60,
    durationSec: 20,
    fileName: "respiration.csv",
    source: "demo",
    tags: ["respiration", "paced breathing", "slow drift"],
    suggestedPresetId: "respiration-review",
    defaultWindow: { start: 3.5, end: 16.5 },
    channels: [
      channel("resp-main", "Thoracic belt", "a.u.", biosignalPalette.green, createRespiration(respTimes, 11, 51)),
      channel("resp-motion", "Motion drift", "a.u.", biosignalPalette.white, respTimes.map((time) => {
        return 0.3 * Math.sin(time * 0.45) + gaussian(time, 12, 1.8, 0.9);
      }))
    ]
  }),
  createDataset({
    id: "synthetic-noise",
    title: "Noisy synthetic trace",
    shortLabel: "Synthetic",
    description: "Composite signal with transients, multi-band content, and broadband noise.",
    context: "Generic analysis sandbox for filters, thresholds, and compare mode.",
    signalType: "synthetic",
    sampleRateHz: 120,
    durationSec: 12,
    fileName: "synthetic_noise.csv",
    source: "demo",
    tags: ["synthetic", "compare", "multi-band noise"],
    suggestedPresetId: "compare-mode",
    defaultWindow: { start: 1.2, end: 9.4 },
    channels: [
      channel("syn-main", "Analog channel A", "a.u.", biosignalPalette.light, createSynthetic(motionTimes, 61)),
      channel("syn-secondary", "Analog channel B", "a.u.", biosignalPalette.roseSoft, createSynthetic(motionTimes, 62).map((value, index) => {
        return value * 0.72 + 0.2 * Math.sin(index / 8);
      })),
      channel("syn-motion", "Physio motion proxy", "a.u.", biosignalPalette.amber, createMotionTrace(motionTimes, 63))
    ]
  })
];

export const caseStudies: CaseStudy[] = [
  {
    id: "case-ecg",
    datasetId: "ecg-resting",
    title: "Rhythm review",
    strap: "Resting electrical trace",
    summary: "Inspect morphology, highlight R-peaks, and quantify beat spacing without leaving the browser.",
    signalType: "ecg",
    accent: biosignalPalette.roseSoft,
    mood: "Quiet, stable, clinical",
    suggestedActions: ["Load cardiac review preset", "Inspect RR intervals", "Export report"]
  },
  {
    id: "case-motion",
    datasetId: "ecg-motion",
    title: "Artifact cleanup",
    strap: "Wearable motion contamination",
    summary: "Contrast raw and cleaned views, then confirm which peaks survive artifact suppression.",
    signalType: "ecg",
    accent: biosignalPalette.roseSoft,
    mood: "Restless, layered, wearable",
    suggestedActions: ["Enable cleanup mode", "Compare raw versus filtered", "Inspect dominant frequency"]
  },
  {
    id: "case-emg",
    datasetId: "emg-burst",
    title: "Burst segmentation",
    strap: "Repeated muscle recruitment",
    summary: "Use rectified envelopes and threshold regions to mark activation timing and total effort.",
    signalType: "emg",
    accent: biosignalPalette.amber,
    mood: "Tactile, dense, kinetic",
    suggestedActions: ["Load muscle activity review", "Open annotations", "Check RMS"]
  },
  {
    id: "case-ppg",
    datasetId: "ppg-rest",
    title: "Pulse amplitude drift",
    strap: "Optical pulse monitoring",
    summary: "Follow beat-to-beat spacing, amplitude drift, and low-frequency respiration influence.",
    signalType: "ppg",
    accent: biosignalPalette.roseSoft,
    mood: "Soft, optical, peripheral",
    suggestedActions: ["Inspect pulse rate", "View spectrum", "Compare windows"]
  },
  {
    id: "case-resp",
    datasetId: "respiration-belt",
    title: "Cycle pacing",
    strap: "Respiratory trend tracking",
    summary: "Measure breathing rate, observe depth changes, and handle slow drift in the same view.",
    signalType: "respiration",
    accent: biosignalPalette.green,
    mood: "Slow, expansive, paced",
    suggestedActions: ["Load respiration review", "Zoom the mid segment", "Export summary"]
  }
];

export const architectureNotes = [
  {
    title: "Typed signal model",
    body: "Each recording is normalized into a dataset model with signal type, sample rate, channels, default review windows, and curated presets."
  },
  {
    title: "Client-side processing chain",
    body: "Filtering, detection, spectral transforms, annotations, and report assembly run in the browser so the application stays static-friendly."
  },
  {
    title: "Studio-oriented state",
    body: "The workspace keeps filters, active windows, annotations, comparisons, and notes in a dedicated store so the analysis flow feels like an instrument, not a form."
  },
  {
    title: "Report output",
    body: "The report export combines metrics, annotations, and rendered plot snapshots into a branded PDF with a clear non-clinical disclaimer."
  }
];
