import { SpectrogramGrid, SpectrumPoint } from "../../types/signal";

function nextPowerOfTwo(value: number) {
  let power = 1;
  while (power < value) {
    power <<= 1;
  }
  return power;
}

function resample(values: number[], targetLength: number) {
  if (values.length <= targetLength) {
    return [...values];
  }

  const output = new Array(targetLength).fill(0);
  const step = (values.length - 1) / Math.max(targetLength - 1, 1);

  for (let index = 0; index < targetLength; index += 1) {
    const sourceIndex = index * step;
    const left = Math.floor(sourceIndex);
    const right = Math.min(values.length - 1, Math.ceil(sourceIndex));
    const mix = sourceIndex - left;
    output[index] = values[left] * (1 - mix) + values[right] * mix;
  }

  return output;
}

function fftReal(input: number[]) {
  const n = nextPowerOfTwo(input.length);
  const real = new Array(n).fill(0);
  const imag = new Array(n).fill(0);

  for (let index = 0; index < input.length; index += 1) {
    real[index] = input[index];
  }

  let j = 0;
  for (let i = 1; i < n; i += 1) {
    let bit = n >> 1;
    while (j & bit) {
      j ^= bit;
      bit >>= 1;
    }
    j ^= bit;
    if (i < j) {
      [real[i], real[j]] = [real[j], real[i]];
      [imag[i], imag[j]] = [imag[j], imag[i]];
    }
  }

  for (let len = 2; len <= n; len <<= 1) {
    const angle = (-2 * Math.PI) / len;
    const stepReal = Math.cos(angle);
    const stepImag = Math.sin(angle);

    for (let offset = 0; offset < n; offset += len) {
      let wReal = 1;
      let wImag = 0;

      for (let inner = 0; inner < len / 2; inner += 1) {
        const evenIndex = offset + inner;
        const oddIndex = evenIndex + len / 2;

        const oddReal = real[oddIndex] * wReal - imag[oddIndex] * wImag;
        const oddImag = real[oddIndex] * wImag + imag[oddIndex] * wReal;

        const evenReal = real[evenIndex];
        const evenImag = imag[evenIndex];

        real[evenIndex] = evenReal + oddReal;
        imag[evenIndex] = evenImag + oddImag;
        real[oddIndex] = evenReal - oddReal;
        imag[oddIndex] = evenImag - oddImag;

        const nextWReal = wReal * stepReal - wImag * stepImag;
        const nextWImag = wReal * stepImag + wImag * stepReal;
        wReal = nextWReal;
        wImag = nextWImag;
      }
    }
  }

  return { real, imag };
}

export function computeSpectrum(
  values: number[],
  sampleRateHz: number,
  maxPoints = 1024
): SpectrumPoint[] {
  const prepared = resample(values, Math.min(maxPoints, values.length || 1));
  const { real, imag } = fftReal(prepared);
  const length = real.length;
  const output: SpectrumPoint[] = [];

  for (let index = 0; index < length / 2; index += 1) {
    const amplitude =
      (2 * Math.sqrt(real[index] ** 2 + imag[index] ** 2)) / length;
    output.push({
      frequency: (index * sampleRateHz) / length,
      amplitude
    });
  }

  return output;
}

export function computeSpectrogram(
  values: number[],
  sampleRateHz: number,
  windowSize = 256,
  stepSize = 64
): SpectrogramGrid {
  const padded = values.length < windowSize ? resample(values, windowSize) : values;
  const columns: number[] = [];
  const rows: number[] = [];
  const matrix: number[][] = [];

  for (let start = 0; start + windowSize <= padded.length; start += stepSize) {
    const segment = padded.slice(start, start + windowSize);
    const spectrum = computeSpectrum(segment, sampleRateHz, windowSize);
    const trimmed = spectrum.slice(0, 48);

    if (!rows.length) {
      trimmed.forEach((point) => rows.push(point.frequency));
    }

    columns.push(start / sampleRateHz);
    matrix.push(trimmed.map((point) => point.amplitude));
  }

  return {
    times: columns,
    frequencies: rows,
    values: matrix
  };
}
