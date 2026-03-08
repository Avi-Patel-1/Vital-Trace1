import { formatDateTime } from "../formatting/format";
import {
  Annotation,
  CompareDelta,
  MetricCard,
  NotebookEntry,
  ProcessedAnalysis,
  QualityReview,
  ReportBuilderState
} from "../../types/signal";
import { biosignalPalette } from "../theme/palette";

function downloadBlob(blob: Blob, fileName: string) {
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function drawSeriesCanvas(
  values: number[],
  color: string,
  width = 1200,
  height = 340,
  overlay?: { values: number[]; color: string }
) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Unable to create canvas context.");
  }

  context.fillStyle = biosignalPalette.charcoalDeep;
  context.fillRect(0, 0, width, height);

  const gridColor = "rgba(243,244,244,0.08)";
  context.strokeStyle = gridColor;
  context.lineWidth = 1;
  for (let index = 0; index < 6; index += 1) {
    const y = 28 + (index / 5) * (height - 56);
    context.beginPath();
    context.moveTo(36, y);
    context.lineTo(width - 36, y);
    context.stroke();
  }

  const plot = (series: number[], strokeStyle: string, lineWidth: number) => {
    const min = Math.min(...series);
    const max = Math.max(...series);
    const spread = Math.max(max - min, 1e-6);

    context.beginPath();
    series.forEach((value, index) => {
      const x = 36 + (index / Math.max(series.length - 1, 1)) * (width - 72);
      const y = height - 28 - ((value - min) / spread) * (height - 56);
      if (index === 0) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    });
    context.strokeStyle = strokeStyle;
    context.lineWidth = lineWidth;
    context.stroke();
  };

  if (overlay) {
    plot(overlay.values, overlay.color, 3);
  }
  plot(values, color, 4);

  return canvas.toDataURL("image/png");
}

function drawSpectrumCanvas(values: { frequency: number; amplitude: number }[], color: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 320;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Unable to create canvas context.");
  }

  context.fillStyle = biosignalPalette.charcoalDeep;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const trimmed = values.filter((point) => point.frequency <= 50);
  const maxAmplitude = Math.max(...trimmed.map((point) => point.amplitude), 1e-6);

  context.strokeStyle = "rgba(255,255,255,0.06)";
  for (let index = 0; index < 6; index += 1) {
    const x = 40 + (index / 5) * (canvas.width - 80);
    context.beginPath();
    context.moveTo(x, 24);
    context.lineTo(x, canvas.height - 28);
    context.stroke();
  }

  context.beginPath();
  trimmed.forEach((point, index) => {
    const x = 40 + (point.frequency / 50) * (canvas.width - 80);
    const y =
      canvas.height - 26 - (point.amplitude / maxAmplitude) * (canvas.height - 60);
    if (index === 0) {
      context.moveTo(x, y);
    } else {
      context.lineTo(x, y);
    }
  });
  context.strokeStyle = color;
  context.lineWidth = 4;
  context.stroke();

  return canvas.toDataURL("image/png");
}

async function dataUrlBytes(dataUrl: string) {
  const response = await fetch(dataUrl);
  return new Uint8Array(await response.arrayBuffer());
}

export async function exportReportPdf({
  analysis,
  metrics,
  annotations,
  notes,
  builder,
  qualityReview,
  notebookEntries = [],
  compareDeltas = [],
  stageSummaries = []
}: {
  analysis: ProcessedAnalysis;
  metrics: MetricCard[];
  annotations: Annotation[];
  notes: string;
  builder?: ReportBuilderState;
  qualityReview?: QualityReview;
  notebookEntries?: NotebookEntry[];
  compareDeltas?: CompareDelta[];
  stageSummaries?: Array<{
    stage: { label: string; startTime: number; endTime: number };
    quality: { overallScore: number };
    rate: number | null;
  }>;
}) {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const waveformValues = analysis.windowFilteredValues;
  const rawValues = analysis.windowRawValues;
  const config: ReportBuilderState = builder ?? {
    title: `${analysis.dataset.title} Summary`,
    sessionLabel: analysis.dataset.shortLabel,
    includeWaveform: true,
    includeSpectrum: true,
    includeQuality: true,
    includeNotebook: true,
    includeComparison: false,
    includeTimeline: false,
    includeAnnotations: true,
    selectedMetricIds: metrics.map((metric) => metric.id)
  };

  const waveformPng = drawSeriesCanvas(waveformValues, analysis.selectedChannel.color, 1200, 340, {
    values: rawValues,
    color: "rgba(255,255,255,0.18)"
  });
  const spectrumPng = drawSpectrumCanvas(analysis.spectrumAfter, analysis.selectedChannel.color);

  const pdf = await PDFDocument.create();
  const pageHeight = 1520;
  const page = pdf.addPage([900, pageHeight]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const waveImage = await pdf.embedPng(await dataUrlBytes(waveformPng));
  const spectrumImage = await pdf.embedPng(await dataUrlBytes(spectrumPng));

  page.drawRectangle({
    x: 0,
    y: 0,
    width: 900,
    height: pageHeight,
    color: rgb(0.96, 0.94, 0.91)
  });

  page.drawRectangle({
    x: 48,
    y: pageHeight - 130,
    width: 804,
    height: 86,
    color: rgb(0.17, 0.17, 0.17)
  });

  page.drawText("Vital Trace", {
    x: 72,
    y: pageHeight - 88,
    size: 24,
    font: bold,
    color: rgb(0.97, 0.96, 0.94)
  });
  page.drawText(config.title, {
    x: 72,
    y: pageHeight - 112,
    size: 11.5,
    font,
    color: rgb(0.52, 0.22, 0.33)
  });
  page.drawText(formatDateTime(), {
    x: 640,
    y: pageHeight - 96,
    size: 11,
    font,
    color: rgb(0.64, 0.58, 0.62)
  });

  page.drawText(analysis.dataset.title, {
    x: 60,
    y: pageHeight - 172,
    size: 22,
    font: bold,
    color: rgb(0.17, 0.14, 0.17)
  });
  page.drawText(`${analysis.dataset.fileName} · ${analysis.dataset.signalType.toUpperCase()} · ${analysis.selectedChannel.name} · ${config.sessionLabel}`, {
    x: 60,
    y: pageHeight - 194,
    size: 11,
    font,
    color: rgb(0.36, 0.31, 0.35)
  });

  metrics.slice(0, 6).forEach((metric, index) => {
    const boxX = 60 + (index % 3) * 255;
    const boxY = pageHeight - 280 - Math.floor(index / 3) * 112;
    page.drawRectangle({
      x: boxX,
      y: boxY,
      width: 225,
      height: 88,
      borderWidth: 1,
      borderColor: rgb(0.83, 0.79, 0.82),
      color: rgb(1, 1, 1)
    });
    page.drawText(metric.label, {
      x: boxX + 18,
      y: boxY + 56,
      size: 11,
      font,
      color: rgb(0.41, 0.36, 0.39)
    });
    page.drawText(metric.value, {
      x: boxX + 18,
      y: boxY + 26,
      size: 20,
      font: bold,
      color: rgb(0.16, 0.14, 0.16)
    });
  });

  let cursorY = pageHeight - 430;
  const drawSectionTitle = (title: string) => {
    page.drawText(title, {
      x: 60,
      y: cursorY,
      size: 12,
      font: bold,
      color: rgb(0.38, 0.18, 0.29)
    });
    cursorY -= 18;
  };

  if (config.includeWaveform) {
    drawSectionTitle("Time-domain view");
    page.drawImage(waveImage, {
      x: 60,
      y: cursorY - 220,
      width: 780,
      height: 220
    });
    cursorY -= 248;
  }

  if (config.includeSpectrum) {
    drawSectionTitle("Frequency-domain view");
    page.drawImage(spectrumImage, {
      x: 60,
      y: cursorY - 170,
      width: 780,
      height: 170
    });
    cursorY -= 198;
  }

  if (config.includeQuality && qualityReview) {
    drawSectionTitle("Signal quality");
    page.drawText(
      `${qualityReview.overallScore}% quality · ${qualityReview.rating}${qualityReview.dominantIssue ? ` · ${qualityReview.dominantIssue}` : ""}`,
      {
        x: 60,
        y: cursorY,
        size: 10.5,
        font,
        color: rgb(0.32, 0.28, 0.31)
      }
    );
    cursorY -= 24;
  }

  if (config.includeNotebook) {
    drawSectionTitle("Notable regions");
    const notebookLines = notebookEntries.length
      ? notebookEntries.slice(0, 4).map((entry) => {
          return `${entry.label} · ${entry.startTime.toFixed(2)} s to ${entry.endTime.toFixed(2)} s`;
        })
      : ["No notebook regions added."];

    notebookLines.forEach((line, index) => {
      page.drawText(line, {
        x: 60,
        y: cursorY - index * 18,
        size: 10.5,
        font,
        color: rgb(0.32, 0.28, 0.31)
      });
    });
    cursorY -= Math.max(32, notebookLines.length * 18 + 8);
  }

  if (config.includeAnnotations) {
    drawSectionTitle("Annotations");
    const annotationLines = annotations.length
      ? annotations.slice(0, 4).map((annotation) => {
          const endPart =
            annotation.endTime !== undefined ? ` to ${annotation.endTime.toFixed(2)} s` : "";
          return `${annotation.label} · ${annotation.time.toFixed(2)} s${endPart}`;
        })
      : ["No annotations added."];

    annotationLines.forEach((line, index) => {
      page.drawText(line, {
        x: 60,
        y: cursorY - index * 18,
        size: 10.5,
        font,
        color: rgb(0.32, 0.28, 0.31)
      });
    });
    cursorY -= Math.max(32, annotationLines.length * 18 + 8);
  }

  if (config.includeComparison && compareDeltas.length) {
    drawSectionTitle("Comparison summary");
    compareDeltas.slice(0, 4).forEach((delta, index) => {
      page.drawText(`${delta.label}: ${delta.primary} vs ${delta.comparison} (${delta.delta})`, {
        x: 60,
        y: cursorY - index * 18,
        size: 10.5,
        font,
        color: rgb(0.32, 0.28, 0.31)
      });
    });
    cursorY -= Math.max(32, compareDeltas.slice(0, 4).length * 18 + 8);
  }

  if (config.includeTimeline && stageSummaries.length) {
    drawSectionTitle("Timeline stages");
    stageSummaries.slice(0, 4).forEach((stageSummary, index) => {
      const ratePart = stageSummary.rate ? ` · ${stageSummary.rate.toFixed(0)} bpm` : "";
      page.drawText(
        `${stageSummary.stage.label}: ${stageSummary.stage.startTime.toFixed(1)}-${stageSummary.stage.endTime.toFixed(1)} s · ${stageSummary.quality.overallScore}% quality${ratePart}`,
        {
          x: 60,
          y: cursorY - index * 18,
          size: 10.5,
          font,
          color: rgb(0.32, 0.28, 0.31)
        }
      );
    });
    cursorY -= Math.max(32, stageSummaries.slice(0, 4).length * 18 + 8);
  }

  drawSectionTitle("Analyst notes");
  page.drawText(notes || "No analyst notes entered.", {
    x: 60,
    y: cursorY,
    size: 10.5,
    font,
    color: rgb(0.32, 0.28, 0.31),
    maxWidth: 780,
    lineHeight: 15
  });

  page.drawRectangle({
    x: 60,
    y: 54,
    width: 780,
    height: 72,
    color: rgb(0.93, 0.87, 0.89)
  });
  page.drawText(
    "Prototype analysis environment. Not a medical device and not for clinical diagnosis.",
    {
      x: 78,
      y: 84,
      size: 11,
      font: bold,
      color: rgb(0.38, 0.18, 0.26)
    }
  );

  const pdfBytes = await pdf.save();
  const pdfBuffer = Uint8Array.from(pdfBytes).buffer;
  downloadBlob(
    new Blob([pdfBuffer], { type: "application/pdf" }),
    `${analysis.dataset.id}-report.pdf`
  );
}

export function exportPlotPng(analysis: ProcessedAnalysis) {
  const values = analysis.windowFilteredValues;
  const rawValues = analysis.windowRawValues;

  const png = drawSeriesCanvas(values, analysis.selectedChannel.color, 1200, 340, {
    values: rawValues,
    color: "rgba(255,255,255,0.18)"
  });

  fetch(png)
    .then((response) => response.blob())
    .then((blob) => {
      downloadBlob(blob, `${analysis.dataset.id}-${analysis.selectedChannel.id}.png`);
    });
}

export function exportChartImageSet({
  analysis,
  includeSpectrum
}: {
  analysis: ProcessedAnalysis;
  includeSpectrum: boolean;
}) {
  exportPlotPng(analysis);

  if (!includeSpectrum) {
    return;
  }

  const png = drawSpectrumCanvas(analysis.spectrumAfter, analysis.selectedChannel.color);
  fetch(png)
    .then((response) => response.blob())
    .then((blob) => {
      downloadBlob(blob, `${analysis.dataset.id}-${analysis.selectedChannel.id}-spectrum.png`);
    });
}
