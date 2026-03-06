import * as THREE from 'three';

const CHORDS = [
  [261.63, 329.63, 392.0],   // C
  [220.0, 261.63, 329.63],   // Am
  [174.61, 220.0, 261.63],   // F
  [196.0, 246.94, 293.66],   // G
];

export function createAudioEngine(camera) {
  const listener = new THREE.AudioListener();
  camera.add(listener);

  const ctx = listener.context;
  const master = ctx.createGain();
  master.gain.value = 0.34;
  master.connect(ctx.destination);

  const musicBus = ctx.createGain();
  musicBus.gain.value = 0;
  musicBus.connect(master);

  const fxBus = ctx.createGain();
  fxBus.gain.value = 0.9;
  fxBus.connect(master);

  const whisperGain = ctx.createGain();
  whisperGain.gain.value = 0;
  whisperGain.connect(fxBus);

  const reverb = ctx.createConvolver();
  reverb.buffer = makeImpulse(ctx, 3.4);

  const reverbSend = ctx.createGain();
  reverbSend.gain.value = 0.35;
  reverbSend.connect(reverb);
  reverb.connect(master);

  const lowCut = ctx.createBiquadFilter();
  lowCut.type = 'highpass';
  lowCut.frequency.value = 60;
  lowCut.connect(musicBus);

  const pads = createPadLayers(ctx, lowCut, reverbSend);
  const drone = createDrone(ctx, lowCut);
  const whisper = createWhisperTexture(ctx, whisperGain);

  let started = false;
  let t = 0;
  let beatClock = 0;
  let chordIndex = 0;
  let beatIndex = 0;

  const tempo = 58; // slow ambient pulse
  const beatDuration = 60 / tempo;

  return {
    async start() {
      if (started) return;
      await ctx.resume();
      started = true;
      musicBus.gain.setTargetAtTime(0.55, ctx.currentTime, 4.5);
      drone.gain.setTargetAtTime(0.07, ctx.currentTime, 6.0);
    },

    update(delta) {
      if (!started) return;
      t += delta;
      beatClock += delta;

      pads.update(t, CHORDS[chordIndex]);
      whisper.update(t);
      drone.filter.frequency.value = 130 + Math.sin(t * 0.09) * 20;

      if (beatClock >= beatDuration) {
        beatClock -= beatDuration;
        stepMusic(chordIndex, beatIndex, ctx, musicBus, reverbSend);
        beatIndex += 1;
        if (beatIndex >= 8) {
          beatIndex = 0;
          chordIndex = (chordIndex + 1) % CHORDS.length;
        }
      }
    },

    setWhisperGain(v) {
      whisperGain.gain.setTargetAtTime(v, ctx.currentTime, 0.28);
      whisper.filter.frequency.value = 260 + v * 1600;
    },

    playFootstep() {
      if (!started) return;
      click(ctx, fxBus, 130 + Math.random() * 40, 0.04, 0.02);
    },

    playChime() {
      if (!started) return;
      const note = CHORDS[chordIndex][Math.floor(Math.random() * 3)] * (2 + Math.random() * 0.05);
      bell(ctx, musicBus, reverbSend, note, 2.4, 0.06);
    },

    playDistantPiano() {
      if (!started) return;
      const chord = CHORDS[chordIndex];
      const note = chord[Math.floor(Math.random() * chord.length)] * 0.5;
      pianoNote(ctx, musicBus, reverbSend, note, 2.8, 0.05);
    },
  };
}

function createPadLayers(ctx, destination, reverbSend) {
  const layers = [
    makePad(ctx, 110, -6, 0.03, destination, reverbSend),
    makePad(ctx, 165, 3, 0.02, destination, reverbSend),
    makePad(ctx, 246.94, -2, 0.011, destination, reverbSend),
  ];

  return {
    update(t, chord) {
      layers.forEach((layer, i) => {
        const target = chord[i % chord.length] * (i === 2 ? 0.5 : 0.25);
        layer.osc.frequency.value = target + Math.sin(t * (0.03 + i * 0.02)) * 0.9;
        layer.filter.frequency.value = 520 + Math.sin(t * 0.1 + i) * 190;
      });
    },
  };
}

function createDrone(ctx, destination) {
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.value = 55;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 120;

  const gain = ctx.createGain();
  gain.gain.value = 0;

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(destination);
  osc.start();

  return { osc, filter, gain };
}

function createWhisperTexture(ctx, destination) {
  const src = ctx.createBufferSource();
  src.buffer = makeNoiseBuffer(ctx, 2);
  src.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 500;

  src.connect(filter);
  filter.connect(destination);
  src.start();

  return {
    filter,
    update(t) {
      filter.Q.value = 0.8 + Math.sin(t * 0.2) * 0.25;
    },
  };
}

function makePad(ctx, baseFreq, detune, gainLevel, destination, reverbSend) {
  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.value = baseFreq;
  osc.detune.value = detune;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 700;

  const gain = ctx.createGain();
  gain.gain.value = gainLevel;

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(destination);
  gain.connect(reverbSend);
  osc.start();

  return { osc, filter, gain };
}

function stepMusic(chordIndex, beatIndex, ctx, destination, reverbSend) {
  const chord = CHORDS[chordIndex];
  if (beatIndex % 4 === 0) {
    const bass = chord[0] * 0.25;
    tone(ctx, destination, bass, 0.8, 'sine', 0.03);
  }

  // Sparse piano motif with occasional interval harmonics.
  if (beatIndex === 1 || beatIndex === 5 || (beatIndex === 7 && Math.random() > 0.4)) {
    const note = chord[Math.floor(Math.random() * chord.length)] * (Math.random() > 0.6 ? 1 : 0.5);
    pianoNote(ctx, destination, reverbSend, note, 2.2, 0.04);

    if (Math.random() > 0.66) {
      pianoNote(ctx, destination, reverbSend, note * 1.5, 1.6, 0.02);
    }
  }

  // Reversed-ish ghost texture by sweeping noise envelope.
  if (beatIndex === 3 || beatIndex === 6) {
    reverseTexture(ctx, destination, reverbSend, 1.2, 0.02);
  }
}

function pianoNote(ctx, destination, reverbSend, frequency, duration, gain) {
  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.value = frequency;

  const attack = ctx.createGain();
  attack.gain.value = 0;

  const body = ctx.createBiquadFilter();
  body.type = 'lowpass';
  body.frequency.value = 1400;

  osc.connect(body);
  body.connect(attack);
  attack.connect(destination);
  attack.connect(reverbSend);

  const now = ctx.currentTime;
  attack.gain.linearRampToValueAtTime(gain, now + 0.03);
  attack.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.start(now);
  osc.stop(now + duration + 0.05);
}

function bell(ctx, destination, reverbSend, frequency, duration, gain) {
  const fundamental = ctx.createOscillator();
  fundamental.type = 'sine';
  fundamental.frequency.value = frequency;

  const overtone = ctx.createOscillator();
  overtone.type = 'sine';
  overtone.frequency.value = frequency * 2.01;

  const mix = ctx.createGain();
  mix.gain.value = 0;

  fundamental.connect(mix);
  overtone.connect(mix);
  mix.connect(destination);
  mix.connect(reverbSend);

  const now = ctx.currentTime;
  mix.gain.linearRampToValueAtTime(gain, now + 0.01);
  mix.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  fundamental.start();
  overtone.start();
  fundamental.stop(now + duration + 0.05);
  overtone.stop(now + duration + 0.05);
}

function reverseTexture(ctx, destination, reverbSend, duration, gain) {
  const source = ctx.createBufferSource();
  source.buffer = makeNoiseBuffer(ctx, 1.5);

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 900;

  const amp = ctx.createGain();
  amp.gain.value = 0.0001;

  source.connect(filter);
  filter.connect(amp);
  amp.connect(destination);
  amp.connect(reverbSend);

  const now = ctx.currentTime;
  amp.gain.exponentialRampToValueAtTime(gain, now + duration * 0.8);
  amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  filter.frequency.linearRampToValueAtTime(200, now + duration);

  source.start(now);
  source.stop(now + duration + 0.02);
}

function tone(ctx, destination, frequency, duration, type, gain) {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.value = frequency;

  const g = ctx.createGain();
  g.gain.value = 0;

  o.connect(g);
  g.connect(destination);

  const now = ctx.currentTime;
  g.gain.linearRampToValueAtTime(gain, now + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  o.start();
  o.stop(now + duration + 0.04);
}

function click(ctx, destination, frequency, duration, gain) {
  const o = ctx.createOscillator();
  o.type = 'square';
  o.frequency.value = frequency;

  const g = ctx.createGain();
  g.gain.value = gain;

  o.connect(g);
  g.connect(destination);

  const now = ctx.currentTime;
  g.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  o.start();
  o.stop(now + duration);
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
    for (let i = 0; i < length; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.5);
    }
  }
  return impulse;
}
