export type SignalType =
  | "ecg"
  | "emg"
  | "ppg"
  | "respiration"
  | "generic"
  | "motion"
  | "synthetic";

export type AppTheme = "dusk" | "paper";

export interface SignalChannel {
  id: string;
  name: string;
  unit: string;
  color: string;
  values: number[];
  derived?: boolean;
}

export interface SignalDataset {
  id: string;
  title: string;
  shortLabel: string;
  description: string;
  context: string;
  signalType: SignalType;
  sampleRateHz: number;
  durationSec: number;
  fileName: string;
  source: "demo" | "upload";
  tags: string[];
  channels: SignalChannel[];
  suggestedPresetId: string;
  defaultWindow?: TimeRange;
}

export interface TimeRange {
  start: number;
  end: number;
}

export interface FilterSettings {
  smoothingWindow: number;
  movingAverageWindow: number;
  lowPassHz: number | null;
  highPassHz: number | null;
  bandPassLowHz: number | null;
  bandPassHighHz: number | null;
  notchHz: number | null;
  baselineCorrection: boolean;
  detrend: boolean;
  normalize: boolean;
  rectify: boolean;
  envelope: boolean;
}

export interface MetricCard {
  id: string;
  label: string;
  value: string;
  note?: string;
  tone?: "neutral" | "accent" | "warm";
}

export interface DetectedEvent {
  id: string;
  kind: "peak" | "trough" | "marker";
  index: number;
  time: number;
  amplitude: number;
  label: string;
}

export interface DetectedRegion {
  id: string;
  startIndex: number;
  endIndex: number;
  startTime: number;
  endTime: number;
  label: string;
}

export interface DetectionResult {
  signalType: SignalType;
  peaks: DetectedEvent[];
  troughs: DetectedEvent[];
  regions: DetectedRegion[];
  intervalsSec: number[];
  qualityScore: number;
}

export interface SpectrumPoint {
  frequency: number;
  amplitude: number;
}

export interface SpectrogramGrid {
  times: number[];
  frequencies: number[];
  values: number[][];
}

export interface Annotation {
  id: string;
  type: "marker" | "range";
  label: string;
  note: string;
  time: number;
  endTime?: number;
  color: string;
}

export interface PresetMode {
  id: string;
  name: string;
  shortDescription: string;
  signalTypes: SignalType[];
  filters: Partial<FilterSettings>;
  defaultTab: StudioTab;
  focus: string[];
}

export interface ProcessedChannel {
  id: string;
  name: string;
  unit: string;
  color: string;
  raw: number[];
  filtered: number[];
  min: number;
  max: number;
}

export interface ProcessedAnalysis {
  dataset: SignalDataset;
  selectedChannel: ProcessedChannel;
  processedChannels: ProcessedChannel[];
  detection: DetectionResult;
  metrics: MetricCard[];
  spectrumBefore: SpectrumPoint[];
  spectrumAfter: SpectrumPoint[];
  spectrogram: SpectrogramGrid;
  selectedRange: TimeRange;
  selectedIndexes: { start: number; end: number };
  fullSelectedRaw: number[];
  fullSelectedFiltered: number[];
  windowRawValues: number[];
  windowFilteredValues: number[];
  timeAxis: number[];
}

export type NotebookCategory =
  | "noise"
  | "motion artifact"
  | "peak cluster"
  | "high activity"
  | "recovery segment"
  | "notable change"
  | "custom";

export interface NotebookEntry {
  id: string;
  datasetId: string;
  label: string;
  note: string;
  category: NotebookCategory;
  startTime: number;
  endTime: number;
  createdAt: string;
  includeInReport: boolean;
  color: string;
}

export type ArtifactKind =
  | "motion artifact"
  | "clipping"
  | "flatline"
  | "baseline drift"
  | "high-frequency noise"
  | "weak signal"
  | "unstable";

export interface QualitySegment {
  id: string;
  startTime: number;
  endTime: number;
  score: number;
  labels: ArtifactKind[];
}

export interface QualityFlag {
  id: string;
  kind: ArtifactKind;
  startTime: number;
  endTime: number;
  severity: "low" | "medium" | "high";
  note: string;
}

export interface QualityReview {
  overallScore: number;
  rating: "excellent" | "good" | "mixed" | "poor";
  dominantIssue: ArtifactKind | null;
  suggestedPresetId: string | null;
  timeline: QualitySegment[];
  flags: QualityFlag[];
}

export interface InsightFinding {
  id: string;
  label: string;
  value: string;
  note?: string;
  tone?: "neutral" | "accent" | "warm";
}

export interface CompareDelta {
  id: string;
  label: string;
  primary: string;
  comparison: string;
  delta: string;
  direction: "up" | "down" | "flat";
  note?: string;
}

export interface TimelineStage {
  id: string;
  datasetId: string;
  label: string;
  startTime: number;
  endTime: number;
  accent: string;
  createdAt: string;
}

export interface GuidedReviewState {
  enabled: boolean;
  step: number;
}

export interface ReportBuilderState {
  title: string;
  sessionLabel: string;
  includeWaveform: boolean;
  includeSpectrum: boolean;
  includeQuality: boolean;
  includeNotebook: boolean;
  includeComparison: boolean;
  includeTimeline: boolean;
  includeAnnotations: boolean;
  selectedMetricIds: string[];
}

export interface SyntheticSignalConfig {
  title: string;
  signalType: SignalType;
  durationSec: number;
  sampleRateHz: number;
  rateBpm: number;
  amplitude: number;
  noiseLevel: number;
  driftLevel: number;
  clipping: number;
  motionArtifact: number;
  burstDensity: number;
  secondaryFrequencyHz: number;
}

export interface SavedView {
  id: string;
  name: string;
  datasetId: string;
  activeChannelId: string | null;
  filters: FilterSettings;
  selection: TimeRange;
  activeTab: StudioTab;
  savedAt: string;
}

export interface ParsedUpload {
  fileName: string;
  headers: string[];
  rows: number[][];
  numericColumns: number[];
  inferredTimeColumn: number | null;
  inferredSampleRateHz: number;
  signalTypeGuess: SignalType;
}

export interface UploadImportOptions {
  title: string;
  signalType: SignalType;
  timeColumn: number | null;
  selectedColumns: number[];
  sampleRateHz: number;
}

export type StudioTab =
  | "waveform"
  | "spectrum"
  | "compare"
  | "annotations"
  | "report";

export interface CaseStudy {
  id: string;
  datasetId: string;
  title: string;
  strap: string;
  summary: string;
  signalType: SignalType;
  accent: string;
  mood: string;
  suggestedActions: string[];
}

export interface SavedSession {
  version: number;
  currentDatasetId: string;
  comparisonDatasetId: string | null;
  activeChannelId: string | null;
  filters: FilterSettings;
  selection: TimeRange;
  activeTab: StudioTab;
  activePresetId: string | null;
  showRawOverlay: boolean;
  normalizeCompare: boolean;
  theme: AppTheme;
  analystNotes: Record<string, string>;
  annotations: Record<string, Annotation[]>;
  notebookEntries: Record<string, NotebookEntry[]>;
  uploadedDatasets: SignalDataset[];
  savedViews: SavedView[];
  reportBuilder: ReportBuilderState;
  guidedReview: GuidedReviewState;
  timelineStages: TimelineStage[];
}
