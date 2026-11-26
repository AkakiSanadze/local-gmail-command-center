/**
 * Pure Web Audio API two-tone notification chime synthesizer (D5 587.33Hz -> A5 880Hz).
 */

let audioCtx = null;

function getAudioContext(AudioContextCtor) {
  if (!audioCtx && AudioContextCtor) {
    audioCtx = new AudioContextCtor();
  }
  return audioCtx;
}

/**
 * Resets cached AudioContext singleton (intended for unit tests).
 */
export function resetAudioContextForTesting() {
  audioCtx = null;
}

/**
 * Synthesizes a clean two-tone bell chime with gentle harmonics and exponential decay.
 */
export async function playChime(
  AudioContextCtor = globalThis.AudioContext || globalThis.webkitAudioContext
) {
  const ctx = getAudioContext(AudioContextCtor);
  if (!ctx) return;

  if (ctx.state === 'suspended' && typeof ctx.resume === 'function') {
    await ctx.resume();
  }

  const now = ctx.currentTime;

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.85, now);
  masterGain.connect(ctx.destination);

  // Tone 1: 587.33 Hz (D5)
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(587.33, now);

  const osc1Overtone = ctx.createOscillator();
  const gain1Overtone = ctx.createGain();
  osc1Overtone.type = 'triangle';
  osc1Overtone.frequency.setValueAtTime(587.33 * 2, now);

  gain1.gain.setValueAtTime(0.0001, now);
  gain1.gain.exponentialRampToValueAtTime(0.4, now + 0.02);
  gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

  gain1Overtone.gain.setValueAtTime(0.0001, now);
  gain1Overtone.gain.exponentialRampToValueAtTime(0.08, now + 0.02);
  gain1Overtone.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

  osc1.connect(gain1);
  gain1.connect(masterGain);
  osc1Overtone.connect(gain1Overtone);
  gain1Overtone.connect(masterGain);

  osc1.start(now);
  osc1.stop(now + 0.5);
  osc1Overtone.start(now);
  osc1Overtone.stop(now + 0.4);

  // Tone 2: 880.00 Hz (A5)
  const tone2Start = now + 0.11;
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(880.0, tone2Start);

  const osc2Overtone = ctx.createOscillator();
  const gain2Overtone = ctx.createGain();
  osc2Overtone.type = 'triangle';
  osc2Overtone.frequency.setValueAtTime(880.0 * 2, tone2Start);

  gain2.gain.setValueAtTime(0.0001, tone2Start);
  gain2.gain.exponentialRampToValueAtTime(0.45, tone2Start + 0.02);
  gain2.gain.exponentialRampToValueAtTime(0.0001, tone2Start + 0.85);

  gain2Overtone.gain.setValueAtTime(0.0001, tone2Start);
  gain2Overtone.gain.exponentialRampToValueAtTime(0.07, tone2Start + 0.02);
  gain2Overtone.gain.exponentialRampToValueAtTime(0.0001, tone2Start + 0.6);

  osc2.connect(gain2);
  gain2.connect(masterGain);
  osc2Overtone.connect(gain2Overtone);
  gain2Overtone.connect(masterGain);

  osc2.start(tone2Start);
  osc2.stop(tone2Start + 0.9);
  osc2Overtone.start(tone2Start);
  osc2Overtone.stop(tone2Start + 0.7);
}
