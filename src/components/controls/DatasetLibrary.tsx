import { presetModes } from "../../store/useStudioStore";
import { CaseStudy, SignalDataset } from "../../types/signal";

interface DatasetLibraryProps {
  datasets: SignalDataset[];
  currentDatasetId: string;
  comparisonDatasetId: string | null;
  cases: CaseStudy[];
  onLoad: (datasetId: string) => void;
  onCompare: (datasetId: string | null) => void;
  onApplyPreset: (presetId: string) => void;
}

export function DatasetLibrary({
  datasets,
  currentDatasetId,
  comparisonDatasetId,
  cases,
  onLoad,
  onCompare,
  onApplyPreset
}: DatasetLibraryProps) {
  return (
    <div className="panel-shell space-y-5">
      <div>
        <div className="text-[0.72rem] uppercase tracking-[0.28em] text-white/[0.38]">
          Sample library
        </div>
        <div className="mt-2 text-lg text-white">Load ECG, EMG, PPG, respiration</div>
      </div>

      <div className="space-y-3">
        {datasets.map((dataset) => {
          const caseStudy = cases.find((item) => item.datasetId === dataset.id);
          const isActive = dataset.id === currentDatasetId;
          const isCompare = dataset.id === comparisonDatasetId;

          return (
            <div
              key={dataset.id}
              className={[
                "rounded-[1.4rem] border p-4 transition",
                isActive
                  ? "border-white/20 bg-white/[0.08]"
                  : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]"
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm uppercase tracking-[0.22em] text-white/[0.42]">
                    {dataset.signalType}
                  </div>
                  <div className="mt-2 text-lg text-white">{dataset.title}</div>
                  <p className="mt-2 text-sm leading-6 text-white/60">{dataset.description}</p>
                  {caseStudy && (
                    <div className="mt-2 text-xs uppercase tracking-[0.22em] text-white/[0.34]">
                      {caseStudy.strap}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <button className="chip-button" onClick={() => onLoad(dataset.id)}>
                    {isActive ? "Loaded" : "Load"}
                  </button>
                  <button
                    className="chip-button"
                    onClick={() => onCompare(isCompare ? null : dataset.id)}
                  >
                    {isCompare ? "Comparing" : "Compare"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        {presetModes.map((preset) => (
          <button
            key={preset.id}
            className="chip-button"
            onClick={() => onApplyPreset(preset.id)}
          >
            {preset.name}
          </button>
        ))}
      </div>
    </div>
  );
}
