const fs = require("fs");
const path = require("path");

const SAMPLE_RATE = 22050;

function createWav(fileName, notes) {
  const samples = [];

  for (const note of notes) {
    const count = Math.floor(note.duration * SAMPLE_RATE);
    for (let index = 0; index < count; index++) {
      const time = index / SAMPLE_RATE;
      const attack = Math.min(1, index / (SAMPLE_RATE * 0.02));
      const release = Math.min(1, (count - index) / (SAMPLE_RATE * 0.08));
      const envelope = attack * release;
      const value = note.frequency
        ? Math.sin(2 * Math.PI * note.frequency * time) * note.volume * envelope
        : 0;
      samples.push(Math.round(Math.max(-1, Math.min(1, value)) * 32767));
    }
  }

  const dataSize = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  samples.forEach((sample, index) => buffer.writeInt16LE(sample, 44 + index * 2));
  fs.writeFileSync(fileName, buffer);
}

const outputDir = path.resolve(__dirname, "../android/app/src/main/res/raw");
fs.mkdirSync(outputDir, { recursive: true });

createWav(path.join(outputDir, "remedin_pre_alert.wav"), [
  { frequency: 659.25, duration: 0.16, volume: 0.25 },
  { frequency: 0, duration: 0.06, volume: 0 },
  { frequency: 783.99, duration: 0.22, volume: 0.2 },
]);

createWav(path.join(outputDir, "remedin_alarm.wav"), [
  { frequency: 523.25, duration: 0.28, volume: 0.38 },
  { frequency: 659.25, duration: 0.28, volume: 0.38 },
  { frequency: 783.99, duration: 0.38, volume: 0.42 },
  { frequency: 0, duration: 0.12, volume: 0 },
]);
