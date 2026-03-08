import { GuidedReviewState } from "../../types/signal";

interface GuidedReviewRailProps {
  guidedReview: GuidedReviewState;
  onToggle: () => void;
  onStepChange: (step: number) => void;
}

const steps = [
  "Load signal",
  "Inspect waveform",
  "Apply filters",
  "Detect events",
  "Review quality",
  "Mark regions",
  "Compare",
  "Build report"
];

export function GuidedReviewRail({
  guidedReview,
  onToggle,
  onStepChange
}: GuidedReviewRailProps) {
  return (
    <div className="panel-shell space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[0.72rem] uppercase tracking-[0.28em] text-white/[0.38]">
            Guided review
          </div>
          <div className="mt-2 text-lg text-white">Move through the signal in order</div>
        </div>
        <button className={guidedReview.enabled ? "primary-button" : "chip-button"} onClick={onToggle}>
          {guidedReview.enabled ? "Review flow on" : "Review flow off"}
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {steps.map((step, index) => (
          <button
            key={step}
            className={guidedReview.step === index ? "tool-group is-active" : "tool-group"}
            onClick={() => onStepChange(index)}
          >
            <span className="tool-label">Step {index + 1}</span>
            <span className="tool-copy">{step}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
