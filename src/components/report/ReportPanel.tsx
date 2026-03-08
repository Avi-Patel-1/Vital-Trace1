import { Link } from "react-router-dom";

import { exportPlotPng, exportReportPdf } from "../../lib/export/reportExport";
import { Annotation, MetricCard, ProcessedAnalysis } from "../../types/signal";
import { MetricSummary } from "./MetricSummary";

interface ReportPanelProps {
  analysis: ProcessedAnalysis;
  metrics: MetricCard[];
  annotations: Annotation[];
  notes: string;
  onNotesChange: (notes: string) => void;
}

export function ReportPanel({
  analysis,
  metrics,
  annotations,
  notes,
  onNotesChange
}: ReportPanelProps) {
  return (
    <div className="panel-shell space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[0.72rem] uppercase tracking-[0.28em] text-white/[0.38]">
            Insight layer
          </div>
          <div className="mt-2 text-lg text-white">Export-ready summary</div>
        </div>
        <div className="flex gap-2">
          <Link to="/reports" className="chip-button">
            Open builder
          </Link>
          <button className="chip-button" onClick={() => exportPlotPng(analysis)}>
            Export plot image
          </button>
          <button
            className="primary-button"
            onClick={() =>
              exportReportPdf({
                analysis,
                metrics,
                annotations,
                notes
              })
            }
          >
            Export PDF report
          </button>
        </div>
      </div>

      <MetricSummary metrics={metrics.slice(0, 8)} />

      <div className="rounded-[1.5rem] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-5">
        <div className="text-sm uppercase tracking-[0.24em] text-white/[0.42]">Analyst notes</div>
        <textarea
          className="mt-3 min-h-[140px] w-full resize-y rounded-[1.2rem] border border-white/10 bg-black/20 px-4 py-4 text-sm text-white outline-none transition focus:border-white/20"
          value={notes}
          onChange={(event) => onNotesChange(event.target.value)}
          placeholder="Summarize notable windows, filter choices, observed artifacts, or export context."
        />
      </div>

      <div className="rounded-[1.35rem] border border-[rgba(194,140,157,0.28)] bg-[rgba(133,57,83,0.12)] p-4 text-sm leading-6 text-white/70">
        Prototype analysis environment. Not a medical device and not for clinical diagnosis.
      </div>
    </div>
  );
}
