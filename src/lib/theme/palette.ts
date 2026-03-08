import type { NotebookCategory } from "../../types/signal";

export const biosignalPalette = {
  white: "#FFFFFF",
  black: "#000000",
  blackSoft: "#05070A",
  blackLift: "#081018",
  blackPanel: "#0E161D",
  cyan: "#FFFFFF",
  sky: "#D24C74",
  amber: "#F3A873",
  green: "#8BC8A0",
  light: "#FFFFFF",
  rose: "#853953",
  roseSoft: "#D24C74",
  roseMuted: "#E7A0B3",
  plum: "#8E4C74",
  plumSoft: "#B46A84",
  mist: "#F6EEF2",
  smoke: "#D18A9F",
  charcoal: "#000000",
  charcoalDeep: "#05070A",
  charcoalLift: "#081018",
  charcoalSurface: "#0E161D"
} as const;

export const signalTraceColors = [
  biosignalPalette.white,
  biosignalPalette.roseSoft,
  biosignalPalette.amber,
  biosignalPalette.green,
  biosignalPalette.plum,
  biosignalPalette.roseMuted
];

export const reviewPalette = {
  scoreHigh: biosignalPalette.green,
  scoreMedium: biosignalPalette.roseSoft,
  scoreLow: biosignalPalette.amber,
  scoreCritical: biosignalPalette.rose,
  compareOverlay: "rgba(212, 76, 116, 0.68)",
  selectionFill: "rgba(210, 76, 116, 0.12)",
  selectionStroke: "rgba(255, 255, 255, 0.4)",
  peakGuide: "rgba(255, 255, 255, 0.18)",
  regionFill: "rgba(210, 76, 116, 0.08)",
  reportNoticeFill: "rgba(133, 57, 83, 0.12)",
  reportNoticeBorder: "rgba(210, 76, 116, 0.32)"
} as const;

export const notebookCategoryColors: Record<NotebookCategory, string> = {
  noise: biosignalPalette.amber,
  "motion artifact": biosignalPalette.roseSoft,
  "peak cluster": biosignalPalette.white,
  "high activity": biosignalPalette.roseSoft,
  "recovery segment": biosignalPalette.green,
  "notable change": biosignalPalette.rose,
  custom: biosignalPalette.plum
};
