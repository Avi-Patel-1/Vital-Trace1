import {
  ParsedUpload,
  SignalChannel,
  SignalDataset,
  SignalType,
  UploadImportOptions
} from "../../types/signal";
import { slugify } from "../formatting/format";
import { signalTraceColors } from "../theme/palette";

function detectDelimiter(line: string) {
  const options = [",", "\t", ";", "|"];
  return options.reduce(
    (best, delimiter) => {
      const count = line.split(delimiter).length;
      return count > best.count ? { delimiter, count } : best;
    },
    { delimiter: ",", count: 0 }
  ).delimiter;
}

function guessSignalType(headers: string[], fileName: string): SignalType {
  const joined = [...headers, fileName].join(" ").toLowerCase();

  if (joined.includes("ecg") || joined.includes("rr")) {
    return "ecg";
  }
  if (joined.includes("emg")) {
    return "emg";
  }
  if (joined.includes("ppg") || joined.includes("pulse")) {
    return "ppg";
  }
  if (joined.includes("resp")) {
    return "respiration";
  }
  if (joined.includes("accel") || joined.includes("motion")) {
    return "motion";
  }
  return "generic";
}

function inferTimeColumn(headers: string[], rows: number[][]) {
  const headerIndex = headers.findIndex((header) =>
    /time|sec|timestamp|ms/i.test(header)
  );
  if (headerIndex >= 0) {
    return headerIndex;
  }

  const columnCount = headers.length;
  for (let column = 0; column < columnCount; column += 1) {
    let monotonic = true;
    for (let row = 1; row < rows.length; row += 1) {
      if (rows[row][column] <= rows[row - 1][column]) {
        monotonic = false;
        break;
      }
    }
    if (monotonic) {
      return column;
    }
  }

  return null;
}

function inferSampleRate(rows: number[][], timeColumn: number | null) {
  if (timeColumn === null || rows.length < 3) {
    return 100;
  }

  const deltas: number[] = [];
  for (let index = 1; index < Math.min(rows.length, 40); index += 1) {
    deltas.push(rows[index][timeColumn] - rows[index - 1][timeColumn]);
  }

  const positive = deltas.filter((delta) => Number.isFinite(delta) && delta > 0);
  const average =
    positive.reduce((sum, delta) => sum + delta, 0) / Math.max(positive.length, 1);

  if (!average || !Number.isFinite(average)) {
    return 100;
  }

  return average > 2 ? 1000 / average : 1 / average;
}

function parseDelimited(content: string, fileName: string): ParsedUpload {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const delimiter = detectDelimiter(lines[0] ?? "");
  const firstRow = (lines[0] ?? "").split(delimiter).map((value) => value.trim());
  const hasHeader = firstRow.some((value) => Number.isNaN(Number(value)));
  const headers = hasHeader
    ? firstRow
    : firstRow.map((_, index) => `column_${index + 1}`);
  const dataLines = hasHeader ? lines.slice(1) : lines;

  const rows = dataLines
    .map((line) => line.split(delimiter).map((value) => Number(value.trim())))
    .filter((row) => row.every((value) => Number.isFinite(value)));

  const numericColumns = headers
    .map((_, index) => index)
    .filter((index) => rows.every((row) => Number.isFinite(row[index])));

  const inferredTimeColumn = inferTimeColumn(headers, rows);

  return {
    fileName,
    headers,
    rows,
    numericColumns,
    inferredTimeColumn,
    inferredSampleRateHz: inferSampleRate(rows, inferredTimeColumn),
    signalTypeGuess: guessSignalType(headers, fileName)
  };
}

function parseJson(content: string, fileName: string): ParsedUpload {
  const payload = JSON.parse(content);

  if (Array.isArray(payload)) {
    if (!payload.length || typeof payload[0] !== "object") {
      throw new Error("Unsupported JSON array shape.");
    }

    const headers = Object.keys(payload[0] as Record<string, number>);
    const rows = payload.map((item) =>
      headers.map((header) => Number((item as Record<string, number>)[header]))
    );
    const numericColumns = headers
      .map((_, index) => index)
      .filter((index) => rows.every((row) => Number.isFinite(row[index])));
    const inferredTimeColumn = inferTimeColumn(headers, rows);

    return {
      fileName,
      headers,
      rows,
      numericColumns,
      inferredTimeColumn,
      inferredSampleRateHz: inferSampleRate(rows, inferredTimeColumn),
      signalTypeGuess: guessSignalType(headers, fileName)
    };
  }

  if (payload && Array.isArray(payload.time) && payload.channels) {
    const channelNames = Object.keys(payload.channels);
    const headers = ["time", ...channelNames];
    const rows = payload.time.map((time: number, index: number) => [
      Number(time),
      ...channelNames.map((name) => Number(payload.channels[name][index]))
    ]);

    return {
      fileName,
      headers,
      rows,
      numericColumns: headers.map((_, index) => index),
      inferredTimeColumn: 0,
      inferredSampleRateHz: inferSampleRate(rows, 0),
      signalTypeGuess: guessSignalType(headers, fileName)
    };
  }

  throw new Error("Unsupported JSON structure.");
}

export async function parseSignalFile(file: File): Promise<ParsedUpload> {
  const content = await file.text();
  if (file.name.toLowerCase().endsWith(".json")) {
    return parseJson(content, file.name);
  }

  return parseDelimited(content, file.name);
}

const uploadColors = signalTraceColors;

export function buildDatasetFromUpload(
  parsed: ParsedUpload,
  options: UploadImportOptions
): SignalDataset {
  const timeColumn = options.timeColumn;
  const sampleRateHz = options.sampleRateHz;

  const timeSeries =
    timeColumn === null
      ? parsed.rows.map((_, index) => index / sampleRateHz)
      : parsed.rows.map((row) => row[timeColumn]);

  const channels: SignalChannel[] = options.selectedColumns.map((column, index) => ({
    id: slugify(`${options.title}-${parsed.headers[column]}`),
    name: parsed.headers[column],
    unit: options.signalType === "ecg" || options.signalType === "ppg" ? "mV" : "a.u.",
    color: uploadColors[index % uploadColors.length],
    values: parsed.rows.map((row) => row[column])
  }));

  const durationSec = timeSeries[timeSeries.length - 1] ?? channels[0]?.values.length / sampleRateHz;

  return {
    id: slugify(`${options.title}-${Date.now()}`),
    title: options.title,
    shortLabel: options.title,
    description: `Imported from ${parsed.fileName}`,
    context: "User-uploaded recording",
    signalType: options.signalType,
    sampleRateHz,
    durationSec,
    fileName: parsed.fileName,
    source: "upload",
    tags: ["upload"],
    channels,
    suggestedPresetId: `${options.signalType}-review`,
    defaultWindow: {
      start: 0,
      end: Math.min(10, durationSec)
    }
  };
}
