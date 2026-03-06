import * as THREE from 'three';

const FLOOR_SIZE = 62;

export function createMuseum(scene) {
  const root = new THREE.Group();
  scene.add(root);

  const collisionBoxes = [];
  const breathingPaintings = [];
  const colorShiftPanels = [];

  const floorMat = new THREE.MeshStandardMaterial({ color: 0x9ba3b5, roughness: 0.18, metalness: 0.2 });
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x131a2a, roughness: 0.88, metalness: 0.05 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0x293248, roughness: 0.55, metalness: 0.15 });

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(FLOOR_SIZE, FLOOR_SIZE), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  root.add(floor);

  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(FLOOR_SIZE, FLOOR_SIZE), wallMat);
  ceiling.position.y = 6;
  ceiling.rotation.x = Math.PI / 2;
  root.add(ceiling);

  const borderTrim = new THREE.Mesh(new THREE.TorusGeometry(21.5, 0.18, 5, 80), trimMat);
  borderTrim.position.set(0, 5.8, 0);
  borderTrim.rotation.x = Math.PI / 2;
  root.add(borderTrim);

  const makeWall = (x, y, z, sx, sy, sz) => {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), wallMat);
    wall.position.set(x, y, z);
    wall.castShadow = true;
    wall.receiveShadow = true;
    root.add(wall);
    collisionBoxes.push(new THREE.Box3().setFromObject(wall));
  };

  makeWall(0, 2.5, -FLOOR_SIZE / 2, FLOOR_SIZE, 5, 1.2);
  makeWall(0, 2.5, FLOOR_SIZE / 2, FLOOR_SIZE, 5, 1.2);
  makeWall(-FLOOR_SIZE / 2, 2.5, 0, 1.2, 5, FLOOR_SIZE);
  makeWall(FLOOR_SIZE / 2, 2.5, 0, 1.2, 5, FLOOR_SIZE);

  const rooms = [
    { x: -16, z: -16 },
    { x: 16, z: -16 },
    { x: -16, z: 16 },
    { x: 16, z: 16 },
    { x: 0, z: 22 },
  ];
  for (const room of rooms) {
    makeWall(room.x, 2.5, room.z - 4.5, 10, 5, 0.8);
    makeWall(room.x, 2.5, room.z + 4.5, 10, 5, 0.8);
    makeWall(room.x - 4.5, 2.5, room.z, 0.8, 5, 10);
    makeWall(room.x + 4.5, 2.5, room.z, 0.8, 5, 10);
  }

  // Arched entrances to make the museum feel more designed / intentional.
  const archMat = new THREE.MeshStandardMaterial({ color: 0x3e4a62, roughness: 0.35, metalness: 0.25 });
  const archGeo = new THREE.TorusGeometry(2.4, 0.15, 8, 24, Math.PI);
  const archFrames = [
    [0, 3.2, -9, 0], [0, 3.2, 9, Math.PI],
    [-9, 3.2, 0, -Math.PI / 2], [9, 3.2, 0, Math.PI / 2],
  ];
  for (const [x, y, z, ry] of archFrames) {
    const arch = new THREE.Mesh(archGeo, archMat);
    arch.position.set(x, y, z);
    arch.rotation.set(Math.PI / 2, 0, ry);
    root.add(arch);
  }

  const pillarGeo = new THREE.CylinderGeometry(0.6, 0.8, 5.4, 8);
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0xb4b8c0, roughness: 0.2, metalness: 0.23 });
  const pillarMesh = new THREE.InstancedMesh(pillarGeo, pillarMat, 8);
  pillarMesh.castShadow = true;
  pillarMesh.receiveShadow = true;
  const positions = [
    [-9, 2.7, -9], [9, 2.7, -9], [-9, 2.7, 9], [9, 2.7, 9],
    [-20, 2.7, 0], [20, 2.7, 0], [0, 2.7, -20], [0, 2.7, 20],
  ];
  const matrix = new THREE.Matrix4();
  positions.forEach((p, i) => {
    matrix.makeTranslation(p[0], p[1], p[2]);
    pillarMesh.setMatrixAt(i, matrix);
  });
  root.add(pillarMesh);

  const paintingGeo = new THREE.PlaneGeometry(2.6, 1.4);
  const paintingMat = new THREE.MeshStandardMaterial({ color: 0x5a3f70, emissive: 0x1f1635, roughness: 0.7 });
  for (let i = 0; i < 8; i++) {
    const p = new THREE.Mesh(paintingGeo, paintingMat.clone());
    p.position.set(-24 + i * 7, 2.4, -30.2);
    p.material.color.offsetHSL(i * 0.03, 0, 0);
    root.add(p);
    breathingPaintings.push(p);
  }

  // Color-shift panels that slowly breathe in hue around the lobby.
  const panelGeo = new THREE.PlaneGeometry(2.8, 2.8);
  for (let i = 0; i < 6; i++) {
    const panel = new THREE.Mesh(
      panelGeo,
      new THREE.MeshStandardMaterial({ color: 0x4f6ca1, emissive: 0x0f1a3d, emissiveIntensity: 0.3, roughness: 0.65 }),
    );
    panel.position.set(-22 + i * 8.8, 2.6, 30.2);
    panel.rotation.y = Math.PI;
    root.add(panel);
    colorShiftPanels.push(panel);
  }

  // Thin carpet runners for visual guidance through the space.
  const rugMat = new THREE.MeshStandardMaterial({ color: 0x241c36, roughness: 0.9, metalness: 0.0 });
  const rugs = [
    [0, 0.015, 0, 4, 28],
    [-16, 0.015, -16, 3, 8],
    [16, 0.015, -16, 3, 8],
    [-16, 0.015, 16, 3, 8],
    [16, 0.015, 16, 3, 8],
    [0, 0.015, 22, 3, 8],
  ];
  for (const [x, y, z, sx, sz] of rugs) {
    const rug = new THREE.Mesh(new THREE.BoxGeometry(sx, 0.03, sz), rugMat);
    rug.position.set(x, y, z);
    rug.receiveShadow = true;
    root.add(rug);
  }

  const particleCount = 1000;
  const particlePos = new Float32Array(particleCount * 3);
  const particleDrift = new Float32Array(particleCount);
  for (let i = 0; i < particleCount; i++) {
    particlePos[i * 3] = (Math.random() - 0.5) * FLOOR_SIZE;
    particlePos[i * 3 + 1] = Math.random() * 5.5 + 0.2;
    particlePos[i * 3 + 2] = (Math.random() - 0.5) * FLOOR_SIZE;
    particleDrift[i] = Math.random() * Math.PI * 2;
  }
  const particlesGeo = new THREE.BufferGeometry();
  particlesGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
  const particles = new THREE.Points(
    particlesGeo,
    new THREE.PointsMaterial({ color: 0xd7dbff, size: 0.028, transparent: true, opacity: 0.45 }),
  );
  root.add(particles);

  const tempNearest = new THREE.Vector3();
  const tempDelta = new THREE.Vector3();

  function resolveCollisions(sphere) {
    for (const box of collisionBoxes) {
      tempNearest.set(
        THREE.MathUtils.clamp(sphere.center.x, box.min.x, box.max.x),
        THREE.MathUtils.clamp(sphere.center.y, box.min.y, box.max.y),
        THREE.MathUtils.clamp(sphere.center.z, box.min.z, box.max.z),
      );
      tempDelta.copy(sphere.center).sub(tempNearest);
      const d2 = tempDelta.lengthSq();
      const r2 = sphere.radius * sphere.radius;
      if (d2 < r2 && d2 > 0.00001) {
        tempDelta.normalize().multiplyScalar(sphere.radius - Math.sqrt(d2) + 0.001);
        sphere.center.add(tempDelta);
      }
    }
    sphere.center.x = THREE.MathUtils.clamp(sphere.center.x, -29.5, 29.5);
    sphere.center.z = THREE.MathUtils.clamp(sphere.center.z, -29.5, 29.5);
  }

  function update(t) {
    const posAttr = particles.geometry.getAttribute('position');
    for (let i = 0; i < particleCount; i++) {
      const y = posAttr.getY(i) + Math.sin(t * 0.2 + particleDrift[i]) * 0.0007;
      posAttr.setY(i, y > 5.8 ? 0.1 : y);
      posAttr.setX(i, posAttr.getX(i) + Math.sin(t * 0.08 + i) * 0.0002);
      posAttr.setZ(i, posAttr.getZ(i) + Math.cos(t * 0.08 + i) * 0.0002);
    }
    posAttr.needsUpdate = true;

    breathingPaintings.forEach((p, i) => {
      const b = 1 + Math.sin(t * 0.5 + i) * 0.02;
      p.scale.set(b, b, 1);
      p.material.emissiveIntensity = 0.25 + Math.sin(t * 0.8 + i * 2) * 0.12;
    });

    colorShiftPanels.forEach((panel, i) => {
      panel.material.color.setHSL(0.56 + Math.sin(t * 0.13 + i) * 0.08, 0.38, 0.45);
      panel.material.emissive.setHSL(0.56 + Math.sin(t * 0.2 + i) * 0.08, 0.5, 0.16);
      panel.material.emissiveIntensity = 0.25 + Math.sin(t * 0.7 + i) * 0.1;
    });
  }

  return {
    root,
    resolveCollisions,
    update,
  };
}
