import { FilterSettings, QualityReview } from "../../types/signal";
import { reviewPalette } from "../../lib/theme/palette";

interface QualityReviewPanelProps {
  qualityReview: QualityReview;
  filters: FilterSettings;
  presetNote: string;
  onJumpTo: (startTime: number, endTime: number) => void;
  onApplySuggestedPreset: (presetId: string) => void;
}

function colorForScore(score: number) {
  if (score >= 80) {
    return reviewPalette.scoreHigh;
  }
  if (score >= 60) {
    return reviewPalette.scoreMedium;
  }
  if (score >= 40) {
    return reviewPalette.scoreLow;
  }
  return reviewPalette.scoreCritical;
}

export function QualityReviewPanel({
  qualityReview,
  filters,
  presetNote,
  onJumpTo,
  onApplySuggestedPreset
}: QualityReviewPanelProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
      <div className="panel-shell space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[0.72rem] uppercase tracking-[0.28em] text-white/[0.38]">
              Quality review
            </div>
            <div className="mt-2 text-lg text-white">Check trust, drift, and artifact load</div>
          </div>
          <div className="signal-badge">{qualityReview.overallScore}%</div>
        </div>

        <div className="grid gap-3 sm:grid-cols-12">
          {qualityReview.timeline.map((segment) => (
            <button
              key={segment.id}
              className="group rounded-[1rem] border border-white/10 bg-white/[0.03] p-0"
              onClick={() => onJumpTo(segment.startTime, segment.endTime)}
              title={`${segment.startTime.toFixed(2)} s to ${segment.endTime.toFixed(2)} s`}
            >
              <div
                className="mx-auto mt-3 w-5 rounded-full transition-transform duration-300 group-hover:scale-105"
                style={{
                  height: `${Math.max(42, segment.score * 1.05)}px`,
                  background: `linear-gradient(180deg, ${colorForScore(segment.score)}, rgba(255,255,255,0.12))`
                }}
              />
              <div className="px-2 pb-3 pt-2 text-[0.68rem] uppercase tracking-[0.18em] text-white/[0.4]">
                {segment.score}%
              </div>
            </button>
          ))}
        </div>

        <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-4 text-sm text-white/[0.56]">
          {filters.baselineCorrection || filters.notchHz || filters.smoothingWindow > 1
            ? "Current view includes cleanup."
            : "Current view is close to raw."} {presetNote}
        </div>
      </div>

      <div className="grid gap-6">
        <div className="panel-shell">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[0.72rem] uppercase tracking-[0.28em] text-white/[0.38]">
                Flagged segments
              </div>
              <div className="mt-2 text-lg text-white">{qualityReview.flags.length} flagged</div>
            </div>
            {qualityReview.suggestedPresetId && (
              <button
                className="chip-button"
                onClick={() => onApplySuggestedPreset(qualityReview.suggestedPresetId!)}
              >
                Apply cleanup
              </button>
            )}
          </div>

          <div className="mt-4 space-y-3">
            {qualityReview.flags.length ? (
              qualityReview.flags.slice(0, 6).map((flag) => (
                <button
                  key={flag.id}
                  className="w-full rounded-[1.2rem] border border-white/10 bg-white/[0.03] px-4 py-3 text-left"
                  onClick={() => onJumpTo(flag.startTime, flag.endTime)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm uppercase tracking-[0.2em] text-white/[0.44]">
                        {flag.kind}
                      </div>
                      <div className="mt-2 text-sm text-white/[0.58]">{flag.note}</div>
                    </div>
                    <div className="signal-badge">
                      {flag.startTime.toFixed(1)}-{flag.endTime.toFixed(1)} s
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="rounded-[1.2rem] border border-dashed border-white/[0.12] px-4 py-4 text-sm text-white/[0.46]">
                No strong artifact segments detected.
              </div>
            )}
          </div>
        </div>

        <div className="panel-shell">
          <div className="text-[0.72rem] uppercase tracking-[0.28em] text-white/[0.38]">
            Main issue
          </div>
          <div className="mt-2 text-lg text-white capitalize">
            {qualityReview.dominantIssue ?? "Stable view"}
          </div>
          <div className="mt-3 text-sm text-white/[0.56]">
            Use the timeline to jump into flagged windows and validate cleanup before export.
          </div>
        </div>
      </div>
    </div>
  );
}
