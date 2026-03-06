import * as THREE from 'three';

const EYE_HEIGHT = 1.65;
const BOB_SPEED = 6.0;
const BOB_AMOUNT = 0.045;

export function createPlayer(camera, audio, museum) {
  const collider = new THREE.Sphere(new THREE.Vector3(0, EYE_HEIGHT, 8), 0.35);
  const velocity = new THREE.Vector3();
  const direction = new THREE.Vector3();
  const forward = new THREE.Vector3();
  const side = new THREE.Vector3();
  let yaw = Math.PI;
  let pitch = 0;
  let walkTime = 0;
  let stepTimer = 0;
  let idleTimer = 0;

  camera.position.copy(collider.center);

  const tempEuler = new THREE.Euler(0, 0, 0, 'YXZ');

  return {
    get position() { return collider.center; },
    update(delta, lookInput, moveInput) {
      yaw -= lookInput.x * 0.0022;
      pitch -= lookInput.y * 0.0017;
      pitch = THREE.MathUtils.clamp(pitch, -1.2, 1.2);

      tempEuler.set(pitch, yaw, 0);
      camera.quaternion.setFromEuler(tempEuler);

      forward.set(0, 0, -1).applyQuaternion(camera.quaternion);
      forward.y = 0;
      forward.normalize();
      side.crossVectors(new THREE.Vector3(0, 1, 0), forward).normalize();

      direction.set(0, 0, 0);
      direction.addScaledVector(forward, -moveInput.z);
      direction.addScaledVector(side, moveInput.x);
      if (direction.lengthSq() > 0) direction.normalize();

      const targetSpeed = 2.8;
      velocity.x += direction.x * targetSpeed * delta * 7.5;
      velocity.z += direction.z * targetSpeed * delta * 7.5;

      const friction = Math.exp(-7.5 * delta);
      velocity.x *= friction;
      velocity.z *= friction;

      collider.center.addScaledVector(velocity, delta);
      museum.resolveCollisions(collider);

      const moving = velocity.lengthSq() > 0.015;
      if (moving) {
        walkTime += delta * BOB_SPEED;
        stepTimer += delta;
        idleTimer = 0;
      } else {
        walkTime = THREE.MathUtils.damp(walkTime, 0, 3, delta);
        stepTimer = 0;
        idleTimer += delta;
      }

      if (moving && stepTimer > 0.48) {
        stepTimer = 0;
        audio.playFootstep();
      }
      if (idleTimer > 8) {
        idleTimer = 0;
        audio.playDistantPiano();
      }

      const bob = moving ? Math.sin(walkTime) * BOB_AMOUNT : 0;
      const sway = moving ? Math.sin(walkTime * 0.5) * 0.015 : 0;
      camera.position.set(
        collider.center.x + sway,
        collider.center.y + bob,
        collider.center.z,
      );
    },
  };
}
