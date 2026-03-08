import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";

import { buildAnalysis } from "../lib/analysis/buildAnalysis";
import { formatFrequency, formatPercent, formatSeconds } from "../lib/formatting/format";
import { filtersForPreset } from "../lib/presets/presets";
import { computeQualityReview } from "../lib/review/quality";
import { biosignalPalette, notebookCategoryColors } from "../lib/theme/palette";
import { useSignalProcessing } from "./useSignalProcessing";
import { useStudioStore } from "../store/useStudioStore";
import {
  CompareDelta,
  InsightFinding,
  MetricCard,
  NotebookEntry,
  ProcessedAnalysis,
  QualityReview,
  SignalDataset,
  TimelineStage
} from "../types/signal";

function mean(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
}

function standardDeviation(values: number[]) {
  const avg = mean(values);
  const variance =
    values.reduce((sum, value) => sum + (value - avg) ** 2, 0) /
    Math.max(values.length, 1);
  return Math.sqrt(variance);
}

function dominantFrequency(analysis: ProcessedAnalysis) {
  return analysis.spectrumAfter.reduce(
    (best, point) => (point.amplitude > best.amplitude ? point : best),
    analysis.spectrumAfter[0] ?? { frequency: 0, amplitude: 0 }
  ).frequency;
}

function rateForAnalysis(analysis: ProcessedAnalysis) {
  const intervalMean = mean(analysis.detection.intervalsSec);
  if (!Number.isFinite(intervalMean) || intervalMean <= 0) {
    return null;
  }
  return 60 / intervalMean;
}

function rms(values: number[]) {
  return Math.sqrt(
    values.reduce((sum, value) => sum + value * value, 0) / Math.max(values.length, 1)
  );
}

function formatSigned(value: number, suffix = "") {
  const rounded = Math.abs(value) >= 10 ? value.toFixed(0) : value.toFixed(1);
  return `${value > 0 ? "+" : value < 0 ? "−" : ""}${Math.abs(Number(rounded))}${suffix}`;
}

function compareMetric(
  id: string,
  label: string,
  primaryValue: number,
  comparisonValue: number,
  suffix: string,
  note: string
): CompareDelta {
  const delta = primaryValue - comparisonValue;
  return {
    id,
    label,
    primary: `${primaryValue.toFixed(suffix === "%" ? 0 : 1)}${suffix}`,
    comparison: `${comparisonValue.toFixed(suffix === "%" ? 0 : 1)}${suffix}`,
    delta: formatSigned(delta, suffix),
    direction: delta > 0.05 ? "up" : delta < -0.05 ? "down" : "flat",
    note
  };
}

function insightFindings(
  analysis: ProcessedAnalysis,
  qualityReview: QualityReview,
  annotationsCount: number,
  notebookEntries: NotebookEntry[]
) {
  const dominant = dominantFrequency(analysis);
  const rate = rateForAnalysis(analysis);
  const intervalSpread = standardDeviation(analysis.detection.intervalsSec) * 1000;
  const notableRegionCount =
    analysis.detection.regions.length +
    qualityReview.flags.length +
    notebookEntries.length;

  const findings: InsightFinding[] = [
    {
      id: "signal",
      label: "Signal",
      value: analysis.dataset.signalType.toUpperCase(),
      note: `${analysis.dataset.sampleRateHz} Hz · ${analysis.dataset.channels.length} channels`
    },
    {
      id: "duration",
      label: "Window",
      value: formatSeconds(analysis.selectedRange.end - analysis.selectedRange.start),
      note: analysis.selectedChannel.name
    },
    {
      id: "quality",
      label: "Quality",
      value: formatPercent(qualityReview.overallScore),
      tone: "accent",
      note: qualityReview.dominantIssue ?? qualityReview.rating
    },
    {
      id: "events",
      label: "Events",
      value: `${analysis.detection.peaks.length}`,
      note: `${analysis.detection.regions.length} active region${analysis.detection.regions.length === 1 ? "" : "s"}`
    },
    {
      id: "dominant",
      label: "Dominant band",
      value: formatFrequency(dominant),
      note: "Highest spectral amplitude"
    },
    {
      id: "interval",
      label: "Variability",
      value: `${intervalSpread ? intervalSpread.toFixed(0) : "0"} ms`,
      note: rate ? `${rate.toFixed(0)} bpm / bpm-equivalent` : "No stable interval set"
    },
    {
      id: "regions",
      label: "Notable regions",
      value: `${notableRegionCount}`,
      note: `${annotationsCount} annotations saved`
    }
  ];

  return findings;
}

function buildAutoTimeline(dataset: SignalDataset): TimelineStage[] {
  const thirds = dataset.durationSec / 3;
  return [
    {
      id: `${dataset.id}-stage-a`,
      datasetId: dataset.id,
      label: "Baseline",
      startTime: 0,
      endTime: thirds,
      accent: biosignalPalette.cyan,
      createdAt: new Date().toISOString()
    },
    {
      id: `${dataset.id}-stage-b`,
      datasetId: dataset.id,
      label: "Activity",
      startTime: thirds,
      endTime: thirds * 2,
      accent: biosignalPalette.roseSoft,
      createdAt: new Date().toISOString()
    },
    {
      id: `${dataset.id}-stage-c`,
      datasetId: dataset.id,
      label: "Recovery",
      startTime: thirds * 2,
      endTime: dataset.durationSec,
      accent: biosignalPalette.green,
      createdAt: new Date().toISOString()
    }
  ];
}

function timelineSummary(stage: TimelineStage, datasets: SignalDataset[]) {
  const dataset = datasets.find((item) => item.id === stage.datasetId) ?? datasets[0];
  const analysis = buildAnalysis(
    dataset,
    filtersForPreset(dataset.suggestedPresetId),
    dataset.channels[0]?.id ?? null,
    {
      start: stage.startTime,
      end: stage.endTime
    }
  );
  const quality = computeQualityReview(
    analysis.fullSelectedRaw,
    analysis.fullSelectedFiltered,
    dataset.sampleRateHz,
    dataset.signalType
  );
  return {
    stage,
    analysis,
    quality,
    rate: rateForAnalysis(analysis)
  };
}

export function useReviewWorkflow() {
  const { primary, comparison, annotations, analystNotes } = useSignalProcessing();
  const {
    datasets,
    currentDatasetId,
    comparisonDatasetId,
    notebookEntriesByDataset,
    reportBuilder,
    guidedReview,
    timelineStages
  } = useStudioStore(
    useShallow((state) => ({
      datasets: state.datasets,
      currentDatasetId: state.currentDatasetId,
      comparisonDatasetId: state.comparisonDatasetId,
      notebookEntriesByDataset: state.notebookEntries,
      reportBuilder: state.reportBuilder,
      guidedReview: state.guidedReview,
      timelineStages: state.timelineStages
    }))
  );

  return useMemo(() => {
    const notebookEntries = notebookEntriesByDataset[currentDatasetId] ?? [];
    const qualityReview = computeQualityReview(
      primary.fullSelectedRaw,
      primary.fullSelectedFiltered,
      primary.dataset.sampleRateHz,
      primary.dataset.signalType
    );

    const comparisonQuality = comparison
      ? computeQualityReview(
          comparison.fullSelectedRaw,
          comparison.fullSelectedFiltered,
          comparison.dataset.sampleRateHz,
          comparison.dataset.signalType
        )
      : null;

    const includedNotebookEntries = notebookEntries.filter((entry) => entry.includeInReport);
    const findings = insightFindings(primary, qualityReview, annotations.length, notebookEntries);
    const notableRegions = [
      ...includedNotebookEntries,
      ...qualityReview.flags.slice(0, 4).map((flag) => ({
        id: flag.id,
        datasetId: currentDatasetId,
        label: flag.kind,
        note: flag.note,
        category: "noise" as const,
        startTime: flag.startTime,
        endTime: flag.endTime,
        createdAt: new Date().toISOString(),
        includeInReport: true,
        color:
          flag.kind === "motion artifact"
            ? notebookCategoryColors["motion artifact"]
            : notebookCategoryColors.noise
      }))
    ].slice(0, 6);

    const compareDeltas: CompareDelta[] =
      comparison && comparisonQuality
        ? [
            compareMetric(
              "quality",
              "Quality",
              qualityReview.overallScore,
              comparisonQuality.overallScore,
              "%",
              "Overall trust in the reviewed window"
            ),
            compareMetric(
              "peaks",
              "Events",
              primary.detection.peaks.length,
              comparison.detection.peaks.length,
              "",
              "Detected peaks or pulses in the selected range"
            ),
            compareMetric(
              "dominant",
              "Dominant band",
              dominantFrequency(primary),
              dominantFrequency(comparison),
              " Hz",
              "Strongest spectral component"
            ),
            compareMetric(
              "rms",
              "RMS",
              rms(primary.windowFilteredValues),
              rms(comparison.windowFilteredValues),
              "",
              "Window energy after filtering"
            )
          ]
        : [];

    const compareHighlights =
      comparison && comparisonQuality
        ? compareDeltas
            .filter((item) => item.direction !== "flat")
            .slice(0, 3)
            .map((item) => `${item.label} ${item.delta}`)
        : [
            "Compare a second session",
            "Or stay in single-recording mode and review prior windows"
          ];

    const batchRows = datasets.map((dataset) => {
      const analysis = buildAnalysis(
        dataset,
        filtersForPreset(dataset.suggestedPresetId),
        dataset.channels[0]?.id ?? null,
        dataset.defaultWindow ?? {
          start: 0,
          end: Math.min(dataset.durationSec, primary.selectedRange.end - primary.selectedRange.start)
        }
      );
      const quality = computeQualityReview(
        analysis.fullSelectedRaw,
        analysis.fullSelectedFiltered,
        dataset.sampleRateHz,
        dataset.signalType
      );

      return {
        dataset,
        analysis,
        quality,
        rate: rateForAnalysis(analysis),
        dominantFrequency: dominantFrequency(analysis)
      };
    });

    const batchSummary = {
      averageQuality:
        batchRows.reduce((sum, row) => sum + row.quality.overallScore, 0) /
        Math.max(batchRows.length, 1),
      lowQualityCount: batchRows.filter((row) => row.quality.overallScore < 55).length,
      outliers: batchRows
        .filter((row) => row.quality.flags.length >= 2 || row.analysis.detection.regions.length >= 2)
        .slice(0, 4)
    };

    const stages =
      timelineStages.length > 0
        ? timelineStages
        : buildAutoTimeline(primary.dataset);

    const stageSummaries = stages
      .map((stage) => timelineSummary(stage, datasets))
      .sort((left, right) => left.stage.startTime - right.stage.startTime);

    const reportMetrics: MetricCard[] =
      reportBuilder.selectedMetricIds.length > 0
        ? primary.metrics.filter((metric) => reportBuilder.selectedMetricIds.includes(metric.id))
        : primary.metrics.slice(0, 6);

    return {
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
      batchRows,
      batchSummary,
      reportBuilder,
      guidedReview,
      stageSummaries,
      reportMetrics,
      currentDatasetId,
      comparisonDatasetId
    };
  }, [
    analystNotes,
    annotations,
    comparison,
    comparisonDatasetId,
    currentDatasetId,
    datasets,
    guidedReview,
    notebookEntriesByDataset,
    primary,
    reportBuilder,
    timelineStages
  ]);
}
