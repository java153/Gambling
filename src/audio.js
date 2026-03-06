import * as THREE from 'three';

export function createAudioEngine(camera) {
  const listener = new THREE.AudioListener();
  camera.add(listener);

  const ctx = listener.context;
  const master = ctx.createGain();
  master.gain.value = 0.35;
  master.connect(ctx.destination);

  const ambience = ctx.createGain(); ambience.gain.value = 0;
  ambience.connect(master);

  const whisperGain = ctx.createGain(); whisperGain.gain.value = 0;
  whisperGain.connect(master);

  const verb = ctx.createConvolver();
  verb.buffer = makeImpulse(ctx, 2.6);
  const verbMix = ctx.createGain(); verbMix.gain.value = 0.3;
  ambience.connect(verb); verb.connect(verbMix); verbMix.connect(master);

  const layers = [];
  function makePad(freq, detune, gain) {
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    osc.detune.value = detune;
    const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 700;
    const g = ctx.createGain(); g.gain.value = gain;
    osc.connect(filter); filter.connect(g); g.connect(ambience);
    osc.start();
    layers.push({ osc, filter, baseFreq: freq });
  }

  makePad(92.5, -8, 0.025);
  makePad(138.6, 4, 0.018);
  makePad(220, -2, 0.008);

  const whisperNoise = ctx.createBufferSource();
  whisperNoise.buffer = makeNoiseBuffer(ctx, 2);
  whisperNoise.loop = true;
  const whisperFilter = ctx.createBiquadFilter(); whisperFilter.type = 'bandpass'; whisperFilter.frequency.value = 500;
  whisperNoise.connect(whisperFilter); whisperFilter.connect(whisperGain);
  whisperNoise.start();

  let started = false;
  let t = 0;

  return {
    async start() {
      if (started) return;
      await ctx.resume();
      started = true;
      ambience.gain.setTargetAtTime(0.45, ctx.currentTime, 4);
    },
    update(delta) {
      if (!started) return;
      t += delta;
      layers.forEach((l, i) => {
        l.filter.frequency.value = 500 + Math.sin(t * 0.1 + i) * 130;
        l.osc.frequency.value = l.baseFreq + Math.sin(t * 0.05 + i * 2) * 1.5;
      });
    },
    setWhisperGain(v) {
      whisperGain.gain.setTargetAtTime(v, ctx.currentTime, 0.4);
      whisperFilter.frequency.value = 320 + v * 1400;
    },
    playFootstep() {
      if (!started) return;
      click(ctx, master, 160, 0.02, 0.03);
    },
    playChime() {
      if (!started) return;
      tone(ctx, master, 880 + Math.random() * 100, 0.32, 'sine', 0.08);
    },
    playDistantPiano() {
      if (!started) return;
      tone(ctx, master, [261.63, 329.63, 392][Math.floor(Math.random() * 3)] * 0.5, 1.8, 'triangle', 0.04);
    },
  };
}

function tone(ctx, destination, frequency, duration, type, gain) {
  const o = ctx.createOscillator(); o.type = type; o.frequency.value = frequency;
  const g = ctx.createGain(); g.gain.value = 0;
  o.connect(g); g.connect(destination);
  const now = ctx.currentTime;
  g.gain.linearRampToValueAtTime(gain, now + 0.05);
  g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  o.start(); o.stop(now + duration + 0.05);
}

function click(ctx, destination, frequency, duration, gain) {
  const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = frequency;
  const g = ctx.createGain(); g.gain.value = gain;
  o.connect(g); g.connect(destination);
  const now = ctx.currentTime;
  g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  o.start(); o.stop(now + duration);
}

function makeNoiseBuffer(ctx, seconds) {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const d = buffer.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.2;
  return buffer;
}

function makeImpulse(ctx, seconds) {
  const length = ctx.sampleRate * seconds;
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = impulse.getChannelData(c);
    for (let i = 0; i < length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.5);
  }
  return impulse;
}
