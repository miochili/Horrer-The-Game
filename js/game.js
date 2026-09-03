(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const keys = Object.create(null);
  let scene, camera, renderer, player;
  let yaw = 0;
  let pitch = -0.22;
  let started = false;
  let lastTime = performance.now();

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

  function buildTestMansion() {
    scene.add(new THREE.HemisphereLight(0x91add8, 0x20100b, 0.75));
    const moon = new THREE.DirectionalLight(0x9dbdff, 1.1);
    moon.position.set(-10, 15, 8);
    moon.castShadow = true;
    scene.add(moon);

    addBox(0, -0.2, 0, 36, 0.4, 36, 0x3c3028);
    addBox(0, 3, -17, 36, 6, 0.5, 0x2a211d);
    addBox(0, 3, 17, 36, 6, 0.5, 0x2a211d);
    addBox(-17, 3, 0, 0.5, 6, 36, 0x2a211d);
    addBox(17, 3, 0, 0.5, 6, 36, 0x2a211d);
    addBox(0, 3, 0, 0.5, 6, 18, 0x30251e);
    addBox(-8, 1.1, -4, 5, 2.2, 2, 0x4c3322);
    addBox(8, 1.1, 4, 5, 2.2, 2, 0x4c3322);
    addBox(-11, 2.2, 8, 2, 4.4, 6, 0x342419);
    addBox(11, 2.2, 8, 2, 4.4, 6, 0x342419);
    addLight(-8, 4.8, -8, 0xffc377, 2.7, 17);
    addLight(8, 4.8, -8, 0xffc377, 2.7, 17);
    addLight(0, 5.0, 10, 0x9ebcff, 2.0, 18);
  }

  function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111a2b);
    scene.fog = new THREE.FogExp2(0x111a2b, 0.025);
    camera = Three.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 150);
    renderer = new THREE.WebGLRenderer({ canvas: $('game-canvas'), antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    buildTestMansion();
    player = new PlayerCharacter(scene);
    animate();
    setTimeout(() => { $('loading').hidden = true; $('menu').hidden = false; }, 350);
  }

  function startGame() {
    $('menu').hidden = true;
    $('game').hidden = false;
    started = true;
    $('status').textContent = 'Playable test scene — movement active';
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

  function animate() {
    requestAnimationFrame(animate);
    const now = performance.now();
    const delta = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    if (started) {
      player.update(delta, keys, yaw);
      updateCamera();
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
