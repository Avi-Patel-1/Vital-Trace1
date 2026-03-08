import { SignalChannel, SignalDataset, SyntheticSignalConfig } from "../../types/signal";
import { slugify } from "../formatting/format";
import { biosignalPalette } from "../theme/palette";

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
  const count = Math.max(2, Math.round(durationSec * sampleRateHz));
  return Array.from({ length: count }, (_, index) => index / sampleRateHz);
}

function createChannel(
  id: string,
  name: string,
  unit: string,
  color: string,
  values: number[]
): SignalChannel {
  return { id, name, unit, color, values };
}

function applyArtifacts(
  values: number[],
  times: number[],
  config: SyntheticSignalConfig,
  seed: number
) {
  const random = mulberry32(seed);
  const clipLimit = Math.max(0.2, config.amplitude * Math.max(config.clipping, 0.18));

  return values.map((value, index) => {
    const time = times[index];
    const drift =
      config.driftLevel * config.amplitude * Math.sin(2 * Math.PI * 0.06 * time + 0.4);
    const motion =
      config.motionArtifact *
      config.amplitude *
      (Math.sin(2 * Math.PI * 1.25 * time) * 0.26 +
        Math.sin(2 * Math.PI * 2.7 * time + 0.4) * 0.12);
    const noise = (random() - 0.5) * config.noiseLevel * config.amplitude;
    const next = value + drift + motion + noise;

    if (config.clipping <= 0) {
      return next;
    }

    return Math.max(-clipLimit, Math.min(clipLimit, next));
  });
}

function buildEcg(times: number[], config: SyntheticSignalConfig, seed: number) {
  const random = mulberry32(seed);
  const values = new Array(times.length).fill(0);
  const intervalBase = 60 / Math.max(config.rateBpm, 30);
  let beatTime = 0.35;

  while (beatTime < times[times.length - 1] + 1) {
    beatTime += intervalBase + (random() - 0.5) * 0.08;

    for (let index = 0; index < times.length; index += 1) {
      const time = times[index];
      values[index] += gaussian(time, beatTime - 0.18, 0.03, 0.08 * config.amplitude);
      values[index] += gaussian(time, beatTime - 0.035, 0.009, -0.16 * config.amplitude);
      values[index] += gaussian(time, beatTime, 0.012, 1.06 * config.amplitude);
      values[index] += gaussian(time, beatTime + 0.03, 0.009, -0.24 * config.amplitude);
      values[index] += gaussian(time, beatTime + 0.22, 0.065, 0.28 * config.amplitude);
    }
  }

  return applyArtifacts(values, times, config, seed + 1);
}

function buildPpg(times: number[], config: SyntheticSignalConfig, seed: number) {
  const random = mulberry32(seed);
  const values = new Array(times.length).fill(0);
  let beatTime = 0.25;

  while (beatTime < times[times.length - 1] + 1) {
    beatTime += 60 / Math.max(config.rateBpm, 28) + (random() - 0.5) * 0.06;
    for (let index = 0; index < times.length; index += 1) {
      const offset = times[index] - beatTime;
      if (offset < 0 || offset > 0.9) {
        continue;
      }
      const systolic = config.amplitude * 1.1 * offset * Math.exp(-8.2 * offset);
      const notch = config.amplitude * 0.22 * Math.exp(-((offset - 0.24) ** 2) / 0.0025);
      values[index] += systolic + notch;
    }
  }

  return applyArtifacts(values, times, config, seed + 1);
}

function buildRespiration(times: number[], config: SyntheticSignalConfig, seed: number) {
  const random = mulberry32(seed);
  const rateHz = Math.max(config.rateBpm / 60, 0.03);
  const values = times.map((time) => {
    const depth = config.amplitude * (0.92 + 0.18 * Math.sin(2 * Math.PI * 0.02 * time));
    return (
      depth * Math.sin(2 * Math.PI * rateHz * time) +
      0.14 * config.amplitude * Math.sin(2 * Math.PI * rateHz * 0.5 * time + 1.1) +
      (random() - 0.5) * config.noiseLevel * 0.16
    );
  });

  return applyArtifacts(values, times, config, seed + 1);
}

function buildEmg(times: number[], config: SyntheticSignalConfig, seed: number) {
  const random = mulberry32(seed);
  const values = times.map((time) => {
    const burstGate =
      Math.sin(2 * Math.PI * (config.burstDensity / Math.max(config.durationSec, 1)) * time) > 0.35
        ? 1
        : 0.14;
    const carrier =
      Math.sin(2 * Math.PI * 38 * time) * 0.22 +
      Math.sin(2 * Math.PI * 74 * time) * 0.12 +
      Math.sin(2 * Math.PI * 118 * time) * 0.08;

    return burstGate * carrier * config.amplitude + (random() - 0.5) * 0.24 * burstGate;
  });

  return applyArtifacts(values, times, config, seed + 1);
}

function buildGeneric(times: number[], config: SyntheticSignalConfig, seed: number) {
  const random = mulberry32(seed);
  const baseFrequency = Math.max(config.rateBpm / 60, 0.2);
  const values = times.map((time) => {
    return (
      Math.sin(2 * Math.PI * baseFrequency * time) * config.amplitude * 0.7 +
      Math.sin(2 * Math.PI * config.secondaryFrequencyHz * time) * config.amplitude * 0.24 +
      gaussian(time, config.durationSec * 0.42, 0.22, config.amplitude * 0.85) -
      gaussian(time, config.durationSec * 0.68, 0.18, config.amplitude * 0.66) +
      (random() - 0.5) * config.noiseLevel * 0.2
    );
  });

  return applyArtifacts(values, times, config, seed + 1);
}

export const defaultSyntheticConfig: SyntheticSignalConfig = {
  title: "Synthetic session",
  signalType: "ecg",
  durationSec: 18,
  sampleRateHz: 240,
  rateBpm: 72,
  amplitude: 1,
  noiseLevel: 0.16,
  driftLevel: 0.16,
  clipping: 0,
  motionArtifact: 0.12,
  burstDensity: 4,
  secondaryFrequencyHz: 12
};

export function configForSyntheticPreset(
  signalType: SyntheticSignalConfig["signalType"]
): SyntheticSignalConfig {
  if (signalType === "emg") {
    return {
      ...defaultSyntheticConfig,
      title: "Synthetic EMG",
      signalType,
      sampleRateHz: 400,
      durationSec: 12,
      rateBpm: 90,
      noiseLevel: 0.22,
      driftLevel: 0.08,
      motionArtifact: 0.18,
      burstDensity: 6,
      secondaryFrequencyHz: 42
    };
  }

  if (signalType === "ppg") {
    return {
      ...defaultSyntheticConfig,
      title: "Synthetic PPG",
      signalType,
      sampleRateHz: 120,
      durationSec: 20,
      rateBpm: 64,
      noiseLevel: 0.1,
      driftLevel: 0.18,
      motionArtifact: 0.08,
      secondaryFrequencyHz: 6
    };
  }

  if (signalType === "respiration") {
    return {
      ...defaultSyntheticConfig,
      title: "Synthetic respiration",
      signalType,
      sampleRateHz: 60,
      durationSec: 24,
      rateBpm: 12,
      amplitude: 1.2,
      noiseLevel: 0.08,
      driftLevel: 0.1,
      motionArtifact: 0.04,
      secondaryFrequencyHz: 1.1
    };
  }

  if (signalType === "generic" || signalType === "motion" || signalType === "synthetic") {
    return {
      ...defaultSyntheticConfig,
      title: "Synthetic analog",
      signalType,
      sampleRateHz: 140,
      durationSec: 16,
      rateBpm: 36,
      noiseLevel: 0.22,
      driftLevel: 0.12,
      motionArtifact: 0.16,
      secondaryFrequencyHz: 18
    };
  }

  return {
    ...defaultSyntheticConfig,
    title: "Synthetic ECG",
    signalType: "ecg"
  };
}

export function generateSyntheticDataset(config: SyntheticSignalConfig) {
  const times = timeAxis(config.durationSec, config.sampleRateHz);
  let primaryValues: number[];
  let secondaryValues: number[];
  let tertiaryValues: number[];

  if (config.signalType === "ecg") {
    primaryValues = buildEcg(times, config, 31);
    secondaryValues = buildPpg(times, { ...config, amplitude: config.amplitude * 0.72 }, 32);
    tertiaryValues = buildRespiration(
      times,
      { ...config, rateBpm: 14, amplitude: config.amplitude * 0.42, noiseLevel: 0.06 },
      33
    );
  } else if (config.signalType === "ppg") {
    primaryValues = buildPpg(times, config, 41);
    secondaryValues = buildRespiration(
      times,
      { ...config, rateBpm: 13, amplitude: config.amplitude * 0.4 },
      42
    );
    tertiaryValues = buildGeneric(times, { ...config, amplitude: config.amplitude * 0.34 }, 43);
  } else if (config.signalType === "respiration") {
    primaryValues = buildRespiration(times, config, 51);
    secondaryValues = buildGeneric(times, { ...config, amplitude: config.amplitude * 0.28 }, 52);
    tertiaryValues = buildGeneric(
      times,
      { ...config, amplitude: config.amplitude * 0.18, motionArtifact: config.motionArtifact * 1.2 },
      53
    );
  } else if (config.signalType === "emg") {
    primaryValues = buildEmg(times, config, 61);
    secondaryValues = buildGeneric(times, { ...config, amplitude: config.amplitude * 0.44 }, 62);
    tertiaryValues = buildGeneric(
      times,
      { ...config, amplitude: config.amplitude * 0.22, secondaryFrequencyHz: 8 },
      63
    );
  } else {
    primaryValues = buildGeneric(times, config, 71);
    secondaryValues = buildGeneric(
      times,
      { ...config, amplitude: config.amplitude * 0.66, secondaryFrequencyHz: config.secondaryFrequencyHz * 0.6 },
      72
    );
    tertiaryValues = buildGeneric(
      times,
      { ...config, amplitude: config.amplitude * 0.34, motionArtifact: config.motionArtifact * 1.4 },
      73
    );
  }

  return {
    id: slugify(`${config.title}-${Date.now()}`),
    title: config.title,
    shortLabel: config.title,
    description: "Synthetic recording with adjustable artifacts and rate.",
    context: "Generated inside the synthetic lab.",
    signalType: config.signalType,
    sampleRateHz: config.sampleRateHz,
    durationSec: config.durationSec,
    fileName: `${slugify(config.title)}.json`,
    source: "upload" as const,
    tags: ["synthetic", "generated"],
    suggestedPresetId: config.signalType === "generic" ? "compare-mode" : `${config.signalType}-review`,
    defaultWindow: {
      start: 0,
      end: Math.min(config.durationSec, 10)
    },
    channels: [
      createChannel("primary", "Primary trace", "a.u.", biosignalPalette.light, primaryValues),
      createChannel("secondary", "Reference", "a.u.", biosignalPalette.roseSoft, secondaryValues),
      createChannel("tertiary", "Context", "a.u.", biosignalPalette.plumSoft, tertiaryValues)
    ]
  } satisfies SignalDataset;
}
