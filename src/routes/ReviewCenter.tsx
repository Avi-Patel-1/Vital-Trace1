import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useShallow } from "zustand/react/shallow";

import { MiniMapNavigator } from "../components/charts/MiniMapNavigator";
import { SignalChart } from "../components/charts/SignalChart";
import { CompareSessionsPanel } from "../components/review/CompareSessionsPanel";
import { GuidedReviewRail } from "../components/review/GuidedReviewRail";
import { InsightSummaryPanel } from "../components/review/InsightSummaryPanel";
import { QualityReviewPanel } from "../components/review/QualityReviewPanel";
import { RecoveryTimelinePanel } from "../components/review/RecoveryTimelinePanel";
import { RegionNotebookPanel } from "../components/review/RegionNotebookPanel";
import { ReportBuilderPanel } from "../components/review/ReportBuilderPanel";
import { qualityPresetNote } from "../lib/review/quality";
import { notebookCategoryColors } from "../lib/theme/palette";
import { useReviewWorkflow } from "../hooks/useReviewWorkflow";
import { useStudioStore } from "../store/useStudioStore";
import { NotebookCategory, NotebookEntry } from "../types/signal";

const panels = [
  ["summary", "Summary"],
  ["quality", "Quality"],
  ["notebook", "Notebook"],
  ["compare", "Compare"],
  ["timeline", "Timeline"],
  ["report", "Report"]
] as const;

const stepToPanel = ["summary", "summary", "quality", "quality", "quality", "notebook", "compare", "report"] as const;

function notebookColor(category: NotebookCategory) {
  return notebookCategoryColors[category];
}

interface ReviewCenterProps {
  defaultPanel?: (typeof panels)[number][0];
}

export function ReviewCenter({ defaultPanel = "summary" }: ReviewCenterProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const panel = (searchParams.get("panel") as (typeof panels)[number][0] | null) ?? defaultPanel;
  const {
    primary,
    comparison,
    annotations,
    analystNotes,
    notebookEntries,
    includedNotebookEntries,
    qualityReview,
    comparisonQuality,
    findings,
    notableRegions,
    compareDeltas,
    compareHighlights,
    reportBuilder,
    guidedReview,
    stageSummaries,
    reportMetrics
  } = useReviewWorkflow();
  const {
    selection,
    cursorTime,
    filters,
    normalizeCompare,
    setSelection,
    setCursorTime,
    applyPreset,
    toggleNormalizeCompare,
    addNotebookEntry,
    removeNotebookEntry,
    toggleNotebookInReport,
    updateReportBuilder,
    toggleReportMetric,
    setAnalystNotes,
    addTimelineStage,
    removeTimelineStage,
    toggleGuidedReview,
    setGuidedStep
  } = useStudioStore(
    useShallow((state) => ({
      selection: state.selection,
      cursorTime: state.cursorTime,
      filters: state.filters,
      normalizeCompare: state.normalizeCompare,
      setSelection: state.setSelection,
      setCursorTime: state.setCursorTime,
      applyPreset: state.applyPreset,
      toggleNormalizeCompare: state.toggleNormalizeCompare,
      addNotebookEntry: state.addNotebookEntry,
      removeNotebookEntry: state.removeNotebookEntry,
      toggleNotebookInReport: state.toggleNotebookInReport,
      updateReportBuilder: state.updateReportBuilder,
      toggleReportMetric: state.toggleReportMetric,
      setAnalystNotes: state.setAnalystNotes,
      addTimelineStage: state.addTimelineStage,
      removeTimelineStage: state.removeTimelineStage,
      toggleGuidedReview: state.toggleGuidedReview,
      setGuidedStep: state.setGuidedStep
    }))
  );

  const currentPanel = useMemo(() => panels.find(([id]) => id === panel)?.[0] ?? defaultPanel, [defaultPanel, panel]);

  const setPanel = (nextPanel: (typeof panels)[number][0]) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set("panel", nextPanel);
      return next;
    });
  };

  const addNotebookFromSelection = (entry: {
    label: string;
    note: string;
    category: NotebookCategory;
    startTime: number;
    endTime: number;
  }) => {
    addNotebookEntry({
      id: `${primary.dataset.id}-${Date.now()}`,
      datasetId: primary.dataset.id,
      label: entry.label,
      note: entry.note,
      category: entry.category,
      startTime: entry.startTime,
      endTime: entry.endTime,
      createdAt: new Date().toISOString(),
      includeInReport: true,
      color: notebookColor(entry.category)
    });
  };

  const addCurrentStage = () => {
    addTimelineStage({
      id: `${primary.dataset.id}-${Date.now()}`,
      datasetId: primary.dataset.id,
      label: `Window ${selection.start.toFixed(1)}-${selection.end.toFixed(1)} s`,
      startTime: selection.start,
      endTime: selection.end,
      accent: primary.selectedChannel.color,
      createdAt: new Date().toISOString()
    });
  };

  return (
    <div className="px-4 pb-24 pt-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <div className="section-shell p-6 sm:p-8">
          <div className="relative z-10 grid gap-6 xl:grid-cols-[1.02fr_0.98fr] xl:items-end">
            <div>
              <div className="text-[0.72rem] uppercase tracking-[0.28em] text-white/[0.38]">
                Review center
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <h1 className="font-display text-4xl text-white sm:text-5xl">
                  {primary.dataset.title}
                </h1>
                <div className="signal-badge">{primary.dataset.signalType}</div>
                <div className="signal-badge">{qualityReview.overallScore}% quality</div>
              </div>
              <p className="mt-5 max-w-2xl text-sm leading-6 text-white/[0.62] sm:text-base">
                Pull findings, quality, notes, compare state, and report content into one review flow.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <Link to="/studio" className="primary-button">
                  Open studio
                </Link>
                <Link to="/batch" className="chip-button">
                  Batch review
                </Link>
                <Link to="/synthetic" className="chip-button">
                  Synthetic lab
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {findings.slice(0, 3).map((finding) => (
                <div key={finding.id} className="panel-shell p-4 sm:p-5">
                  <div className="text-[0.68rem] uppercase tracking-[0.22em] text-white/[0.42]">
                    {finding.label}
                  </div>
                  <div className="mt-3 text-2xl text-white">{finding.value}</div>
                  {finding.note && <div className="mt-2 text-sm text-white/[0.52]">{finding.note}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>

        <GuidedReviewRail
          guidedReview={guidedReview}
          onToggle={toggleGuidedReview}
          onStepChange={(step) => {
            setGuidedStep(step);
            setPanel(stepToPanel[step]);
          }}
        />

        <div className="flex flex-wrap gap-2">
          {panels.map(([id, label]) => (
            <button
              key={id}
              className={currentPanel === id ? "primary-button" : "chip-button"}
              onClick={() => setPanel(id)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <SignalChart
            analysis={primary}
            showRawOverlay
            cursorTime={cursorTime}
            annotations={annotations}
            onCursorChange={setCursorTime}
          />
          <MiniMapNavigator
            analysis={primary}
            selection={selection}
            onSelectionChange={setSelection}
          />
        </div>

        {currentPanel === "summary" && (
          <InsightSummaryPanel
            findings={findings}
            qualityReview={qualityReview}
            notableRegions={notableRegions}
            annotations={annotations}
          />
        )}

        {currentPanel === "quality" && (
          <QualityReviewPanel
            qualityReview={qualityReview}
            filters={filters}
            presetNote={qualityPresetNote(filters)}
            onJumpTo={(startTime, endTime) => setSelection({ start: startTime, end: endTime })}
            onApplySuggestedPreset={applyPreset}
          />
        )}

        {currentPanel === "notebook" && (
          <RegionNotebookPanel
            entries={notebookEntries}
            selection={selection}
            onAddEntry={addNotebookFromSelection}
            onRemoveEntry={(entryId) => removeNotebookEntry(primary.dataset.id, entryId)}
            onToggleInclude={(entryId) => toggleNotebookInReport(primary.dataset.id, entryId)}
            onJumpToEntry={(entry: NotebookEntry) =>
              setSelection({ start: entry.startTime, end: entry.endTime })
            }
          />
        )}

        {currentPanel === "compare" && (
          <CompareSessionsPanel
            primary={primary}
            comparison={comparison}
            normalize={normalizeCompare}
            compareDeltas={compareDeltas}
            compareHighlights={compareHighlights}
            qualityReview={qualityReview}
            comparisonQuality={comparisonQuality}
            onToggleNormalize={toggleNormalizeCompare}
          />
        )}

        {currentPanel === "timeline" && (
          <RecoveryTimelinePanel
            stages={stageSummaries}
            onJumpToStage={(startTime, endTime) => setSelection({ start: startTime, end: endTime })}
            onAddCurrentStage={addCurrentStage}
            onRemoveStage={removeTimelineStage}
          />
        )}

        {currentPanel === "report" && (
          <ReportBuilderPanel
            analysis={primary}
            metrics={reportMetrics}
            annotations={annotations}
            notebookEntries={includedNotebookEntries}
            notes={analystNotes}
            qualityReview={qualityReview}
            compareDeltas={compareDeltas}
            stages={stageSummaries}
            builder={reportBuilder}
            onNotesChange={(notes) => setAnalystNotes(primary.dataset.id, notes)}
            onBuilderChange={updateReportBuilder}
            onToggleMetric={toggleReportMetric}
          />
        )}
      </div>
    </div>
  );
}
