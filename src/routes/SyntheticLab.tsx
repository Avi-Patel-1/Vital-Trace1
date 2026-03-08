import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { SyntheticLabPanel } from "../components/review/SyntheticLabPanel";
import { buildAnalysis } from "../lib/analysis/buildAnalysis";
import { defaultFilterSettings } from "../lib/filters/filterPipeline";
import {
  configForSyntheticPreset,
  defaultSyntheticConfig,
  generateSyntheticDataset
} from "../lib/synthetic/generateSyntheticDataset";
import { computeQualityReview } from "../lib/review/quality";
import { useStudioStore } from "../store/useStudioStore";

export function SyntheticLab() {
  const navigate = useNavigate();
  const addDataset = useStudioStore((state) => state.addDataset);
  const [config, setConfig] = useState(defaultSyntheticConfig);
  const [generatedDataset, setGeneratedDataset] = useState(() =>
    generateSyntheticDataset(defaultSyntheticConfig)
  );

  const preview = useMemo(() => {
    if (!generatedDataset.channels.length) {
      return null;
    }

    const analysis = buildAnalysis(
      generatedDataset,
      defaultFilterSettings,
      generatedDataset.channels[0]?.id ?? null,
      generatedDataset.defaultWindow ?? { start: 0, end: Math.min(generatedDataset.durationSec, 8) }
    );
    const quality = computeQualityReview(
      analysis.fullSelectedRaw,
      analysis.fullSelectedFiltered,
      generatedDataset.sampleRateHz,
      generatedDataset.signalType
    );
    const dominant = analysis.spectrumAfter.reduce(
      (best, point) => (point.amplitude > best.amplitude ? point : best),
      analysis.spectrumAfter[0] ?? { frequency: 0, amplitude: 0 }
    );

    return {
      title: generatedDataset.title,
      quality: quality.overallScore,
      peaks: analysis.detection.peaks.length,
      dominantFrequency: dominant.frequency
    };
  }, [generatedDataset]);

  return (
    <div className="px-4 pb-24 pt-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <div className="section-shell p-6 sm:p-8">
          <div className="relative z-10">
            <div className="text-[0.72rem] uppercase tracking-[0.28em] text-white/[0.38]">
              Synthetic lab
            </div>
            <h1 className="mt-3 font-display text-4xl text-white sm:text-5xl">
              Build traces that stress the workflow
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-6 text-white/[0.62] sm:text-base">
              Adjust rate, noise, drift, clipping, and artifact load. Then push the result straight into the studio or review center.
            </p>
          </div>
        </div>

        <SyntheticLabPanel
          config={config}
          onChange={(patch) => setConfig((current) => ({ ...current, ...patch }))}
          onSignalTypeChange={(signalType) => {
            const nextConfig = configForSyntheticPreset(signalType);
            setConfig(nextConfig);
            setGeneratedDataset(generateSyntheticDataset(nextConfig));
          }}
          onGenerate={() => setGeneratedDataset(generateSyntheticDataset(config))}
          onLoadIntoStudio={() => {
            addDataset(generatedDataset, { setCurrent: true, compareWithCurrent: true });
            navigate("/studio");
          }}
          preview={preview}
        />
      </div>
    </div>
  );
}
