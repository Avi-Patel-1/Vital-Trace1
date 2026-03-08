import { exportChartImageSet, exportReportPdf } from "../../lib/export/reportExport";
import {
  Annotation,
  CompareDelta,
  MetricCard,
  NotebookEntry,
  ProcessedAnalysis,
  QualityReview,
  ReportBuilderState
} from "../../types/signal";

interface StageSummary {
  stage: {
    id: string;
    label: string;
    startTime: number;
    endTime: number;
  };
  quality: { overallScore: number };
  rate: number | null;
}

interface ReportBuilderPanelProps {
  analysis: ProcessedAnalysis;
  metrics: MetricCard[];
  annotations: Annotation[];
  notebookEntries: NotebookEntry[];
  notes: string;
  qualityReview: QualityReview;
  compareDeltas: CompareDelta[];
  stages: StageSummary[];
  builder: ReportBuilderState;
  onNotesChange: (notes: string) => void;
  onBuilderChange: (patch: Partial<ReportBuilderState>) => void;
  onToggleMetric: (metricId: string) => void;
}

export function ReportBuilderPanel({
  analysis,
  metrics,
  annotations,
  notebookEntries,
  notes,
  qualityReview,
  compareDeltas,
  stages,
  builder,
  onNotesChange,
  onBuilderChange,
  onToggleMetric
}: ReportBuilderPanelProps) {
  const sectionToggles = [
    ["includeWaveform", "Waveform"],
    ["includeSpectrum", "Spectrum"],
    ["includeQuality", "Quality"],
    ["includeNotebook", "Notebook"],
    ["includeComparison", "Comparison"],
    ["includeTimeline", "Timeline"],
    ["includeAnnotations", "Annotations"]
  ] as const;

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <div className="panel-shell space-y-5">
        <div>
          <div className="text-[0.72rem] uppercase tracking-[0.28em] text-white/[0.38]">
            Report builder
          </div>
          <div className="mt-2 text-lg text-white">Choose what to keep and export</div>
        </div>

        <label className="control-field">
          <span>Report title</span>
          <input
            className="control-input"
            value={builder.title}
            onChange={(event) => onBuilderChange({ title: event.target.value })}
          />
        </label>
        <label className="control-field">
          <span>Session label</span>
          <input
            className="control-input"
            value={builder.sessionLabel}
            onChange={(event) => onBuilderChange({ sessionLabel: event.target.value })}
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          {sectionToggles.map(([key, label]) => (
            <label key={key} className="toggle-field">
              <input
                type="checkbox"
                checked={builder[key]}
                onChange={() => onBuilderChange({ [key]: !builder[key] })}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>

        <div>
          <div className="mb-3 text-[0.72rem] uppercase tracking-[0.24em] text-white/[0.42]">
            Metrics to include
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {analysis.metrics.map((metric) => (
              <label key={metric.id} className="toggle-field">
                <input
                  type="checkbox"
                  checked={builder.selectedMetricIds.includes(metric.id)}
                  onChange={() => onToggleMetric(metric.id)}
                />
                <span>{metric.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            className="primary-button"
            onClick={() =>
              exportReportPdf({
                analysis,
                metrics,
                annotations,
                notes,
                builder,
                qualityReview,
                notebookEntries,
                compareDeltas,
                stageSummaries: stages
              })
            }
          >
            Export PDF report
          </button>
          <button
            className="chip-button"
            onClick={() =>
              exportChartImageSet({
                analysis,
                includeSpectrum: builder.includeSpectrum
              })
            }
          >
            Export chart set
          </button>
        </div>
      </div>

      <div className="panel-shell space-y-5">
        <div>
          <div className="text-[0.72rem] uppercase tracking-[0.28em] text-white/[0.38]">
            Report content
          </div>
          <div className="mt-2 text-lg text-white">Selected sections at a glance</div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-4">
            <div className="text-[0.68rem] uppercase tracking-[0.2em] text-white/[0.42]">Metrics</div>
            <div className="mt-2 text-2xl text-white">{metrics.length}</div>
          </div>
          <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-4">
            <div className="text-[0.68rem] uppercase tracking-[0.2em] text-white/[0.42]">Notebook</div>
            <div className="mt-2 text-2xl text-white">{notebookEntries.length}</div>
          </div>
          <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-4">
            <div className="text-[0.68rem] uppercase tracking-[0.2em] text-white/[0.42]">Annotations</div>
            <div className="mt-2 text-2xl text-white">{annotations.length}</div>
          </div>
          <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-4">
            <div className="text-[0.68rem] uppercase tracking-[0.2em] text-white/[0.42]">Compare deltas</div>
            <div className="mt-2 text-2xl text-white">{compareDeltas.length}</div>
          </div>
        </div>

        <label className="control-field">
          <span>Analyst notes</span>
          <textarea
            className="control-input min-h-[160px] resize-y"
            value={notes}
            onChange={(event) => onNotesChange(event.target.value)}
            placeholder="Keep the summary direct and useful."
          />
        </label>

        <div className="rounded-[1.35rem] border border-[rgba(194,140,157,0.28)] bg-[rgba(133,57,83,0.12)] p-4 text-sm leading-6 text-white/70">
          Not a medical device and not for clinical diagnosis.
        </div>
      </div>
    </div>
  );
}
