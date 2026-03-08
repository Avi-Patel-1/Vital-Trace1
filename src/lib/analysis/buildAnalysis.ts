import { detectSignalFeatures } from "../detection/detect";
import { computeSpectrum, computeSpectrogram } from "../fft/fft";
import { applyFilterPipeline } from "../filters/filterPipeline";
import { computeMetrics } from "../metrics/metrics";
import {
  FilterSettings,
  ProcessedAnalysis,
  ProcessedChannel,
  SignalDataset,
  TimeRange
} from "../../types/signal";

function clampSelection(selection: TimeRange, durationSec: number): TimeRange {
  const start = Math.max(0, Math.min(selection.start, durationSec));
  const end = Math.max(start + 0.2, Math.min(selection.end, durationSec));
  return { start, end };
}

export function buildProcessedChannels(
  dataset: SignalDataset,
  filters: FilterSettings
) {
  return dataset.channels.map<ProcessedChannel>((channel) => {
    const filtered = applyFilterPipeline(channel.values, dataset.sampleRateHz, filters);
    return {
      id: channel.id,
      name: channel.name,
      unit: channel.unit,
      color: channel.color,
      raw: channel.values,
      filtered,
      min: Math.min(...filtered),
      max: Math.max(...filtered)
    };
  });
}

function sliceValues(values: number[], sampleRateHz: number, selection: TimeRange) {
  const start = Math.max(0, Math.floor(selection.start * sampleRateHz));
  const end = Math.min(values.length, Math.ceil(selection.end * sampleRateHz));
  return {
    values: values.slice(start, end),
    start,
    end
  };
}

export function buildAnalysis(
  dataset: SignalDataset,
  filters: FilterSettings,
  activeChannelId: string | null,
  selection: TimeRange
): ProcessedAnalysis {
  const processedChannels = buildProcessedChannels(dataset, filters);
  const selectedChannel =
    processedChannels.find((channel) => channel.id === activeChannelId) ??
    processedChannels[0];
  const selectedRange = clampSelection(selection, dataset.durationSec);
  const rawWindow = sliceValues(selectedChannel.raw, dataset.sampleRateHz, selectedRange);
  const filteredWindow = sliceValues(
    selectedChannel.filtered,
    dataset.sampleRateHz,
    selectedRange
  );
  const detection = detectSignalFeatures(
    filteredWindow.values,
    dataset.sampleRateHz,
    dataset.signalType
  );
  const spectrumBefore = computeSpectrum(rawWindow.values, dataset.sampleRateHz);
  const spectrumAfter = computeSpectrum(filteredWindow.values, dataset.sampleRateHz);
  const spectrogram = computeSpectrogram(filteredWindow.values, dataset.sampleRateHz);
  const metrics = computeMetrics(
    filteredWindow.values,
    dataset.sampleRateHz,
    dataset.signalType,
    detection,
    spectrumAfter,
    selectedRange
  );

  return {
    dataset,
    selectedChannel,
    processedChannels,
    detection,
    metrics,
    spectrumBefore,
    spectrumAfter,
    spectrogram,
    selectedRange,
    selectedIndexes: {
      start: filteredWindow.start,
      end: filteredWindow.end
    },
    fullSelectedRaw: selectedChannel.raw,
    fullSelectedFiltered: selectedChannel.filtered,
    windowRawValues: rawWindow.values,
    windowFilteredValues: filteredWindow.values,
    timeAxis: Array.from(
      { length: selectedChannel.filtered.length },
      (_, index) => index / dataset.sampleRateHz
    )
  };
}
