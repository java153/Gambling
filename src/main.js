import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { createInputController } from './controls.js';
import { createPlayer } from './player.js';
import { createMuseum } from './museum.js';
import { createArtPieces } from './artPieces.js';
import { createAudioEngine } from './audio.js';
import { setupLighting } from './lighting.js';

const app = document.getElementById('app');
const overlay = document.getElementById('overlay');
const overlayHint = document.getElementById('overlay-text');
window.__quietMuseumBooted = true;

const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(74, window.innerWidth / window.innerHeight, 0.1, 120);

const museum = createMuseum(scene);
const lighting = setupLighting(scene);
const audio = createAudioEngine(camera);
const artPieces = createArtPieces(scene, audio);

const input = createInputController(renderer.domElement);
const player = createPlayer(camera, audio, museum);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.4, 0.6, 0.88);
composer.addPass(bloom);
composer.addPass(new ShaderPass({
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0 },
    vignetteStrength: { value: 0.58 },
    grainStrength: { value: 0.028 },
  },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float time; uniform float vignetteStrength; uniform float grainStrength;
    varying vec2 vUv;
    float hash(vec2 p){return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453);}
    void main(){
      vec3 c = texture2D(tDiffuse, vUv).rgb;
      float d = distance(vUv, vec2(0.5));
      c *= smoothstep(0.9, vignetteStrength, d);
      float n = hash(vUv * (time * 60.0 + 2.0)) - 0.5;
      c += n * grainStrength;
      gl_FragColor = vec4(c, 1.0);
    }
  `,
}));

let last = performance.now();

async function startExperience() {
  overlayHint.textContent = 'Entering...';
  await audio.start();

  try {
    input.lock();
  } catch {
    // Safari sometimes rejects pointer lock requests when timing is off.
  }

  if (!document.pointerLockElement) {
    overlayHint.textContent = 'Click again to capture mouse';
  }
}

overlay.addEventListener('click', startExperience);
overlay.addEventListener('touchstart', startExperience, { passive: true });

document.addEventListener('pointerlockchange', () => {
  const locked = document.pointerLockElement === renderer.domElement;
  overlay.style.display = locked ? 'none' : 'flex';
  if (!locked) overlayHint.textContent = 'Click to Enter';
});

document.addEventListener('pointerlockerror', () => {
  overlay.style.display = 'flex';
  overlayHint.textContent = 'Pointer lock blocked. Click again, then move mouse inside window.';
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

function tick(now) {
  requestAnimationFrame(tick);
  const delta = Math.min((now - last) / 1000, 0.033);
  last = now;

  const look = input.consumeLook();
  const move = input.movementVector();

  player.update(delta, look, move);
  const t = now * 0.001;
  museum.update(t);
  artPieces.update(t, player.position, delta);
  lighting.update(t);
  audio.update(delta);

  const finalPass = composer.passes[composer.passes.length - 1];
  finalPass.uniforms.time.value = t;

  composer.render();
}

requestAnimationFrame(tick);
