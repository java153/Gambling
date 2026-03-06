import * as THREE from 'three';

export function setupLighting(scene) {
  scene.background = new THREE.Color(0x080d1a);
  scene.fog = new THREE.FogExp2(0x090f1d, 0.03);

  const ambient = new THREE.HemisphereLight(0x33406d, 0x080a10, 0.45);
  scene.add(ambient);

  const key = new THREE.DirectionalLight(0xd8cfb5, 1.25);
  key.position.set(7, 9, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 0.1;
  key.shadow.camera.far = 30;
  key.shadow.camera.left = -15;
  key.shadow.camera.right = 15;
  key.shadow.camera.top = 15;
  key.shadow.camera.bottom = -15;
  scene.add(key);

  const roomLights = [];
  const spots = [
    [-16, 4.3, -16, 0x6d95ff],
    [16, 4.3, -16, 0xc58adb],
    [-16, 4.3, 16, 0x84d4ff],
    [16, 4.3, 16, 0xffc988],
    [0, 4.3, 22, 0xfbe7b6],
    [0, 4.2, 0, 0x8eb2ff],
  ];

  for (const [x, y, z, color] of spots) {
    const spot = new THREE.SpotLight(color, 10, 17, 0.52, 0.5, 0.8);
    spot.position.set(x, y, z);
    spot.target.position.set(x, 0.4, z);
    scene.add(spot, spot.target);
    roomLights.push(spot);
  }

  const fillPoints = [];
  const fillData = [
    [-23, 2.0, -23, 0x354a84],
    [23, 2.0, -23, 0x684a8d],
    [-23, 2.0, 23, 0x2b5f93],
    [23, 2.0, 23, 0x94673a],
  ];
  for (const [x, y, z, c] of fillData) {
    const p = new THREE.PointLight(c, 0.7, 14, 2.0);
    p.position.set(x, y, z);
    scene.add(p);
    fillPoints.push(p);
  }

  return {
    update(t) {
      roomLights.forEach((l, i) => {
        l.intensity = 7.8 + Math.sin(t * 0.65 + i * 2.1) * 0.7 + (Math.sin(t * 0.23 + i) > 0.992 ? 0.5 : 0);
        l.angle = 0.5 + Math.sin(t * 0.2 + i) * 0.03;
      });

      fillPoints.forEach((p, i) => {
        p.intensity = 0.45 + Math.sin(t * 0.5 + i * 1.5) * 0.2;
      });

      key.intensity = 1.15 + Math.sin(t * 0.11) * 0.09;
      ambient.intensity = 0.42 + Math.sin(t * 0.08) * 0.04;
    },
  };
}
