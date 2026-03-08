import fs from "node:fs";
import path from "node:path";

const outputDir = path.join(process.cwd(), "public", "samples");

function mulberry32(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(x, center, width, amplitude) {
  return amplitude * Math.exp(-((x - center) ** 2) / (2 * width * width));
}

function timeAxis(durationSec, sampleRateHz) {
  const count = Math.round(durationSec * sampleRateHz);
  return Array.from({ length: count }, (_, index) => index / sampleRateHz);
}

function createEcgWave(times, heartRateBpm, seed, motion = 0) {
  const random = mulberry32(seed);
  const values = new Array(times.length).fill(0);
  let beatTime = 0.35;
  const intervalBase = 60 / heartRateBpm;

  while (beatTime < times.at(-1) + 1) {
    const interval = intervalBase + (random() - 0.5) * 0.08;
    beatTime += interval;
    for (let index = 0; index < times.length; index += 1) {
      const t = times[index];
      values[index] += gaussian(t, beatTime - 0.18, 0.03, 0.08);
      values[index] += gaussian(t, beatTime - 0.035, 0.009, -0.16);
      values[index] += gaussian(t, beatTime, 0.012, 1.12);
      values[index] += gaussian(t, beatTime + 0.03, 0.009, -0.24);
      values[index] += gaussian(t, beatTime + 0.22, 0.065, 0.32);
    }
  }

  return values.map((value, index) => {
    const t = times[index];
    const wander = Math.sin(2 * Math.PI * 0.22 * t) * 0.05;
    const mains = Math.sin(2 * Math.PI * 60 * t) * 0.012;
    const motionArtifact =
      motion *
      (Math.sin(2 * Math.PI * 1.2 * t) * 0.12 +
        Math.sin(2 * Math.PI * 2.7 * t) * 0.08);
    const noise = (random() - 0.5) * (0.04 + motion * 0.08);
    return value + wander + mains + motionArtifact + noise;
  });
}

function createPpgWave(times, bpm, seed) {
  const random = mulberry32(seed);
  const values = new Array(times.length).fill(0);
  let beatTime = 0.25;

  while (beatTime < times.at(-1) + 1) {
    const interval = 60 / bpm + (random() - 0.5) * 0.07;
    beatTime += interval;
    for (let index = 0; index < times.length; index += 1) {
      const t = times[index] - beatTime;
      if (t < 0 || t > 0.9) {
        continue;
      }
      const systolic = 1.1 * t * Math.exp(-9 * t);
      const notch = 0.23 * Math.exp(-((t - 0.24) ** 2) / 0.002);
      values[index] += systolic + notch;
    }
  }

  return values.map((value, index) => {
    const t = times[index];
    return (
      value +
      0.12 * Math.sin(2 * Math.PI * 0.12 * t) +
      0.02 * Math.sin(2 * Math.PI * 7 * t) +
      (random() - 0.5) * 0.03
    );
  });
}

function createRespiration(times, bpm, seed) {
  const random = mulberry32(seed);
  return times.map((time) => {
    const depth = 0.9 + 0.18 * Math.sin(2 * Math.PI * 0.015 * time);
    const base =
      depth * Math.sin(2 * Math.PI * (bpm / 60) * time) +
      0.12 * Math.sin(2 * Math.PI * (bpm / 120) * time + 1.1);
    return base + (random() - 0.5) * 0.035;
  });
}

function createEmg(times, seed) {
  const random = mulberry32(seed);
  const bursts = [
    [1.2, 2.1],
    [3.6, 4.1],
    [5.8, 6.9],
    [8.1, 9.7]
  ];

  return times.map((time) => {
    const burstLevel = bursts.some(([start, end]) => time >= start && time <= end)
      ? 1
      : 0.08;
    const carrier =
      Math.sin(2 * Math.PI * 38 * time) * 0.18 +
      Math.sin(2 * Math.PI * 74 * time) * 0.12 +
      Math.sin(2 * Math.PI * 112 * time) * 0.06;
    return burstLevel * carrier + (random() - 0.5) * 0.32 * burstLevel;
  });
}

function createMotionTrace(times, seed) {
  const random = mulberry32(seed);
  return times.map((time) => {
    const gesture =
      gaussian(time, 4.3, 0.4, 1.6) -
      gaussian(time, 4.8, 0.2, 1.2) +
      gaussian(time, 8.5, 0.32, 1.25);
    return (
      gesture +
      0.4 * Math.sin(2 * Math.PI * 0.4 * time) +
      0.18 * Math.sin(2 * Math.PI * 3.2 * time) +
      (random() - 0.5) * 0.12
    );
  });
}

function createSynthetic(times, seed) {
  const random = mulberry32(seed);
  return times.map((time) => {
    return (
      0.6 * Math.sin(2 * Math.PI * 2.2 * time) +
      0.28 * Math.sin(2 * Math.PI * 17 * time) +
      0.14 * Math.sin(2 * Math.PI * 31 * time) +
      gaussian(time, 5.3, 0.18, 1.5) -
      gaussian(time, 7.1, 0.14, 1.1) +
      (random() - 0.5) * 0.34
    );
  });
}

function writeCsv(fileName, headers, columns) {
  const rowCount = columns[0].length;
  const rows = [headers.join(",")];

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    rows.push(
      columns.map((column) => Number(column[rowIndex]).toFixed(6)).join(",")
    );
  }

  fs.writeFileSync(path.join(outputDir, fileName), rows.join("\n"));
}

function writeJson(fileName, payload) {
  fs.writeFileSync(path.join(outputDir, fileName), JSON.stringify(payload, null, 2));
}

fs.mkdirSync(outputDir, { recursive: true });

const ecgTimes = timeAxis(14, 240);
const emgTimes = timeAxis(11, 400);
const ppgTimes = timeAxis(18, 120);
const respTimes = timeAxis(20, 60);
const syntheticTimes = timeAxis(12, 120);

writeCsv("ecg_rest.csv", ["time", "lead_ii", "pulse_reference", "respiration_belt"], [
  ecgTimes,
  createEcgWave(ecgTimes, 68, 11),
  createPpgWave(ecgTimes, 68, 12),
  createRespiration(ecgTimes, 14, 13)
]);

writeCsv("ecg_motion.csv", ["time", "chest_lead", "accel_magnitude", "respiration"], [
  ecgTimes,
  createEcgWave(ecgTimes, 76, 21, 1),
  createMotionTrace(ecgTimes, 22),
  createRespiration(ecgTimes, 16, 23)
]);

writeCsv("emg_burst.csv", ["time", "flexor_channel", "force_proxy"], [
  emgTimes,
  createEmg(emgTimes, 31),
  emgTimes.map((time) => {
    const envelope =
      gaussian(time, 1.55, 0.3, 0.8) +
      gaussian(time, 3.85, 0.22, 0.68) +
      gaussian(time, 6.3, 0.36, 0.92) +
      gaussian(time, 8.85, 0.48, 1.1);
    return envelope + Math.sin(time * 0.8) * 0.02;
  })
]);

writeCsv("ppg_rest.csv", ["time", "optical_pulse", "respiration"], [
  ppgTimes,
  createPpgWave(ppgTimes, 63, 41),
  createRespiration(ppgTimes, 13, 42)
]);

writeCsv("respiration.csv", ["time", "thoracic_belt", "motion_drift"], [
  respTimes,
  createRespiration(respTimes, 11, 51),
  respTimes.map((time) => 0.3 * Math.sin(time * 0.45) + gaussian(time, 12, 1.8, 0.9))
]);

writeCsv("synthetic_noise.csv", ["time", "analog_channel_a", "analog_channel_b", "motion_proxy"], [
  syntheticTimes,
  createSynthetic(syntheticTimes, 61),
  createSynthetic(syntheticTimes, 62).map((value, index) => value * 0.72 + 0.2 * Math.sin(index / 8)),
  createMotionTrace(syntheticTimes, 63)
]);

writeJson("ppg_structured.json", {
  time: ppgTimes,
  channels: {
    optical_pulse: createPpgWave(ppgTimes, 63, 41),
    respiration: createRespiration(ppgTimes, 13, 42)
  }
});

console.log("Sample files generated in public/samples.");
