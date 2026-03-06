export function createInputController(domElement) {
  const keys = new Map();
  const look = { x: 0, y: 0 };
  const state = { locked: false };

  const onKey = (pressed) => (event) => {
    const key = event.code;
    if (key === 'KeyW' || key === 'KeyA' || key === 'KeyS' || key === 'KeyD') {
      keys.set(key, pressed);
      if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"].includes(event.key)) event.preventDefault();
    }
  };

  const onMouseMove = (event) => {
    if (!state.locked) return;
    look.x += event.movementX;
    look.y += event.movementY;
  };

  document.addEventListener('keydown', onKey(true));
  document.addEventListener('keyup', onKey(false));
  document.addEventListener('mousemove', onMouseMove, { passive: true });
  document.addEventListener('pointerlockchange', () => {
    state.locked = document.pointerLockElement === domElement;
  });

  return {
    state,
    lock: () => domElement.requestPointerLock(),
    consumeLook() {
      const out = { x: look.x, y: look.y };
      look.x = 0;
      look.y = 0;
      return out;
    },
    movementVector() {
      return {
        x: (keys.get('KeyD') ? 1 : 0) - (keys.get('KeyA') ? 1 : 0),
        z: (keys.get('KeyS') ? 1 : 0) - (keys.get('KeyW') ? 1 : 0),
      };
    },
  };
}
