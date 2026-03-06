import * as THREE from 'three';

export function setupLighting(scene) {
  scene.background = new THREE.Color(0x080d1a);
  scene.fog = new THREE.FogExp2(0x090f1d, 0.03);

  const ambient = new THREE.HemisphereLight(0x2a325f, 0x0c0d12, 0.35);
  scene.add(ambient);

  const key = new THREE.DirectionalLight(0xd0c6aa, 1.2);
  key.position.set(7, 8, 4);
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
    const spot = new THREE.SpotLight(color, 10, 16, 0.5, 0.5, 0.8);
    spot.position.set(x, y, z);
    spot.target.position.set(x, 0.4, z);
    spot.castShadow = false;
    scene.add(spot, spot.target);
    roomLights.push(spot);
  }

  return {
    update(t) {
      roomLights.forEach((l, i) => {
        l.intensity = 8 + Math.sin(t * 0.65 + i * 2.1) * 0.5 + (Math.sin(t * 0.23 + i) > 0.99 ? 0.35 : 0);
      });
    },
  };
}
