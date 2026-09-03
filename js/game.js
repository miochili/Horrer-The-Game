(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const keys = Object.create(null);
  let scene, camera, renderer, player, enemy;
  let yaw = 0;
  let pitch = -0.22;
  let started = false;
  let lastTime = performance.now();
  let doors = [];
  let keyItems = [];
  let statusText = '';

  function showError(error) {
    console.error(error);
    $('loading').hidden = true;
    $('menu').hidden = true;
    $('game').hidden = true;
    $('error-text').textContent = error && error.stack ? error.stack : String(error);
    $('error-panel').hidden = false;
  }

  window.addEventListener('error', (event) => showError(event.error || event.message));
  window.addEventListener('unhandledrejection', (event) => showError(event.reason));

  function updateInventory() {
    $('inventory').textContent = 'Keys: ' + (player ? player.keys : 0);
  }

  function addBox(x, y, z, width, height, depth, color) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, depth),
      new THREE.MeshStandardMaterial({ color, roughness: 0.82 })
    );
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
  }

  function addLight(x, y, z, color, intensity, distance) {
    const light = new THREE.PointLight(color, intensity, distance, 2);
    light.position.set(x, y, z);
    light.castShadow = true;
    scene.add(light);
    return light;
  }

  function buildMansion() {
    scene.add(new THREE.HemisphereLight(0x91add8, 0x20100b, 0.75));
    const moon = new THREE.DirectionalLight(0x9dbdff, 1.1);
    moon.position.set(-10, 15, 8);
    moon.castShadow = true;
    scene.add(moon);

    // Floor
    addBox(0, -0.2, 0, 60, 0.4, 60, 0x3c3028);

    // Outer walls
    addBox(0, 3, -28, 60, 6, 0.5, 0x2a211d);
    addBox(0, 3, 28, 60, 6, 0.5, 0x2a211d);
    addBox(-28, 3, 0, 0.5, 6, 60, 0x2a211d);
    addBox(28, 3, 0, 0.5, 6, 60, 0x2a211d);

    // Inner corridors
    addBox(0, 3, 0, 0.5, 6, 40, 0x30251e);
    addBox(-12, 3, -12, 24, 6, 0.5, 0x30251e);
    addBox(12, 3, 12, 24, 6, 0.5, 0x30251e);

    // Rooms furniture / obstacles
    addBox(-20, 1.5, -20, 8, 3, 8, 0x4a3322);
    addBox(20, 1.5, 20, 8, 3, 8, 0x4a3322);
    addBox(-20, 1.5, 20, 6, 3, 6, 0x3a2a1f);
    addBox(20, 1.5, -20, 6, 3, 6, 0x3a2a1f);

    // Doors
    const door1 = new InteractiveDoor(scene, 0, -12, true);
    const door2 = new InteractiveDoor(scene, 12, 0, false);
    doors.push(door1, door2);

    // Keys
    const key1 = new KeyItem(scene, -18, 1.2, -18, () => {
      if (player) {
        player.keys++;
        updateInventory();
        setStatus('You found a red key. Find the locked door.');
      }
    });
    keyItems.push(key1);

    // Lights
    addLight(-18, 4.8, -18, 0xffc377, 2.7, 16);
    addLight(18, 4.8, -18, 0xffc377, 2.7, 16);
    addLight(0, 5.0, 10, 0x9ebcff, 2.0, 18);
    addLight(-12, 4.5, 12, 0xffaa66, 2.2, 14);
    addLight(12, 4.5, -12, 0xffaa66, 2.2, 14);

    // Enemy
    enemy = new Enemy(scene, 22, 22);
  }

  function setStatus(text) {
    statusText = text;
    $('status').textContent = text;
  }

  function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111a2b);
    scene.fog = new THREE.FogExp2(0x111a2b, 0.018);
    camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 150);
    renderer = new THREE.WebGLRenderer({ canvas: $('game-canvas'), antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    buildMansion();
    player = new PlayerCharacter(scene);
    updateInventory();
    animate();
    setTimeout(() => { $('loading').hidden = true; $('menu').hidden = false; }, 350);
  }

  function startGame() {
    $('menu').hidden = true;
    $('game').hidden = false;
    started = true;
    setStatus('Explore the mansion. Find the red key.');
    $('game-canvas').requestPointerLock?.();
  }

  function updateCamera() {
    const offset = new THREE.Vector3(0, 4.1, 7.2);
    offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    const target = player.root.position.clone().add(new THREE.Vector3(0, 1.3, 0));
    const desired = target.clone().add(offset);
    camera.position.lerp(desired, 0.12);
    const lookTarget = target.clone().add(new THREE.Vector3(Math.sin(yaw) * 4, pitch * 3, -Math.cos(yaw) * 4));
    camera.lookAt(lookTarget);
  }

  function checkInteractions() {
    const pPos = player.root.position;
    for (const key of keyItems) {
      if (key.checkPickup(pPos)) {
        scene.remove(key.root);
      }
    }
    if (keys.KeyE) {
      for (const door of doors) {
        const dPos = door.root.position;
        const dist = new THREE.Vector3().subVectors(dPos, pPos).length();
        if (dist < 3.5) {
          const ok = door.tryOpen(player);
          if (!ok && door.requiresKey) {
            setStatus('This door is locked. You need a key.');
          } else if (ok) {
            setStatus('Door opened.');
          }
          break;
        }
      }
    }
    // Activate enemy when player gets close to center
    if (!enemy.active && pPos.length() < 10) {
      enemy.active = true;
      setStatus('Something is following you...');
    }
  }

  function animate() {
    requestAnimationFrame(animate);
    const now = performance.now();
    const delta = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    if (started) {
      player.update(delta, keys, yaw);
      enemy.update(delta, player.root.position);
      updateCamera();
      checkInteractions();
    }
    renderer.render(scene, camera);
  }

  $('start-button').addEventListener('click', startGame);
  $('reload-button').addEventListener('click', () => window.location.reload());
  window.addEventListener('keydown', (event) => { keys[event.code] = true; });
  window.addEventListener('keyup', (event) => { keys[event.code] = false; });
  window.addEventListener('mousemove', (event) => {
    if (started && document.pointerLockElement === $('game-canvas')) {
      yaw -= event.movementX * 0.0025;
      pitch = THREE.MathUtils.clamp(pitch - event.movementY * 0.002, -0.75, 0.25);
    }
  });
  window.addEventListener('resize', () => {
    if (!camera || !renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
  window.addEventListener('load', () => { try { init(); } catch (error) { showError(error); } });
})();
