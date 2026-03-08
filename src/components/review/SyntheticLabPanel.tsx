import { SyntheticSignalConfig } from "../../types/signal";

interface SyntheticLabPanelProps {
  config: SyntheticSignalConfig;
  onChange: (patch: Partial<SyntheticSignalConfig>) => void;
  onSignalTypeChange: (signalType: SyntheticSignalConfig["signalType"]) => void;
  onGenerate: () => void;
  onLoadIntoStudio: () => void;
  preview: {
    title: string;
    quality: number;
    peaks: number;
    dominantFrequency: number;
  } | null;
}

export function SyntheticLabPanel({
  config,
  onChange,
  onSignalTypeChange,
  onGenerate,
  onLoadIntoStudio,
  preview
}: SyntheticLabPanelProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
      <div className="panel-shell space-y-5">
        <div>
          <div className="text-[0.72rem] uppercase tracking-[0.28em] text-white/[0.38]">
            Synthetic lab
          </div>
          <div className="mt-2 text-lg text-white">Generate clean and corrupted signal cases</div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="control-field">
            <span>Signal type</span>
            <select
              className="control-input"
              value={config.signalType}
              onChange={(event) =>
                onSignalTypeChange(event.target.value as SyntheticSignalConfig["signalType"])
              }
            >
              <option value="ecg">ECG</option>
              <option value="emg">EMG</option>
              <option value="ppg">PPG</option>
              <option value="respiration">Respiration</option>
              <option value="generic">Generic</option>
              <option value="synthetic">Oscillatory</option>
            </select>
          </label>
          <label className="control-field">
            <span>Title</span>
            <input
              className="control-input"
              value={config.title}
              onChange={(event) => onChange({ title: event.target.value })}
            />
          </label>
          <label className="control-field">
            <span>Duration (s)</span>
            <input
              className="control-input"
              type="number"
              value={config.durationSec}
              onChange={(event) => onChange({ durationSec: Number(event.target.value) })}
            />
          </label>
          <label className="control-field">
            <span>Sample rate</span>
            <input
              className="control-input"
              type="number"
              value={config.sampleRateHz}
              onChange={(event) => onChange({ sampleRateHz: Number(event.target.value) })}
            />
          </label>
          <label className="control-field">
            <span>Rate</span>
            <input
              className="control-input"
              type="number"
              value={config.rateBpm}
              onChange={(event) => onChange({ rateBpm: Number(event.target.value) })}
            />
          </label>
          <label className="control-field">
            <span>Amplitude</span>
            <input
              className="control-input"
              type="number"
              step="0.1"
              value={config.amplitude}
              onChange={(event) => onChange({ amplitude: Number(event.target.value) })}
            />
          </label>
          <label className="control-field">
            <span>Noise</span>
            <input
              className="control-input"
              type="number"
              step="0.02"
              value={config.noiseLevel}
              onChange={(event) => onChange({ noiseLevel: Number(event.target.value) })}
            />
          </label>
          <label className="control-field">
            <span>Drift</span>
            <input
              className="control-input"
              type="number"
              step="0.02"
              value={config.driftLevel}
              onChange={(event) => onChange({ driftLevel: Number(event.target.value) })}
            />
          </label>
          <label className="control-field">
            <span>Clipping</span>
            <input
              className="control-input"
              type="number"
              step="0.05"
              value={config.clipping}
              onChange={(event) => onChange({ clipping: Number(event.target.value) })}
            />
          </label>
          <label className="control-field">
            <span>Motion artifact</span>
            <input
              className="control-input"
              type="number"
              step="0.05"
              value={config.motionArtifact}
              onChange={(event) => onChange({ motionArtifact: Number(event.target.value) })}
            />
          </label>
          <label className="control-field">
            <span>Burst density</span>
            <input
              className="control-input"
              type="number"
              value={config.burstDensity}
              onChange={(event) => onChange({ burstDensity: Number(event.target.value) })}
            />
          </label>
          <label className="control-field">
            <span>Secondary frequency</span>
            <input
              className="control-input"
              type="number"
              step="0.5"
              value={config.secondaryFrequencyHz}
              onChange={(event) =>
                onChange({ secondaryFrequencyHz: Number(event.target.value) })
              }
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <button className="primary-button" onClick={onGenerate}>
            Generate signal
          </button>
          <button className="chip-button" onClick={onLoadIntoStudio}>
            Load into studio
          </button>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="panel-shell">
          <div className="text-[0.72rem] uppercase tracking-[0.28em] text-white/[0.38]">
            Preview
          </div>
          {preview ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-4">
                <div className="text-[0.68rem] uppercase tracking-[0.2em] text-white/[0.42]">
                  Title
                </div>
                <div className="mt-2 text-lg text-white">{preview.title}</div>
              </div>
              <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-4">
                <div className="text-[0.68rem] uppercase tracking-[0.2em] text-white/[0.42]">
                  Quality
                </div>
                <div className="mt-2 text-lg text-white">{preview.quality}%</div>
              </div>
              <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-4">
                <div className="text-[0.68rem] uppercase tracking-[0.2em] text-white/[0.42]">
                  Events
                </div>
                <div className="mt-2 text-lg text-white">{preview.peaks}</div>
              </div>
              <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-4">
                <div className="text-[0.68rem] uppercase tracking-[0.2em] text-white/[0.42]">
                  Dominant band
                </div>
                <div className="mt-2 text-lg text-white">{preview.dominantFrequency.toFixed(1)} Hz</div>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-[1.2rem] border border-dashed border-white/[0.12] px-4 py-6 text-sm text-white/[0.46]">
              Generate a synthetic case to test filters, detection, and quality review.
            </div>
          )}
        </div>

        <div className="panel-shell">
          <div className="text-[0.72rem] uppercase tracking-[0.28em] text-white/[0.38]">
            Use it for
          </div>
          <div className="mt-4 grid gap-3">
            {[
              "Stress-test cleanup presets",
              "Validate event detection",
              "Compare clean and corrupted traces",
              "Teach artifact effects on review quality"
            ].map((item) => (
              <div key={item} className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/[0.58]">
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
