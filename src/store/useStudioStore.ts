import { create } from "zustand";

import { architectureNotes, caseStudies, demoDatasets } from "../data/demoDatasets";
import { defaultFilterSettings } from "../lib/filters/filterPipeline";
import { buildDatasetFromUpload } from "../lib/parsing/parseSignalFile";
import { filtersForPreset, presetModes } from "../lib/presets/presets";
import {
  Annotation,
  AppTheme,
  GuidedReviewState,
  NotebookEntry,
  ParsedUpload,
  ReportBuilderState,
  SavedSession,
  SavedView,
  SignalDataset,
  TimelineStage,
  StudioTab,
  TimeRange
} from "../types/signal";

export { caseStudies, architectureNotes, presetModes, demoDatasets };

const initialDataset = demoDatasets[0];
const defaultReportBuilder: ReportBuilderState = {
  title: "Signal Review Summary",
  sessionLabel: "Current session",
  includeWaveform: true,
  includeSpectrum: true,
  includeQuality: true,
  includeNotebook: true,
  includeComparison: true,
  includeTimeline: true,
  includeAnnotations: true,
  selectedMetricIds: ["quality", "window", "dominant", "rate", "interval", "variability"]
};

const defaultGuidedReview: GuidedReviewState = {
  enabled: true,
  step: 0
};

interface StudioState {
  datasets: SignalDataset[];
  currentDatasetId: string;
  comparisonDatasetId: string | null;
  activeChannelId: string | null;
  filters: typeof defaultFilterSettings;
  selection: TimeRange;
  activeTab: StudioTab;
  activePresetId: string | null;
  showRawOverlay: boolean;
  normalizeCompare: boolean;
  theme: AppTheme;
  cursorTime: number | null;
  analystNotes: Record<string, string>;
  annotations: Record<string, Annotation[]>;
  notebookEntries: Record<string, NotebookEntry[]>;
  savedViews: SavedView[];
  reportBuilder: ReportBuilderState;
  guidedReview: GuidedReviewState;
  timelineStages: TimelineStage[];
  pendingUpload: ParsedUpload | null;
  addDataset: (
    dataset: SignalDataset,
    options?: { setCurrent?: boolean; compareWithCurrent?: boolean }
  ) => void;
  loadDataset: (datasetId: string) => void;
  setComparisonDataset: (datasetId: string | null) => void;
  setActiveChannel: (channelId: string) => void;
  updateFilters: (patch: Partial<typeof defaultFilterSettings>) => void;
  resetFilters: () => void;
  applyPreset: (presetId: string) => void;
  setSelection: (selection: TimeRange) => void;
  setActiveTab: (tab: StudioTab) => void;
  setCursorTime: (time: number | null) => void;
  toggleRawOverlay: () => void;
  toggleNormalizeCompare: () => void;
  toggleTheme: () => void;
  setAnalystNotes: (datasetId: string, notes: string) => void;
  addAnnotation: (datasetId: string, annotation: Annotation) => void;
  removeAnnotation: (datasetId: string, annotationId: string) => void;
  addNotebookEntry: (entry: NotebookEntry) => void;
  removeNotebookEntry: (datasetId: string, entryId: string) => void;
  toggleNotebookInReport: (datasetId: string, entryId: string) => void;
  saveCurrentView: (name?: string) => void;
  loadSavedView: (savedViewId: string) => void;
  removeSavedView: (savedViewId: string) => void;
  updateReportBuilder: (patch: Partial<ReportBuilderState>) => void;
  toggleReportMetric: (metricId: string) => void;
  toggleGuidedReview: () => void;
  setGuidedStep: (step: number) => void;
  addTimelineStage: (stage: TimelineStage) => void;
  removeTimelineStage: (stageId: string) => void;
  setPendingUpload: (pendingUpload: ParsedUpload | null) => void;
  importPendingUpload: (
    options: Parameters<typeof buildDatasetFromUpload>[1]
  ) => void;
  restoreSession: (session: SavedSession) => void;
}

function datasetById(datasets: SignalDataset[], datasetId: string | null) {
  return datasets.find((dataset) => dataset.id === datasetId) ?? datasets[0];
}

export const useStudioStore = create<StudioState>((set, get) => ({
  datasets: demoDatasets,
  currentDatasetId: initialDataset.id,
  comparisonDatasetId: demoDatasets[1]?.id ?? null,
  activeChannelId: initialDataset.channels[0]?.id ?? null,
  filters: filtersForPreset(initialDataset.suggestedPresetId),
  selection: initialDataset.defaultWindow ?? { start: 0, end: 8 },
  activeTab: "waveform",
  activePresetId: initialDataset.suggestedPresetId,
  showRawOverlay: true,
  normalizeCompare: true,
  theme: "dusk",
  cursorTime: null,
  analystNotes: {},
  annotations: {},
  notebookEntries: {},
  savedViews: [],
  reportBuilder: {
    ...defaultReportBuilder,
    title: `${initialDataset.title} Summary`,
    sessionLabel: initialDataset.shortLabel
  },
  guidedReview: defaultGuidedReview,
  timelineStages: [],
  pendingUpload: null,
  addDataset: (dataset, options) =>
    set((state) => ({
      datasets: state.datasets.some((item) => item.id === dataset.id)
        ? state.datasets
        : [...state.datasets, dataset],
      currentDatasetId:
        options?.setCurrent === false ? state.currentDatasetId : dataset.id,
      comparisonDatasetId: options?.compareWithCurrent ? state.currentDatasetId : state.comparisonDatasetId,
      activeChannelId:
        options?.setCurrent === false ? state.activeChannelId : dataset.channels[0]?.id ?? null,
      selection:
        options?.setCurrent === false
          ? state.selection
          : dataset.defaultWindow ?? { start: 0, end: Math.min(8, dataset.durationSec) },
      activePresetId:
        options?.setCurrent === false ? state.activePresetId : dataset.suggestedPresetId,
      filters:
        options?.setCurrent === false
          ? state.filters
          : filtersForPreset(dataset.suggestedPresetId),
      activeTab: options?.setCurrent === false ? state.activeTab : "waveform",
      reportBuilder:
        options?.setCurrent === false
          ? state.reportBuilder
          : {
              ...state.reportBuilder,
              title: `${dataset.title} Summary`,
              sessionLabel: dataset.shortLabel
            }
    })),
  loadDataset: (datasetId) =>
    set((state) => {
      const dataset = datasetById(state.datasets, datasetId);
      return {
        currentDatasetId: dataset.id,
        activeChannelId: dataset.channels[0]?.id ?? null,
        selection: dataset.defaultWindow ?? { start: 0, end: Math.min(dataset.durationSec, 8) },
        activePresetId: dataset.suggestedPresetId,
        filters: filtersForPreset(dataset.suggestedPresetId),
        activeTab: "waveform",
        reportBuilder: {
          ...state.reportBuilder,
          title: `${dataset.title} Summary`,
          sessionLabel: dataset.shortLabel
        }
      };
    }),
  setComparisonDataset: (datasetId) => set({ comparisonDatasetId: datasetId }),
  setActiveChannel: (channelId) => set({ activeChannelId: channelId }),
  updateFilters: (patch) =>
    set((state) => ({
      filters: {
        ...state.filters,
        ...patch
      }
    })),
  resetFilters: () =>
    set((state) => ({
      filters: state.activePresetId
        ? filtersForPreset(state.activePresetId)
        : defaultFilterSettings
    })),
  applyPreset: (presetId) =>
    set(() => {
      const preset = presetModes.find((item) => item.id === presetId);
      return {
        activePresetId: presetId,
        filters: filtersForPreset(presetId),
        activeTab: preset?.defaultTab ?? "waveform"
      };
    }),
  setSelection: (selection) => set({ selection }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setCursorTime: (cursorTime) => set({ cursorTime }),
  toggleRawOverlay: () => set((state) => ({ showRawOverlay: !state.showRawOverlay })),
  toggleNormalizeCompare: () =>
    set((state) => ({ normalizeCompare: !state.normalizeCompare })),
  toggleTheme: () => set((state) => ({ theme: state.theme === "dusk" ? "paper" : "dusk" })),
  setAnalystNotes: (datasetId, notes) =>
    set((state) => ({
      analystNotes: {
        ...state.analystNotes,
        [datasetId]: notes
      }
    })),
  addAnnotation: (datasetId, annotation) =>
    set((state) => ({
      annotations: {
        ...state.annotations,
        [datasetId]: [...(state.annotations[datasetId] ?? []), annotation]
      }
    })),
  removeAnnotation: (datasetId, annotationId) =>
    set((state) => ({
      annotations: {
        ...state.annotations,
        [datasetId]: (state.annotations[datasetId] ?? []).filter(
          (annotation) => annotation.id !== annotationId
        )
      }
    })),
  addNotebookEntry: (entry) =>
    set((state) => ({
      notebookEntries: {
        ...state.notebookEntries,
        [entry.datasetId]: [...(state.notebookEntries[entry.datasetId] ?? []), entry]
      }
    })),
  removeNotebookEntry: (datasetId, entryId) =>
    set((state) => ({
      notebookEntries: {
        ...state.notebookEntries,
        [datasetId]: (state.notebookEntries[datasetId] ?? []).filter(
          (entry) => entry.id !== entryId
        )
      }
    })),
  toggleNotebookInReport: (datasetId, entryId) =>
    set((state) => ({
      notebookEntries: {
        ...state.notebookEntries,
        [datasetId]: (state.notebookEntries[datasetId] ?? []).map((entry) =>
          entry.id === entryId
            ? { ...entry, includeInReport: !entry.includeInReport }
            : entry
        )
      }
    })),
  saveCurrentView: (name) =>
    set((state) => {
      const dataset = datasetById(state.datasets, state.currentDatasetId);
      const viewName =
        name?.trim() ||
        `${dataset.shortLabel} ${state.selection.start.toFixed(1)}-${state.selection.end.toFixed(1)} s`;

      const nextView: SavedView = {
        id: `${dataset.id}-${Date.now()}`,
        name: viewName,
        datasetId: dataset.id,
        activeChannelId: state.activeChannelId,
        filters: state.filters,
        selection: state.selection,
        activeTab: state.activeTab,
        savedAt: new Date().toISOString()
      };

      return {
        savedViews: [nextView, ...state.savedViews].slice(0, 8)
      };
    }),
  loadSavedView: (savedViewId) =>
    set((state) => {
      const savedView = state.savedViews.find((item) => item.id === savedViewId);
      if (!savedView) {
        return state;
      }

      const dataset = datasetById(state.datasets, savedView.datasetId);
      return {
        currentDatasetId: dataset.id,
        activeChannelId: savedView.activeChannelId ?? dataset.channels[0]?.id ?? null,
        filters: savedView.filters,
        selection: savedView.selection,
        activeTab: savedView.activeTab,
        activePresetId: null
      };
    }),
  removeSavedView: (savedViewId) =>
    set((state) => ({
      savedViews: state.savedViews.filter((item) => item.id !== savedViewId)
    })),
  updateReportBuilder: (patch) =>
    set((state) => ({
      reportBuilder: {
        ...state.reportBuilder,
        ...patch
      }
    })),
  toggleReportMetric: (metricId) =>
    set((state) => ({
      reportBuilder: {
        ...state.reportBuilder,
        selectedMetricIds: state.reportBuilder.selectedMetricIds.includes(metricId)
          ? state.reportBuilder.selectedMetricIds.filter((item) => item !== metricId)
          : [...state.reportBuilder.selectedMetricIds, metricId]
      }
    })),
  toggleGuidedReview: () =>
    set((state) => ({
      guidedReview: {
        ...state.guidedReview,
        enabled: !state.guidedReview.enabled
      }
    })),
  setGuidedStep: (step) =>
    set((state) => ({
      guidedReview: {
        ...state.guidedReview,
        step
      }
    })),
  addTimelineStage: (stage) =>
    set((state) => ({
      timelineStages: [stage, ...state.timelineStages].slice(0, 12)
    })),
  removeTimelineStage: (stageId) =>
    set((state) => ({
      timelineStages: state.timelineStages.filter((stage) => stage.id !== stageId)
    })),
  setPendingUpload: (pendingUpload) => set({ pendingUpload }),
  importPendingUpload: (options) =>
    set((state) => {
      if (!state.pendingUpload) {
        return state;
      }

      const dataset = buildDatasetFromUpload(state.pendingUpload, options);
      return {
        datasets: [...state.datasets, dataset],
        currentDatasetId: dataset.id,
        comparisonDatasetId: state.currentDatasetId,
        activeChannelId: dataset.channels[0]?.id ?? null,
        selection: dataset.defaultWindow ?? { start: 0, end: Math.min(8, dataset.durationSec) },
        activePresetId: dataset.suggestedPresetId,
        filters: filtersForPreset(dataset.suggestedPresetId),
        pendingUpload: null,
        activeTab: "waveform",
        reportBuilder: {
          ...state.reportBuilder,
          title: `${dataset.title} Summary`,
          sessionLabel: dataset.shortLabel
        }
      };
    }),
  restoreSession: (session) =>
    set(() => ({
      datasets: [...demoDatasets, ...session.uploadedDatasets],
      currentDatasetId: session.currentDatasetId,
      comparisonDatasetId: session.comparisonDatasetId,
      activeChannelId: session.activeChannelId,
      filters: session.filters,
      selection: session.selection,
      activeTab: session.activeTab,
      activePresetId: session.activePresetId,
      showRawOverlay: session.showRawOverlay,
      normalizeCompare: session.normalizeCompare,
      theme: session.theme,
      analystNotes: session.analystNotes,
      annotations: session.annotations,
      notebookEntries: session.notebookEntries ?? {},
      savedViews: session.savedViews ?? [],
      reportBuilder: session.reportBuilder ?? defaultReportBuilder,
      guidedReview: session.guidedReview ?? defaultGuidedReview,
      timelineStages: session.timelineStages ?? []
    }))
}));

export function buildSavedSession(): SavedSession {
  const state = useStudioStore.getState();
  const uploadedDatasets = state.datasets.filter((dataset) => dataset.source === "upload");

  return {
    version: 2,
    currentDatasetId: state.currentDatasetId,
    comparisonDatasetId: state.comparisonDatasetId,
    activeChannelId: state.activeChannelId,
    filters: state.filters,
    selection: state.selection,
    activeTab: state.activeTab,
    activePresetId: state.activePresetId,
    showRawOverlay: state.showRawOverlay,
    normalizeCompare: state.normalizeCompare,
    theme: state.theme,
    analystNotes: state.analystNotes,
    annotations: state.annotations,
    notebookEntries: state.notebookEntries,
    uploadedDatasets,
    savedViews: state.savedViews,
    reportBuilder: state.reportBuilder,
    guidedReview: state.guidedReview,
    timelineStages: state.timelineStages
  };
}
