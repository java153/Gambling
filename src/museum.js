import * as THREE from 'three';

const FLOOR_SIZE = 62;

export function createMuseum(scene) {
  const root = new THREE.Group();
  scene.add(root);

  const collisionBoxes = [];
  const breathingPaintings = [];

  const floorMat = new THREE.MeshStandardMaterial({ color: 0x8d93a1, roughness: 0.14, metalness: 0.28 });
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9, metalness: 0.05 });

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(FLOOR_SIZE, FLOOR_SIZE), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  root.add(floor);

  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(FLOOR_SIZE, FLOOR_SIZE), wallMat);
  ceiling.position.y = 6;
  ceiling.rotation.x = Math.PI / 2;
  root.add(ceiling);

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

  const pillarGeo = new THREE.CylinderGeometry(0.6, 0.8, 5.4, 8);
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0xb4b8c0, roughness: 0.2, metalness: 0.23 });
  const pillarMesh = new THREE.InstancedMesh(pillarGeo, pillarMat, 8);
  pillarMesh.castShadow = true;
  pillarMesh.receiveShadow = true;
  const positions = [
    [-9, 2.7, -9], [9, 2.7, -9], [-9, 2.7, 9], [9, 2.7, 9],
    [-20, 2.7, 0], [20, 2.7, 0], [0, 2.7, -20], [0, 2.7, 20],
  ];
  const m = new THREE.Matrix4();
  positions.forEach((p, i) => {
    m.makeTranslation(p[0], p[1], p[2]);
    pillarMesh.setMatrixAt(i, m);
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

  const particleCount = 400;
  const particlePos = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    particlePos[i * 3] = (Math.random() - 0.5) * FLOOR_SIZE;
    particlePos[i * 3 + 1] = Math.random() * 5.5 + 0.2;
    particlePos[i * 3 + 2] = (Math.random() - 0.5) * FLOOR_SIZE;
  }
  const particlesGeo = new THREE.BufferGeometry();
  particlesGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
  const particles = new THREE.Points(
    particlesGeo,
    new THREE.PointsMaterial({ color: 0xd7dbff, size: 0.03, transparent: true, opacity: 0.45 }),
  );
  root.add(particles);

  function resolveCollisions(sphere) {
    for (const box of collisionBoxes) {
      const nearest = new THREE.Vector3(
        THREE.MathUtils.clamp(sphere.center.x, box.min.x, box.max.x),
        THREE.MathUtils.clamp(sphere.center.y, box.min.y, box.max.y),
        THREE.MathUtils.clamp(sphere.center.z, box.min.z, box.max.z),
      );
      const delta = sphere.center.clone().sub(nearest);
      const d2 = delta.lengthSq();
      const r2 = sphere.radius * sphere.radius;
      if (d2 < r2 && d2 > 0.00001) {
        delta.normalize().multiplyScalar(sphere.radius - Math.sqrt(d2) + 0.001);
        sphere.center.add(delta);
      }
    }
    sphere.center.x = THREE.MathUtils.clamp(sphere.center.x, -29.5, 29.5);
    sphere.center.z = THREE.MathUtils.clamp(sphere.center.z, -29.5, 29.5);
  }

  function update(t) {
    particles.rotation.y = t * 0.007;
    breathingPaintings.forEach((p, i) => {
      const b = 1 + Math.sin(t * 0.5 + i) * 0.02;
      p.scale.set(b, b, 1);
      p.material.emissiveIntensity = 0.25 + Math.sin(t * 0.8 + i * 2) * 0.12;
    });
  }

  return {
    root,
    resolveCollisions,
    update,
  };
}
