import * as THREE from 'three';

function makePedestal() {
  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(1, 1.1, 0.9, 10),
    new THREE.MeshStandardMaterial({ color: 0x9da2b8, roughness: 0.35 }),
  );
  pedestal.castShadow = true;
  pedestal.receiveShadow = true;
  return pedestal;
}

export function createArtPieces(scene, audio) {
  const group = new THREE.Group();
  scene.add(group);

  const pieces = [];

  // 1 - Infinite Staircase
  const stairGroup = new THREE.Group();
  stairGroup.position.set(-16, 0, -16);
  stairGroup.add(makePedestal());
  const stepMat = new THREE.MeshStandardMaterial({ color: 0x6e88cc, emissive: 0x0f1831, roughness: 0.4 });
  for (let i = 0; i < 24; i++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.14, 0.5), stepMat);
    const a = (i / 24) * Math.PI * 2;
    step.position.set(Math.cos(a) * 1.2, 1 + i * 0.1, Math.sin(a) * 1.2);
    step.rotation.y = a;
    step.castShadow = true;
    stairGroup.add(step);
  }
  group.add(stairGroup);
  pieces.push({
    pos: stairGroup.position,
    update: (t) => { stairGroup.rotation.y = t * 0.16; },
    triggerNear: () => audio.playChime(),
  });

  // 2 - Whispering Cubes
  const cubeGroup = new THREE.Group();
  cubeGroup.position.set(16, 0, -16);
  cubeGroup.add(makePedestal());
  const cubeMat = new THREE.MeshStandardMaterial({ color: 0x9f7da8, emissive: 0x210b28, roughness: 0.48 });
  const cubes = [];
  for (let i = 0; i < 20; i++) {
    const c = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.45), cubeMat);
    c.position.set((Math.random() - 0.5) * 2, 1 + Math.random() * 2.3, (Math.random() - 0.5) * 2);
    c.castShadow = true;
    cubes.push(c);
    cubeGroup.add(c);
  }
  group.add(cubeGroup);
  pieces.push({
    pos: cubeGroup.position,
    update: (t, playerPos) => {
      const dist = playerPos.distanceTo(cubeGroup.position);
      const amp = THREE.MathUtils.clamp(1 - dist / 8, 0, 1) * 0.25;
      cubes.forEach((c, i) => { c.position.y += Math.sin(t * 1.2 + i) * amp * 0.01; });
      if (dist < 6) audio.setWhisperGain(0.27 * (1 - dist / 6));
    },
  });

  // 3 - Gravity Painting
  const paintGroup = new THREE.Group();
  paintGroup.position.set(-16, 0, 16);
  paintGroup.add(makePedestal());
  const dropletGeo = new THREE.SphereGeometry(0.08, 6, 6);
  const dropletMat = new THREE.MeshStandardMaterial({ color: 0x95cfff, emissive: 0x2f4b6a, emissiveIntensity: 0.5 });
  const droplets = [];
  for (let i = 0; i < 80; i++) {
    const d = new THREE.Mesh(dropletGeo, dropletMat);
    d.position.set((Math.random() - 0.5) * 1.8, 0.7 + Math.random() * 1.5, (Math.random() - 0.5) * 1.8);
    droplets.push(d);
    paintGroup.add(d);
  }
  group.add(paintGroup);
  pieces.push({
    pos: paintGroup.position,
    update: (t) => {
      droplets.forEach((d, i) => {
        d.position.y += 0.003 + Math.sin(t + i) * 0.0009;
        if (d.position.y > 3.2) d.position.y = 0.8;
      });
    },
  });

  // 4 - Melting Statue
  const meltGroup = new THREE.Group();
  meltGroup.position.set(16, 0, 16);
  meltGroup.add(makePedestal());
  const statue = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.5, 1.8, 5, 10),
    new THREE.MeshStandardMaterial({ color: 0xc4c7d3, roughness: 0.5 }),
  );
  statue.position.y = 2.0;
  statue.castShadow = true;
  meltGroup.add(statue);
  const drips = [];
  for (let i = 0; i < 20; i++) {
    const drip = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 6), statue.material);
    drip.position.set((Math.random() - 0.5) * 0.8, 2.2 + Math.random() * 1.2, (Math.random() - 0.5) * 0.8);
    drips.push(drip);
    meltGroup.add(drip);
  }
  group.add(meltGroup);
  pieces.push({
    pos: meltGroup.position,
    update: (t) => {
      statue.scale.y = 1 - (Math.sin(t * 0.2) * 0.02 + 0.03);
      drips.forEach((d, i) => {
        d.position.y -= 0.005 + Math.sin(t * 2 + i) * 0.001;
        if (d.position.y < 1.0) d.position.y = 3.0;
      });
    },
  });

  // 5 - Impossible Geometry (stylized Penrose)
  const penroseGroup = new THREE.Group();
  penroseGroup.position.set(0, 0, 22);
  penroseGroup.add(makePedestal());
  const beamMat = new THREE.MeshStandardMaterial({ color: 0xdec58b, emissive: 0x422d12, roughness: 0.35 });
  const beamGeo = new THREE.BoxGeometry(2.8, 0.35, 0.35);
  const b1 = new THREE.Mesh(beamGeo, beamMat);
  const b2 = new THREE.Mesh(beamGeo, beamMat);
  const b3 = new THREE.Mesh(beamGeo, beamMat);
  b1.position.set(0, 2, 0);
  b2.position.set(1.1, 2.8, -0.9); b2.rotation.y = Math.PI * 2 / 3;
  b3.position.set(-1.1, 1.2, -0.9); b3.rotation.y = -Math.PI * 2 / 3;
  [b1, b2, b3].forEach((b) => { b.castShadow = true; penroseGroup.add(b); });
  group.add(penroseGroup);
  pieces.push({
    pos: penroseGroup.position,
    update: (t) => {
      penroseGroup.rotation.y = Math.sin(t * 0.21) * 0.9;
      beamMat.emissiveIntensity = 0.2 + Math.sin(t) * 0.1;
    },
  });

  let nearCooldown = 0;

  return {
    update(t, playerPos, delta) {
      nearCooldown -= delta;
      audio.setWhisperGain(0);
      for (const piece of pieces) {
        piece.update(t, playerPos);
        const d = playerPos.distanceTo(piece.pos);
        if (piece.triggerNear && d < 4 && nearCooldown <= 0) {
          nearCooldown = 2.5;
          piece.triggerNear();
        }
      }
    },
  };
}
