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

  // 1 - Infinite Staircase Sculpture + orbiting ghost light orbs
  const stairGroup = new THREE.Group();
  stairGroup.position.set(-16, 0, -16);
  stairGroup.add(makePedestal());

  const stepMat = new THREE.MeshStandardMaterial({ color: 0x6e88cc, emissive: 0x0f1831, roughness: 0.4 });
  const stairs = [];
  for (let i = 0; i < 30; i++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.14, 0.5), stepMat);
    const a = (i / 30) * Math.PI * 2;
    step.position.set(Math.cos(a) * 1.25, 1 + i * 0.1, Math.sin(a) * 1.25);
    step.rotation.y = a;
    step.castShadow = true;
    stairs.push(step);
    stairGroup.add(step);
  }
  const orbGeo = new THREE.SphereGeometry(0.08, 8, 8);
  const orbMat = new THREE.MeshStandardMaterial({ color: 0xaed2ff, emissive: 0x5f87d8, emissiveIntensity: 1.2 });
  const orbs = [];
  for (let i = 0; i < 8; i++) {
    const orb = new THREE.Mesh(orbGeo, orbMat);
    stairGroup.add(orb);
    orbs.push(orb);
  }
  group.add(stairGroup);
  pieces.push({
    pos: stairGroup.position,
    update: (t) => {
      stairGroup.rotation.y = t * 0.17;
      stairs.forEach((s, i) => {
        s.position.y = 1 + i * 0.1 + Math.sin(t * 0.6 + i * 0.4) * 0.04;
      });
      orbs.forEach((orb, i) => {
        const a = t * 0.7 + i * 0.8;
        orb.position.set(Math.cos(a) * 1.8, 1.5 + Math.sin(t + i) * 0.45 + i * 0.06, Math.sin(a) * 1.8);
      });
    },
    triggerNear: () => audio.playChime(),
  });

  // 2 - Whispering Cubes with wave-mesh behavior.
  const cubeGroup = new THREE.Group();
  cubeGroup.position.set(16, 0, -16);
  cubeGroup.add(makePedestal());
  const cubeMat = new THREE.MeshStandardMaterial({ color: 0x9f7da8, emissive: 0x210b28, roughness: 0.48 });
  const cubes = [];
  for (let i = 0; i < 36; i++) {
    const c = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.35), cubeMat);
    const ring = i % 12;
    const row = Math.floor(i / 12);
    const angle = (ring / 12) * Math.PI * 2;
    c.position.set(Math.cos(angle) * (0.8 + row * 0.35), 1 + row * 0.35, Math.sin(angle) * (0.8 + row * 0.35));
    c.castShadow = true;
    cubes.push({ mesh: c, angle, row });
    cubeGroup.add(c);
  }
  group.add(cubeGroup);
  pieces.push({
    pos: cubeGroup.position,
    update: (t, playerPos) => {
      const dist = playerPos.distanceTo(cubeGroup.position);
      const proximity = THREE.MathUtils.clamp(1 - dist / 8, 0, 1);
      cubes.forEach((c, i) => {
        const radial = 1 + Math.sin(t * 1.3 + i * 0.25) * 0.08 * (0.3 + proximity);
        const pulse = Math.sin(t * 2.2 + i) * 0.04 * (0.2 + proximity);
        c.mesh.position.x = Math.cos(c.angle + t * 0.1) * (0.8 + c.row * 0.35) * radial;
        c.mesh.position.z = Math.sin(c.angle + t * 0.1) * (0.8 + c.row * 0.35) * radial;
        c.mesh.position.y = 1 + c.row * 0.35 + pulse;
      });
      cubeMat.emissiveIntensity = 0.2 + proximity * 0.8;
      if (dist < 7) audio.setWhisperGain(0.35 * (1 - dist / 7));
    },
  });

  // 3 - Gravity Painting: droplets rise + ribbon strokes.
  const paintGroup = new THREE.Group();
  paintGroup.position.set(-16, 0, 16);
  paintGroup.add(makePedestal());

  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 3.0, 0.2),
    new THREE.MeshStandardMaterial({ color: 0x2b2e4a, roughness: 0.6 }),
  );
  frame.position.set(0, 2.1, -1.2);
  paintGroup.add(frame);

  const dropletGeo = new THREE.SphereGeometry(0.08, 6, 6);
  const dropletMat = new THREE.MeshStandardMaterial({ color: 0x95cfff, emissive: 0x2f4b6a, emissiveIntensity: 0.6 });
  const droplets = [];
  for (let i = 0; i < 110; i++) {
    const d = new THREE.Mesh(dropletGeo, dropletMat);
    d.position.set((Math.random() - 0.5) * 1.8, 0.7 + Math.random() * 1.5, (Math.random() - 0.5) * 1.8);
    d.userData.speed = 0.002 + Math.random() * 0.003;
    droplets.push(d);
    paintGroup.add(d);
  }

  const ribbonMat = new THREE.MeshStandardMaterial({ color: 0x77baff, emissive: 0x204879, emissiveIntensity: 0.7 });
  const ribbons = [];
  for (let i = 0; i < 3; i++) {
    const ribbon = new THREE.Mesh(new THREE.TorusGeometry(0.9 + i * 0.22, 0.05, 8, 48), ribbonMat);
    ribbon.position.y = 1.4 + i * 0.55;
    ribbon.rotation.x = Math.PI / 2;
    ribbons.push(ribbon);
    paintGroup.add(ribbon);
  }

  group.add(paintGroup);
  pieces.push({
    pos: paintGroup.position,
    update: (t) => {
      droplets.forEach((d, i) => {
        d.position.y += d.userData.speed + Math.sin(t + i) * 0.0009;
        d.position.x += Math.sin(t * 0.6 + i) * 0.0006;
        if (d.position.y > 3.2) d.position.y = 0.8;
      });
      ribbons.forEach((r, i) => {
        r.rotation.z = t * (0.18 + i * 0.09);
        r.scale.setScalar(1 + Math.sin(t * 1.1 + i) * 0.04);
      });
    },
  });

  // 4 - Melting Statue with pooled wax and drips.
  const meltGroup = new THREE.Group();
  meltGroup.position.set(16, 0, 16);
  meltGroup.add(makePedestal());

  const statueMat = new THREE.MeshStandardMaterial({ color: 0xd8d6d2, roughness: 0.5, emissive: 0x16110e });
  const statue = new THREE.Mesh(new THREE.CapsuleGeometry(0.5, 1.8, 5, 10), statueMat);
  statue.position.y = 2.0;
  statue.castShadow = true;
  meltGroup.add(statue);

  const waxPool = new THREE.Mesh(
    new THREE.CylinderGeometry(0.9, 1.2, 0.08, 18),
    new THREE.MeshStandardMaterial({ color: 0xc3a67e, roughness: 0.7, emissive: 0x2a1b11, emissiveIntensity: 0.2 }),
  );
  waxPool.position.y = 0.5;
  waxPool.receiveShadow = true;
  meltGroup.add(waxPool);

  const drips = [];
  for (let i = 0; i < 34; i++) {
    const drip = new THREE.Mesh(new THREE.SphereGeometry(0.06 + Math.random() * 0.03, 6, 6), statueMat);
    drip.position.set((Math.random() - 0.5) * 0.9, 2.2 + Math.random() * 1.2, (Math.random() - 0.5) * 0.9);
    drips.push(drip);
    meltGroup.add(drip);
  }
  group.add(meltGroup);
  pieces.push({
    pos: meltGroup.position,
    update: (t) => {
      statue.scale.y = 1 - (Math.sin(t * 0.2) * 0.02 + 0.035);
      statue.position.y = 1.95 + Math.sin(t * 0.5) * 0.03;
      drips.forEach((d, i) => {
        d.position.y -= 0.004 + Math.sin(t * 2 + i) * 0.001;
        if (d.position.y < 0.85) d.position.y = 3.0;
      });
      waxPool.scale.set(1.0 + Math.sin(t * 0.4) * 0.04, 1, 1.0 + Math.cos(t * 0.4) * 0.04);
    },
  });

  // 5 - Impossible Geometry with layered false perspective beams.
  const penroseGroup = new THREE.Group();
  penroseGroup.position.set(0, 0, 22);
  penroseGroup.add(makePedestal());

  const beamMat = new THREE.MeshStandardMaterial({ color: 0xdec58b, emissive: 0x422d12, roughness: 0.35 });
  const beamGeo = new THREE.BoxGeometry(2.8, 0.35, 0.35);
  const b1 = new THREE.Mesh(beamGeo, beamMat);
  const b2 = new THREE.Mesh(beamGeo, beamMat);
  const b3 = new THREE.Mesh(beamGeo, beamMat);
  const b4 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.3, 0.3), beamMat);
  b1.position.set(0, 2, 0);
  b2.position.set(1.1, 2.8, -0.9); b2.rotation.y = Math.PI * 2 / 3;
  b3.position.set(-1.1, 1.2, -0.9); b3.rotation.y = -Math.PI * 2 / 3;
  b4.position.set(0, 2.05, -1.45); b4.rotation.y = Math.PI;

  [b1, b2, b3, b4].forEach((b) => { b.castShadow = true; penroseGroup.add(b); });

  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(1.9, 0.04, 8, 48),
    new THREE.MeshStandardMaterial({ color: 0xffdf9f, emissive: 0x9a6a2f, emissiveIntensity: 0.65 }),
  );
  halo.position.y = 2.1;
  halo.rotation.x = Math.PI / 2;
  penroseGroup.add(halo);

  group.add(penroseGroup);
  pieces.push({
    pos: penroseGroup.position,
    update: (t) => {
      penroseGroup.rotation.y = Math.sin(t * 0.21) * 0.9;
      beamMat.emissiveIntensity = 0.25 + Math.sin(t) * 0.12;
      halo.rotation.z = t * 0.32;
      halo.scale.setScalar(1 + Math.sin(t * 0.6) * 0.05);
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
          nearCooldown = 2.4;
          piece.triggerNear();
        }
      }
    },
  };
}
