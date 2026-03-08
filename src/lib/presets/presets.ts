import { FilterSettings, PresetMode } from "../../types/signal";
import { defaultFilterSettings } from "../filters/filterPipeline";

export const presetModes: PresetMode[] = [
  {
    id: "ecg-review",
    name: "Cardiac review",
    shortDescription: "Emphasize R-peak timing and interval stability.",
    signalTypes: ["ecg"],
    filters: {
      baselineCorrection: true,
      bandPassLowHz: 0.7,
      bandPassHighHz: 30,
      notchHz: 60
    },
    defaultTab: "waveform",
    focus: ["R-peaks", "RR timing", "motion contamination"]
  },
  {
    id: "emg-review",
    name: "Muscle activity review",
    shortDescription: "Rectified envelope with activation segmentation.",
    signalTypes: ["emg"],
    filters: {
      bandPassLowHz: 20,
      bandPassHighHz: 180,
      rectify: true,
      envelope: true
    },
    defaultTab: "waveform",
    focus: ["Burst timing", "RMS", "activation span"]
  },
  {
    id: "ppg-review",
    name: "Pulse trend review",
    shortDescription: "Pulse onset, beat spacing, and amplitude changes.",
    signalTypes: ["ppg"],
    filters: {
      lowPassHz: 8,
      highPassHz: 0.35,
      baselineCorrection: true,
      smoothingWindow: 5
    },
    defaultTab: "waveform",
    focus: ["Pulse rate", "amplitude drift", "beat spacing"]
  },
  {
    id: "respiration-review",
    name: "Respiration review",
    shortDescription: "Slow-cycle trend tracking and drift handling.",
    signalTypes: ["respiration"],
    filters: {
      lowPassHz: 2,
      highPassHz: 0.04,
      baselineCorrection: true,
      smoothingWindow: 7
    },
    defaultTab: "waveform",
    focus: ["Cycle timing", "depth", "trend drift"]
  },
  {
    id: "cleanup-mode",
    name: "Signal cleanup mode",
    shortDescription: "Noise suppression with raw-versus-filtered comparison.",
    signalTypes: ["ecg", "emg", "ppg", "respiration", "generic", "motion", "synthetic"],
    filters: {
      baselineCorrection: true,
      notchHz: 60,
      smoothingWindow: 4
    },
    defaultTab: "spectrum",
    focus: ["Line noise", "baseline drift", "before/after comparison"]
  },
  {
    id: "compare-mode",
    name: "Compare mode",
    shortDescription: "Overlay two windows or two recordings with normalization.",
    signalTypes: ["ecg", "emg", "ppg", "respiration", "generic", "motion", "synthetic"],
    filters: {
      normalize: true
    },
    defaultTab: "compare",
    focus: ["Shape alignment", "difference view", "relative amplitude"]
  }
];

export function filtersForPreset(presetId: string): FilterSettings {
  const preset = presetModes.find((item) => item.id === presetId);
  return {
    ...defaultFilterSettings,
    ...(preset?.filters ?? {})
  };
}
