/**
 * Synthesises the music bed and sound effects for the Airsc short, so the video has original,
 * licence-free audio. Run: pnpm video:music  → public/video/*.wav
 *
 * Structure follows the story (120 BPM, one beat = 0.5 s):
 *   0–3 s   hook      A minor drone + heartbeat, riser into the cut
 *   3–8 s   problem   four-on-the-floor in A minor, tension riser, drop
 *   8–26 s  solution  C major (relief): kick, clap, hats, bass, pad; arp from 14 s, lead from 21 s
 *   26–30 s call to action, resolves on C and fades so the loop restarts cleanly
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { BEATS, DURATION, FPS } from "../src/video/timeline";

const SR = 44100;
const BEAT = 0.5;
const TOTAL = DURATION / FPS;
const OUT = "public/video";

// ---------- helpers ----------
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = rng(20261008);
const noise = () => rand() * 2 - 1;
const buf = (s: number) => new Float32Array(Math.max(1, Math.floor(s * SR)));
const TAU = Math.PI * 2;

function lowpass(x: Float32Array, fc: number) {
  const a = 1 - Math.exp((-TAU * fc) / SR);
  let y = 0;
  for (let i = 0; i < x.length; i++) x[i] = y += a * (x[i] - y);
  return x;
}
function highpass(x: Float32Array, fc: number) {
  const a = 1 - Math.exp((-TAU * fc) / SR);
  let y = 0;
  for (let i = 0; i < x.length; i++) {
    y += a * (x[i] - y);
    x[i] -= y;
  }
  return x;
}
const saw = (ph: number) => 2 * (ph - Math.floor(ph + 0.5));

function place(dst: Float32Array, at: number, src: Float32Array, gain = 1) {
  const o = Math.floor(at * SR);
  for (let i = 0; i < src.length && o + i < dst.length; i++) if (o + i >= 0) dst[o + i] += src[i] * gain;
}

// ---------- instruments ----------
function kick(): Float32Array {
  const o = buf(0.42);
  let ph = 0;
  for (let i = 0; i < o.length; i++) {
    const t = i / SR;
    ph += (TAU * (42 + 125 * Math.exp(-t * 30))) / SR;
    o[i] = Math.sin(ph) * Math.exp(-t * 8) + (t < 0.004 ? noise() * 0.4 : 0);
  }
  return o;
}
function clap(): Float32Array {
  const o = buf(0.32);
  for (const off of [0, 0.011, 0.023, 0.036]) {
    for (let i = Math.floor(off * SR); i < o.length; i++) {
      const t = i / SR - off;
      o[i] += noise() * Math.exp(-t * (off === 0.036 ? 22 : 90));
    }
  }
  return lowpass(highpass(o, 900), 7000);
}
function hat(open: boolean): Float32Array {
  const o = buf(open ? 0.28 : 0.07);
  for (let i = 0; i < o.length; i++) o[i] = noise() * Math.exp((-i / SR) * (open ? 13 : 75));
  return highpass(o, 7500);
}
function bass(freq: number, dur: number): Float32Array {
  const o = buf(dur + 0.05);
  let p1 = 0;
  let p2 = 0;
  let y = 0;
  for (let i = 0; i < o.length; i++) {
    const t = i / SR;
    p1 += freq / SR;
    p2 += (freq * 1.006) / SR;
    const fc = 350 + 1400 * Math.exp(-t * 14);
    const a = 1 - Math.exp((-TAU * fc) / SR);
    y += a * ((saw(p1) + saw(p2)) * 0.5 - y);
    const env = Math.min(1, t / 0.006) * Math.min(1, Math.max(0, (dur - t) / 0.04 + 0.2));
    o[i] = (y * 0.9 + Math.sin(TAU * freq * t) * 0.6) * env;
  }
  return o;
}
function pluck(freq: number, dur = 0.45): Float32Array {
  const o = buf(dur);
  let p = 0;
  let y = 0;
  for (let i = 0; i < o.length; i++) {
    const t = i / SR;
    p += freq / SR;
    const fc = 600 + 4800 * Math.exp(-t * 14);
    const a = 1 - Math.exp((-TAU * fc) / SR);
    y += a * ((saw(p) * 0.6 + (p % 1 < 0.5 ? 0.4 : -0.4)) - y);
    o[i] = y * Math.exp(-t * 7.5) * Math.min(1, t / 0.003);
  }
  return o;
}
function pad(freqs: number[], dur: number): Float32Array {
  const o = buf(dur);
  const phases = freqs.flatMap((f) => [f * 0.994, f, f * 1.006].map((ff) => ({ ff, p: rand() })));
  for (let i = 0; i < o.length; i++) {
    const t = i / SR;
    let s = 0;
    for (const v of phases) {
      v.p += v.ff / SR;
      s += saw(v.p);
    }
    const env = Math.min(1, t / 0.35) * Math.min(1, (dur - t) / 0.5);
    o[i] = (s / phases.length) * env;
  }
  return lowpass(o, 1100);
}
function lead(freq: number, dur: number): Float32Array {
  const o = buf(dur);
  let p = 0;
  for (let i = 0; i < o.length; i++) {
    const t = i / SR;
    p += (freq * (1 + 0.006 * Math.sin(TAU * 5.5 * t) * Math.min(1, t / 0.4))) / SR;
    const tri = 2 * Math.abs(saw(p)) - 1;
    o[i] = (tri * 0.7 + Math.sin(TAU * p) * 0.4) * Math.min(1, t / 0.02) * Math.min(1, (dur - t) / 0.12) * 0.8;
  }
  return o;
}
function drone(freq: number, dur: number): Float32Array {
  const o = buf(dur);
  let p1 = 0;
  let p2 = 0;
  for (let i = 0; i < o.length; i++) {
    const t = i / SR;
    p1 += freq / SR;
    p2 += (freq * 1.004) / SR;
    o[i] = (saw(p1) + saw(p2)) * 0.5 * Math.min(1, t / 0.4);
  }
  // filter slowly opens
  let y = 0;
  for (let i = 0; i < o.length; i++) {
    const fc = 120 + 700 * (i / o.length) ** 2;
    const a = 1 - Math.exp((-TAU * fc) / SR);
    y += a * (o[i] - y);
    o[i] = y;
  }
  return o;
}
function riser(dur: number): Float32Array {
  const o = buf(dur);
  let y = 0;
  let ph = 0;
  for (let i = 0; i < o.length; i++) {
    const k = i / o.length;
    const fc = 400 + 9000 * k * k;
    const a = 1 - Math.exp((-TAU * fc) / SR);
    y += a * (noise() - y);
    ph += (TAU * (220 + 1500 * k * k)) / SR;
    o[i] = (y * 0.9 + Math.sin(ph) * 0.12) * k ** 1.6;
  }
  return o;
}
function impact(): Float32Array {
  const o = buf(2.2);
  let ph = 0;
  for (let i = 0; i < o.length; i++) {
    const t = i / SR;
    ph += (TAU * (30 + 45 * Math.exp(-t * 6))) / SR;
    o[i] = Math.sin(ph) * Math.exp(-t * 2.4) + noise() * Math.exp(-t * 10) * 0.8;
  }
  return lowpass(o, 1800);
}
function whoosh(dur = 0.7): Float32Array {
  const o = buf(dur);
  let y = 0;
  for (let i = 0; i < o.length; i++) {
    const k = i / o.length;
    const fc = 300 + 5200 * Math.sin(Math.PI * k) ** 1.4;
    const a = 1 - Math.exp((-TAU * fc) / SR);
    y += a * (noise() - y);
    o[i] = y * Math.sin(Math.PI * k) ** 1.6;
  }
  return highpass(o, 200);
}
function pop(): Float32Array {
  const o = buf(0.14);
  let ph = 0;
  for (let i = 0; i < o.length; i++) {
    const t = i / SR;
    ph += (TAU * (950 * Math.exp(-t * 22) + 380)) / SR;
    o[i] = Math.sin(ph) * Math.exp(-t * 32);
  }
  return o;
}
function ding(freq = 1318.5): Float32Array {
  const o = buf(0.7);
  for (let i = 0; i < o.length; i++) {
    const t = i / SR;
    o[i] = (Math.sin(TAU * freq * t) + 0.35 * Math.sin(TAU * freq * 2.76 * t)) * Math.exp(-t * 7) * Math.min(1, t / 0.002);
  }
  return o;
}
function success(): Float32Array {
  const o = buf(1.1);
  [783.99, 987.77, 1318.5].forEach((f, i) => place(o, i * 0.075, ding(f), 0.7));
  return o;
}
function typing(dur: number): Float32Array {
  const o = buf(dur);
  let t = 0.02;
  while (t < dur - 0.03) {
    const click = buf(0.025);
    const f = 1800 + rand() * 2200;
    for (let i = 0; i < click.length; i++) {
      const tt = i / SR;
      click[i] = (noise() * 0.6 + Math.sin(TAU * f * tt) * 0.5) * Math.exp(-tt * 240);
    }
    place(o, t, highpass(click, 900), 0.5 + rand() * 0.5);
    t += 0.045 + rand() * 0.04;
  }
  return o;
}
function glitch(): Float32Array {
  const o = buf(0.55);
  let t = 0;
  while (t < 0.5) {
    const seg = 0.018 + rand() * 0.05;
    const f = 200 + rand() * 2600;
    const n = Math.floor(seg * SR);
    const g = rand() > 0.5;
    for (let i = 0; i < n && Math.floor(t * SR) + i < o.length; i++) {
      const v = g ? Math.sign(Math.sin(TAU * f * (i / SR))) : noise();
      o[Math.floor(t * SR) + i] = v * 0.6 * (1 - t);
    }
    t += seg + (rand() > 0.6 ? 0.03 : 0);
  }
  return o;
}

// ---------- arrangement ----------
type Chord = { name: string; bass: number; notes: number[] };
const C_: Chord = { name: "C", bass: 65.41, notes: [261.63, 329.63, 392.0, 523.25] };
const G_: Chord = { name: "G", bass: 49.0 * 2, notes: [196.0, 246.94, 293.66, 392.0] };
const AM: Chord = { name: "Am", bass: 55.0 * 2, notes: [220.0, 261.63, 329.63, 440.0] };
const F_: Chord = { name: "F", bass: 43.65 * 2, notes: [174.61, 220.0, 261.63, 349.23] };
const PROG = [C_, G_, AM, F_];
const chordAt = (t: number): Chord => {
  if (t >= 28) return C_;
  if (t >= 26) return F_;
  return PROG[Math.floor((t - 8) / 2) % 4];
};

function renderBed(): Float32Array {
  const mix = buf(TOTAL);
  const kicks = buf(TOTAL);
  const sidechained = buf(TOTAL); // bass, pad, arp: ducked by the kick
  const top = buf(TOTAL); // drums, lead, fx
  const t3 = BEATS.problem / FPS;
  const t8 = BEATS.solution / FPS;
  const t14 = BEATS.preview / FPS;
  const t21 = BEATS.mcp / FPS;
  const t26 = BEATS.cta / FPS;

  // 0–3 s: drone + heartbeat + building ticks
  place(sidechained, 0, drone(55, t3 + 0.1), 0.55);
  for (const t of [0.0, 1.0, 2.0, 2.5]) place(kicks, t, lowpass(kick(), 160), 0.45);
  for (let t = 1.5; t < t3 - 0.01; t += BEAT / 2) place(top, t, hat(false), 0.14 + (t - 1.5) * 0.06);
  place(top, t3 - 0.7, riser(0.7), 0.5);

  // 3–8 s: A minor, four on the floor
  const am = [55.0 * 2, 55.0 * 2, 65.41 * 2, 55.0 * 2, 43.65 * 2, 43.65 * 2, 49.0 * 2, 49.0 * 2];
  for (let b = t3 / BEAT; b < t8 / BEAT; b++) {
    const t = b * BEAT;
    place(kicks, t, kick(), 0.95);
    place(top, t + BEAT / 2, hat(true), 0.2);
    if ((b - t3 / BEAT) % 2 === 1) place(top, t, clap(), 0.35);
    const step = Math.floor((t - t3) / BEAT) % am.length;
    place(sidechained, t, bass(am[step], BEAT * 0.9), 0.5);
    place(sidechained, t + BEAT / 2, bass(am[step], BEAT * 0.4), 0.35);
  }
  // riser + snare roll into the drop
  place(top, t8 - 1.0, riser(1.0), 0.6);
  for (let t = t8 - 1.0, step = 0.125; t < t8 - 0.05; t += step, step = Math.max(0.03, step * 0.9)) place(top, t, clap(), 0.2 + (t - (t8 - 1)) * 0.35);

  // 8–26 s: C major
  for (let b = Math.round(t8 / BEAT); b < Math.round(t26 / BEAT); b++) {
    const t = b * BEAT;
    const ch = chordAt(t);
    place(kicks, t, kick(), 1);
    if (b % 2 === 1) place(top, t, clap(), 0.5);
    place(top, t + BEAT / 2, hat(false), 0.2);
    place(top, t, hat(false), 0.1);
    place(sidechained, t, bass(ch.bass, BEAT * 0.5), 0.7);
    place(sidechained, t + BEAT / 2, bass(ch.bass, BEAT * 0.4), 0.5);
    if (Math.abs((t - t8) % 2) < 1e-6) place(sidechained, t, pad(ch.notes.slice(0, 3), 2.05), 0.5);
    if (t >= t14) {
      const pat = [0, 1, 2, 3, 2, 1, 2, 3];
      for (let s = 0; s < 2; s++) {
        const note = ch.notes[pat[(b * 2 + s) % pat.length]];
        place(sidechained, t + (s * BEAT) / 2, pluck(note * (s ? 2 : 1), 0.38), 0.34);
      }
    }
    if (t >= t21 && b % 2 === 0) {
      const mel = [ch.notes[2] * 2, ch.notes[3], ch.notes[1] * 2, ch.notes[2] * 2];
      place(top, t, lead(mel[Math.floor((t - t21) / BEAT / 2) % 4], BEAT * 1.6), 0.28);
    }
  }
  place(top, t8, impact(), 0.55);
  place(top, t8 - 0.02, whoosh(0.5), 0.35);

  // 26–30 s: final chords, resolve on C, ring out
  place(sidechained, t26, pad(F_.notes.slice(0, 3), 2.2), 0.55);
  place(sidechained, t26 + 2, pad(C_.notes, 2.0), 0.7);
  for (let b = 0; b < 4; b++) {
    place(kicks, t26 + b * BEAT, kick(), 0.8 - b * 0.12);
    if (b % 2 === 1) place(top, t26 + b * BEAT, clap(), 0.4);
    place(top, t26 + b * BEAT + BEAT / 2, hat(false), 0.16);
    place(sidechained, t26 + b * BEAT, bass(F_.bass, BEAT * 0.5), 0.6);
  }
  place(sidechained, t26 + 2, bass(C_.bass, 1.2), 0.6);
  place(kicks, t26 + 2, kick(), 0.5);
  place(top, t26 + 2, ding(1046.5), 0.5);
  place(top, t26 + 2, ding(1318.5), 0.35);

  // sidechain: duck the harmonic layer on every kick
  const duck = new Float32Array(sidechained.length).fill(1);
  const kickTimes: number[] = [];
  for (let b = Math.round(t3 / BEAT); b < Math.round(t26 / BEAT) + 2; b++) kickTimes.push(b * BEAT);
  for (const kt of kickTimes) {
    const s = Math.floor(kt * SR);
    for (let i = 0; i < 0.22 * SR && s + i < duck.length; i++) duck[s + i] = Math.min(duck[s + i], 1 - 0.65 * Math.exp((-i / SR) / 0.07));
  }
  for (let i = 0; i < mix.length; i++) mix[i] = sidechained[i] * duck[i] + kicks[i] + top[i];

  // master: soft clip, fade the very end so the loop restarts cleanly
  let peak = 0;
  for (let i = 0; i < mix.length; i++) {
    mix[i] = Math.tanh(mix[i] * 1.25) / Math.tanh(1.25);
    peak = Math.max(peak, Math.abs(mix[i]));
  }
  const fadeIn = 0.04 * SR;
  const fadeOut = 0.5 * SR;
  for (let i = 0; i < mix.length; i++) {
    const g = Math.min(1, i / fadeIn) * Math.min(1, (mix.length - i) / fadeOut);
    mix[i] = (mix[i] / peak) * 0.85 * g;
  }
  return mix;
}

// ---------- output ----------
function writeWav(name: string, data: Float32Array, gain = 1) {
  let peak = 0;
  for (const v of data) peak = Math.max(peak, Math.abs(v));
  const norm = peak > 0 ? Math.min(1, 0.9 / peak) * gain : 1;
  const pcm = Buffer.alloc(44 + data.length * 2);
  pcm.write("RIFF", 0);
  pcm.writeUInt32LE(36 + data.length * 2, 4);
  pcm.write("WAVEfmt ", 8);
  pcm.writeUInt32LE(16, 16);
  pcm.writeUInt16LE(1, 20);
  pcm.writeUInt16LE(1, 22);
  pcm.writeUInt32LE(SR, 24);
  pcm.writeUInt32LE(SR * 2, 28);
  pcm.writeUInt16LE(2, 32);
  pcm.writeUInt16LE(16, 34);
  pcm.write("data", 36);
  pcm.writeUInt32LE(data.length * 2, 40);
  for (let i = 0; i < data.length; i++) pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, data[i] * norm)) * 32767), 44 + i * 2);
  writeFileSync(`${OUT}/${name}.wav`, pcm);
  console.log(`${name}.wav  ${(pcm.length / 1024).toFixed(0)} KB  ${(data.length / SR).toFixed(2)} s`);
}

mkdirSync(OUT, { recursive: true });
writeWav("beat", renderBed());
writeWav("impact", impact());
writeWav("whoosh", whoosh(0.7));
writeWav("pop", pop());
writeWav("ding", ding());
writeWav("success", success());
writeWav("typing", typing(3));
writeWav("glitch", glitch());
