import { ProcessedAnalysis } from "../../types/signal";

interface StageSummary {
  stage: {
    id: string;
    label: string;
    startTime: number;
    endTime: number;
    accent: string;
  };
  analysis: ProcessedAnalysis;
  quality: { overallScore: number };
  rate: number | null;
}

interface RecoveryTimelinePanelProps {
  stages: StageSummary[];
  onJumpToStage: (startTime: number, endTime: number) => void;
  onAddCurrentStage: () => void;
  onRemoveStage: (stageId: string) => void;
}

export function RecoveryTimelinePanel({
  stages,
  onJumpToStage,
  onAddCurrentStage,
  onRemoveStage
}: RecoveryTimelinePanelProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <div className="panel-shell">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[0.72rem] uppercase tracking-[0.28em] text-white/[0.38]">
              Recovery timeline
            </div>
            <div className="mt-2 text-lg text-white">Track changes across stages</div>
          </div>
          <button className="chip-button" onClick={onAddCurrentStage}>
            Add current window
          </button>
        </div>

        <div className="mt-6 flex items-center gap-3 overflow-x-auto pb-2">
          {stages.map((stage, index) => (
            <div key={stage.stage.id} className="min-w-[170px]">
              <button
                className="w-full rounded-[1.35rem] border border-white/10 bg-white/[0.03] px-4 py-4 text-left"
                onClick={() => onJumpToStage(stage.stage.startTime, stage.stage.endTime)}
              >
                <div className="text-[0.68rem] uppercase tracking-[0.18em]" style={{ color: stage.stage.accent }}>
                  Stage {index + 1}
                </div>
                <div className="mt-2 text-lg text-white">{stage.stage.label}</div>
                <div className="mt-2 text-sm text-white/[0.52]">
                  {stage.stage.startTime.toFixed(1)}-{stage.stage.endTime.toFixed(1)} s
                </div>
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="panel-shell">
        <div className="text-[0.72rem] uppercase tracking-[0.28em] text-white/[0.38]">
          Stage metrics
        </div>
        <div className="mt-5 space-y-3">
          {stages.map((stage) => (
            <div key={stage.stage.id} className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm uppercase tracking-[0.2em]" style={{ color: stage.stage.accent }}>
                    {stage.stage.label}
                  </div>
                  <div className="mt-2 text-sm text-white/[0.56]">
                    {stage.analysis.detection.peaks.length} peaks · {stage.quality.overallScore}% quality
                  </div>
                  <div className="mt-2 text-sm text-white/[0.56]">
                    {stage.rate ? `${stage.rate.toFixed(0)} bpm / bpm-equivalent` : "No stable rate"}
                  </div>
                </div>
                <button className="chip-button" onClick={() => onRemoveStage(stage.stage.id)}>
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
