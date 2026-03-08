import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import { useShallow } from "zustand/react/shallow";

import { CompareChart } from "../components/charts/CompareChart";
import { MiniMapNavigator } from "../components/charts/MiniMapNavigator";
import { SignalChart } from "../components/charts/SignalChart";
import { SpectrogramHeatmap } from "../components/charts/SpectrogramHeatmap";
import { SpectrumChart } from "../components/charts/SpectrumChart";
import { DatasetLibrary } from "../components/controls/DatasetLibrary";
import { FilterPanel } from "../components/controls/FilterPanel";
import { QuickStartPanel } from "../components/controls/QuickStartPanel";
import { UploadPanel } from "../components/controls/UploadPanel";
import { AnnotationPanel } from "../components/report/AnnotationPanel";
import { ReportPanel } from "../components/report/ReportPanel";
import { LOCAL_SESSION_STORAGE_KEY } from "../hooks/useLocalSessions";
import { useSignalProcessing } from "../hooks/useSignalProcessing";
import { biosignalPalette } from "../lib/theme/palette";
import { caseStudies, presetModes, useStudioStore } from "../store/useStudioStore";
import { Annotation, SavedSession } from "../types/signal";

const tabLabels = [
  ["waveform", "Waveform"],
  ["spectrum", "Spectrum"],
  ["compare", "Compare"],
  ["annotations", "Notes"],
  ["report", "Report"]
] as const;

function annotationId() {
  return Math.random().toString(36).slice(2, 10);
}

export function Studio() {
  const [searchParams] = useSearchParams();
  const {
    datasets,
    currentDatasetId,
    comparisonDatasetId,
    activeTab,
    activeChannelId,
    filters,
    selection,
    cursorTime,
    activePresetId,
    showRawOverlay,
    normalizeCompare,
    savedViews,
    pendingUpload,
    loadDataset,
    setComparisonDataset,
    setActiveChannel,
    updateFilters,
    resetFilters,
    applyPreset,
    setSelection,
    setActiveTab,
    setCursorTime,
    toggleRawOverlay,
    toggleNormalizeCompare,
    setPendingUpload,
    importPendingUpload,
    addAnnotation,
    removeAnnotation,
    setAnalystNotes,
    toggleTheme,
    saveCurrentView,
    loadSavedView,
    removeSavedView,
    restoreSession
  } = useStudioStore(
    useShallow((state) => ({
      datasets: state.datasets,
      currentDatasetId: state.currentDatasetId,
      comparisonDatasetId: state.comparisonDatasetId,
      activeTab: state.activeTab,
      activeChannelId: state.activeChannelId,
      filters: state.filters,
      selection: state.selection,
      cursorTime: state.cursorTime,
      activePresetId: state.activePresetId,
      showRawOverlay: state.showRawOverlay,
      normalizeCompare: state.normalizeCompare,
      savedViews: state.savedViews,
      pendingUpload: state.pendingUpload,
      loadDataset: state.loadDataset,
      setComparisonDataset: state.setComparisonDataset,
      setActiveChannel: state.setActiveChannel,
      updateFilters: state.updateFilters,
      resetFilters: state.resetFilters,
      applyPreset: state.applyPreset,
      setSelection: state.setSelection,
      setActiveTab: state.setActiveTab,
      setCursorTime: state.setCursorTime,
      toggleRawOverlay: state.toggleRawOverlay,
      toggleNormalizeCompare: state.toggleNormalizeCompare,
      setPendingUpload: state.setPendingUpload,
      importPendingUpload: state.importPendingUpload,
      addAnnotation: state.addAnnotation,
      removeAnnotation: state.removeAnnotation,
      setAnalystNotes: state.setAnalystNotes,
      toggleTheme: state.toggleTheme,
      saveCurrentView: state.saveCurrentView,
      loadSavedView: state.loadSavedView,
      removeSavedView: state.removeSavedView,
      restoreSession: state.restoreSession
    }))
  );
  const { primary, comparison, annotations, analystNotes } = useSignalProcessing();
  const activeCase = caseStudies.find((item) => item.datasetId === primary.dataset.id);
  const activePreset = presetModes.find((preset) => preset.id === activePresetId);
  const selectedDuration = selection.end - selection.start;
  const qualityValue =
    primary.metrics.find((metric) => metric.id === "quality")?.value ??
    `${primary.detection.qualityScore}%`;
  const avgInterval =
    primary.detection.intervalsSec.reduce((sum, value) => sum + value, 0) /
    Math.max(primary.detection.intervalsSec.length, 1);
  const filterCount = [
    filters.smoothingWindow > 1,
    filters.movingAverageWindow > 1,
    filters.lowPassHz !== null,
    filters.highPassHz !== null,
    filters.bandPassLowHz !== null || filters.bandPassHighHz !== null,
    filters.notchHz !== null,
    filters.baselineCorrection,
    filters.detrend,
    filters.normalize,
    filters.rectify,
    filters.envelope
  ].filter(Boolean).length;
  const hasRecentSession =
    typeof window !== "undefined" &&
    Boolean(window.localStorage.getItem(LOCAL_SESSION_STORAGE_KEY));

  useEffect(() => {
    const dataset = searchParams.get("dataset");
    const preset = searchParams.get("preset");
    if (dataset) {
      loadDataset(dataset);
    }
    if (preset) {
      applyPreset(preset);
    }
  }, [applyPreset, loadDataset, searchParams]);

  const zoom = (factor: number) => {
    const center = (selection.start + selection.end) / 2;
    const current = selection.end - selection.start;
    const next = Math.max(1.5, Math.min(primary.dataset.durationSec, current * factor));
    const start = Math.max(0, Math.min(center - next / 2, primary.dataset.durationSec - next));
    setSelection({ start, end: start + next });
  };

  const shift = (fraction: number) => {
    const width = selection.end - selection.start;
    const delta = width * fraction;
    const start = Math.max(
      0,
      Math.min(selection.start + delta, primary.dataset.durationSec - width)
    );
    setSelection({ start, end: start + width });
  };

  const addMarker = (label: string, note: string) => {
    if (!label.trim()) {
      return;
    }

    const annotation: Annotation = {
      id: annotationId(),
      type: "marker",
      label: label.trim(),
      note: note.trim(),
      time: cursorTime ?? selection.start,
      color: biosignalPalette.roseSoft
    };
    addAnnotation(primary.dataset.id, annotation);
  };

  const addRange = (label: string, note: string) => {
    if (!label.trim()) {
      return;
    }

    const annotation: Annotation = {
      id: annotationId(),
      type: "range",
      label: label.trim(),
      note: note.trim(),
      time: selection.start,
      endTime: selection.end,
      color: biosignalPalette.white
    };
    addAnnotation(primary.dataset.id, annotation);
  };

  const scrollToPanel = (panelId: string) => {
    document.getElementById(panelId)?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  };

  const restoreRecentSession = () => {
    try {
      const raw = window.localStorage.getItem(LOCAL_SESSION_STORAGE_KEY);
      if (!raw) {
        return;
      }

      restoreSession(JSON.parse(raw) as SavedSession);
    } catch {
      window.localStorage.removeItem(LOCAL_SESSION_STORAGE_KEY);
    }
  };

  const toolGroups = [
    {
      id: "view",
      label: "View",
      copy: "Waveform, cursor, mini-map",
      active: activeTab === "waveform" || activeTab === "spectrum",
      onClick: () => setActiveTab("waveform")
    },
    {
      id: "filter",
      label: "Filter",
      copy: `${filterCount} stage${filterCount === 1 ? "" : "s"} ready`,
      active: filterCount > 0,
      onClick: () => scrollToPanel("studio-filter-panel")
    },
    {
      id: "detect",
      label: "Detect",
      copy: `${primary.detection.peaks.length} peaks, ${primary.detection.regions.length} regions`,
      active: activeTab === "waveform" && primary.detection.peaks.length > 0,
      onClick: () => {
        setActiveTab("waveform");
        scrollToPanel("studio-events-panel");
      }
    },
    {
      id: "compare",
      label: "Compare",
      copy: comparison ? comparison.dataset.shortLabel : "Choose a second trace",
      active: activeTab === "compare",
      onClick: () => setActiveTab("compare")
    },
    {
      id: "annotate",
      label: "Annotate",
      copy: `${annotations.length} saved note${annotations.length === 1 ? "" : "s"}`,
      active: activeTab === "annotations",
      onClick: () => setActiveTab("annotations")
    },
    {
      id: "export",
      label: "Export",
      copy: "Plot image or PDF report",
      active: activeTab === "report",
      onClick: () => setActiveTab("report")
    }
  ];

  return (
    <div className="px-4 pb-24 pt-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-6 grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
          <QuickStartPanel
            datasets={datasets}
            currentDatasetId={currentDatasetId}
            hasRecentSession={hasRecentSession}
            savedViews={savedViews}
            onLoadDataset={loadDataset}
            onOpenUpload={() => scrollToPanel("studio-upload-panel")}
            onRestoreRecent={restoreRecentSession}
            onSaveCurrentView={() => saveCurrentView()}
            onLoadSavedView={loadSavedView}
            onRemoveSavedView={removeSavedView}
          />

          <div className="section-shell p-6 sm:p-8">
            <div className="relative z-10 grid gap-8 xl:grid-cols-[1.08fr_0.92fr]">
              <div>
                <div className="text-[0.72rem] uppercase tracking-[0.28em] text-white/[0.38]">
                  Signal lab
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <h1 className="font-display text-4xl text-white sm:text-5xl">
                    {primary.dataset.title}
                  </h1>
                  <div className="signal-badge">{primary.dataset.signalType}</div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <div className="signal-badge">{primary.dataset.sampleRateHz} Hz</div>
                  <div className="signal-badge">
                    {primary.dataset.channels.length} channel
                    {primary.dataset.channels.length === 1 ? "" : "s"}
                  </div>
                  <div className="signal-badge">{selectedDuration.toFixed(1)} s window</div>
                  {activePreset && <div className="signal-badge">{activePreset.name}</div>}
                </div>
                <p className="mt-5 max-w-2xl text-sm leading-6 text-white/[0.62] sm:text-base">
                  {activeCase?.summary ?? primary.dataset.context}
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  <button className="chip-button" onClick={() => zoom(0.72)}>
                    Zoom in
                  </button>
                  <button className="chip-button" onClick={() => zoom(1.28)}>
                    Zoom out
                  </button>
                  <button className="chip-button" onClick={() => shift(-0.3)}>
                    Shift left
                  </button>
                  <button className="chip-button" onClick={() => shift(0.3)}>
                    Shift right
                  </button>
                  <button className="chip-button" onClick={toggleRawOverlay}>
                    {showRawOverlay ? "Hide raw" : "Show raw"}
                  </button>
                  <button className="chip-button" onClick={toggleTheme}>
                    Toggle palette
                  </button>
                  <Link to="/review" className="chip-button">
                    Review center
                  </Link>
                  <Link to="/reports" className="chip-button">
                    Report builder
                  </Link>
                </div>
                <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {toolGroups.map((group) => (
                    <button
                      key={group.id}
                      className={group.active ? "tool-group is-active" : "tool-group"}
                      onClick={group.onClick}
                    >
                      <span className="tool-label">{group.label}</span>
                      <span className="tool-copy">{group.copy}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="panel-shell p-4 sm:p-5">
                  <div className="text-[0.68rem] uppercase tracking-[0.22em] text-white/[0.42]">
                    Quality
                  </div>
                  <div className="mt-3 text-3xl text-white">{qualityValue}</div>
                  <div className="mt-2 text-sm text-white/[0.52]">Window stability</div>
                </div>
                <div className="panel-shell p-4 sm:p-5">
                  <div className="text-[0.68rem] uppercase tracking-[0.22em] text-white/[0.42]">
                    Peaks
                  </div>
                  <div className="mt-3 text-3xl text-white">
                    {primary.detection.peaks.length}
                  </div>
                  <div className="mt-2 text-sm text-white/[0.52]">Detected in view</div>
                </div>
                <div className="panel-shell p-4 sm:p-5">
                  <div className="text-[0.68rem] uppercase tracking-[0.22em] text-white/[0.42]">
                    Regions
                  </div>
                  <div className="mt-3 text-3xl text-white">
                    {primary.detection.regions.length}
                  </div>
                  <div className="mt-2 text-sm text-white/[0.52]">Threshold segments</div>
                </div>
                <div className="panel-shell p-4 sm:p-5">
                  <div className="text-[0.68rem] uppercase tracking-[0.22em] text-white/[0.42]">
                    Interval
                  </div>
                  <div className="mt-3 text-3xl text-white">
                    {primary.detection.intervalsSec.length ? `${avgInterval.toFixed(2)} s` : "—"}
                  </div>
                  <div className="mt-2 text-sm text-white/[0.52]">Mean detected spacing</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {tabLabels.map(([tab, label]) => (
            <button
              key={tab}
              className={activeTab === tab ? "primary-button" : "chip-button"}
              onClick={() => setActiveTab(tab)}
            >
              {label}
            </button>
          ))}
          <button className="chip-button" onClick={toggleNormalizeCompare}>
            {normalizeCompare ? "Normalized compare" : "Absolute compare"}
          </button>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.8fr_1.38fr_0.92fr]">
          <div className="space-y-6">
            <DatasetLibrary
              datasets={datasets}
              currentDatasetId={currentDatasetId}
              comparisonDatasetId={comparisonDatasetId}
              cases={caseStudies}
              onLoad={loadDataset}
              onCompare={setComparisonDataset}
              onApplyPreset={applyPreset}
            />
            <div id="studio-upload-panel">
              <UploadPanel
                pendingUpload={pendingUpload}
                onPendingUpload={setPendingUpload}
                onImport={importPendingUpload}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="panel-shell">
              <div className="mb-4 flex flex-wrap gap-2">
                {primary.processedChannels.map((channel) => (
                  <button
                    key={channel.id}
                    className={channel.id === activeChannelId ? "primary-button" : "chip-button"}
                    onClick={() => setActiveChannel(channel.id)}
                  >
                    {channel.name}
                  </button>
                ))}
              </div>
              {activeTab === "waveform" && (
                <SignalChart
                  analysis={primary}
                  showRawOverlay={showRawOverlay}
                  cursorTime={cursorTime}
                  annotations={annotations}
                  onCursorChange={setCursorTime}
                />
              )}
              {activeTab === "spectrum" && (
                <div className="grid gap-6">
                  <SpectrumChart before={primary.spectrumBefore} after={primary.spectrumAfter} />
                  <SpectrogramHeatmap spectrogram={primary.spectrogram} />
                </div>
              )}
              {activeTab === "compare" && (
                <CompareChart
                  primary={primary}
                  comparison={comparison}
                  normalize={normalizeCompare}
                />
              )}
              {activeTab === "annotations" && (
                <AnnotationPanel
                  annotations={annotations}
                  selection={selection}
                  cursorTime={cursorTime}
                  peakCount={primary.detection.peaks.length}
                  onAddMarker={addMarker}
                  onAddRange={addRange}
                  onRemove={(annotationIdToRemove) =>
                    removeAnnotation(primary.dataset.id, annotationIdToRemove)
                  }
                />
              )}
              {activeTab === "report" && (
                <ReportPanel
                  analysis={primary}
                  metrics={primary.metrics}
                  annotations={annotations}
                  notes={analystNotes}
                  onNotesChange={(notes) => setAnalystNotes(primary.dataset.id, notes)}
                />
              )}
            </div>
            <MiniMapNavigator
              analysis={primary}
              selection={selection}
              onSelectionChange={setSelection}
            />
          </div>

          <div className="space-y-6">
            <div id="studio-filter-panel">
              <FilterPanel filters={filters} onChange={updateFilters} onReset={resetFilters} />
            </div>
            <div id="studio-events-panel" className="panel-shell">
              <div className="text-[0.72rem] uppercase tracking-[0.28em] text-white/[0.38]">
                Detect
              </div>
              <div className="mt-2 text-lg text-white">Events in the active window</div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4">
                  <div className="text-[0.68rem] uppercase tracking-[0.2em] text-white/40">
                    Peaks
                  </div>
                  <div className="mt-2 text-2xl text-white">
                    {primary.detection.peaks.length}
                  </div>
                </div>
                <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4">
                  <div className="text-[0.68rem] uppercase tracking-[0.2em] text-white/40">
                    Regions
                  </div>
                  <div className="mt-2 text-2xl text-white">
                    {primary.detection.regions.length}
                  </div>
                </div>
                <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4">
                  <div className="text-[0.68rem] uppercase tracking-[0.2em] text-white/40">
                    Quality
                  </div>
                  <div className="mt-2 text-2xl text-white">{qualityValue}</div>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {primary.detection.peaks.slice(0, 5).map((peak, index) => (
                  <div
                    key={peak.id}
                    className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/[0.6]"
                  >
                    Peak {index + 1} at {peak.time.toFixed(2)} s
                  </div>
                ))}
                {!primary.detection.peaks.length && (
                  <div className="rounded-[1.2rem] border border-dashed border-white/[0.12] px-4 py-4 text-sm text-white/[0.46]">
                    No peaks in the current window.
                  </div>
                )}
              </div>
            </div>
            <div className="panel-shell">
              <div className="text-[0.72rem] uppercase tracking-[0.28em] text-white/[0.38]">
                Window stats
              </div>
              <div className="mt-5 grid gap-3">
                {primary.metrics.slice(0, 8).map((metric) => (
                  <div key={metric.id} className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4">
                    <div className="text-[0.68rem] uppercase tracking-[0.2em] text-white/40">
                      {metric.label}
                    </div>
                    <div className="mt-2 text-2xl text-white">{metric.value}</div>
                    {metric.note && <div className="mt-2 text-sm text-white/[0.52]">{metric.note}</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
