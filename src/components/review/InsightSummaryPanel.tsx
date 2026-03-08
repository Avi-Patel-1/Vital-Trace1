import { Annotation, InsightFinding, NotebookEntry, QualityReview } from "../../types/signal";
import { MetricSummary } from "../report/MetricSummary";

interface InsightSummaryPanelProps {
  findings: InsightFinding[];
  qualityReview: QualityReview;
  notableRegions: NotebookEntry[];
  annotations: Annotation[];
}

export function InsightSummaryPanel({
  findings,
  qualityReview,
  notableRegions,
  annotations
}: InsightSummaryPanelProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="panel-shell space-y-5">
        <div>
          <div className="text-[0.72rem] uppercase tracking-[0.28em] text-white/[0.38]">
            Insight summary
          </div>
          <div className="mt-2 text-lg text-white">Fast read on the current recording</div>
        </div>
        <MetricSummary metrics={findings.map((finding) => ({
          id: finding.id,
          label: finding.label,
          value: finding.value,
          note: finding.note,
          tone: finding.tone
        }))} />
      </div>

      <div className="grid gap-6">
        <div className="panel-shell">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[0.72rem] uppercase tracking-[0.28em] text-white/[0.38]">
                Signal quality
              </div>
              <div className="mt-2 text-lg text-white capitalize">{qualityReview.rating}</div>
            </div>
            <div className="signal-badge">{qualityReview.overallScore}%</div>
          </div>
          <div className="mt-4 text-sm text-white/[0.58]">
            {qualityReview.dominantIssue
              ? `Most frequent issue: ${qualityReview.dominantIssue}.`
              : "No dominant artifact class in the active review."}
          </div>
        </div>

        <div className="panel-shell">
          <div className="text-[0.72rem] uppercase tracking-[0.28em] text-white/[0.38]">
            Notable regions
          </div>
          <div className="mt-4 space-y-3">
            {notableRegions.length ? (
              notableRegions.map((region) => (
                <div
                  key={region.id}
                  className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm uppercase tracking-[0.2em]" style={{ color: region.color }}>
                        {region.category}
                      </div>
                      <div className="mt-2 text-base text-white">{region.label}</div>
                      <div className="mt-2 text-sm text-white/[0.52]">
                        {region.startTime.toFixed(2)} s to {region.endTime.toFixed(2)} s
                      </div>
                      {region.note && <div className="mt-2 text-sm text-white/[0.52]">{region.note}</div>}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[1.2rem] border border-dashed border-white/[0.12] px-4 py-4 text-sm text-white/[0.46]">
                No saved regions yet.
              </div>
            )}
          </div>
        </div>

        <div className="panel-shell">
          <div className="text-[0.72rem] uppercase tracking-[0.28em] text-white/[0.38]">
            Saved notes
          </div>
          <div className="mt-3 text-lg text-white">{annotations.length}</div>
          <div className="mt-2 text-sm text-white/[0.52]">
            Annotation markers ready for report export.
          </div>
        </div>
      </div>
    </div>
  );
}
