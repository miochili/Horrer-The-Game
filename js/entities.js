class PlayerCharacter {
  constructor(scene) {
    this.root = new THREE.Group();
    this.root.position.set(0, 0, 10);
    this.walkSpeed = 4.2;
    this.runSpeed = 7.0;
    this.keys = 0;

    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x29445c, roughness: 0.85 });
    const skinMaterial = new THREE.MeshStandardMaterial({ color: 0xd8ad8c, roughness: 0.9 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.58, 1.7, 12), bodyMaterial);
    body.position.y = 1.0;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 12), skinMaterial);
    head.position.y = 2.12;
    const shoulderLight = new THREE.PointLight(0xffe4b0, 0.9, 8);
    shoulderLight.position.set(0, 1.7, 0.15);
    this.root.add(body, head, shoulderLight);
    scene.add(this.root);
  }

  update(delta, keys, yaw) {
    const forward = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw) * -1);
    const right = new THREE.Vector3(forward.z * -1, 0, forward.x);
    const movement = new THREE.Vector3();
    if (keys.KeyW) movement.add(forward);
    if (keys.KeyS) movement.sub(forward);
    if (keys.KeyA) movement.sub(right);
    if (keys.KeyD) movement.add(right);
    if (movement.lengthSq() > 0) {
      movement.normalize();
      const speed = keys.ShiftLeft || keys.ShiftRight ? this.runSpeed : this.walkSpeed;
      this.root.position.addScaledVector(movement, speed * delta);
      this.root.rotation.y = Math.atan2(movement.x, movement.z);
    }
    this.root.position.x = THREE.MathUtils.clamp(this.root.position.x, -28, 28);
    this.root.position.z = THREE.MathUtils.clamp(this.root.position.z, -28, 28);
  }
}

class Enemy {
  constructor(scene, startX, startZ) {
    this.root = new THREE.Group();
    this.root.position.set(startX, 0, startZ);
    this.speed = 2.2;
    this.active = false;

    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x4a1a1a, roughness: 0.95 });
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0xff3333, emissive: 0x550000 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 1.9, 12), bodyMat);
    body.position.y = 1.1;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.48, 16, 12), bodyMat);
    head.position.y = 2.3;
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), eyeMat);
    eyeL.position.set(-0.18, 2.35, 0.38);
    const eyeR = eyeL.clone();
    eyeR.position.x = 0.18;
    const glow = new THREE.PointLight(0xff2222, 1.2, 6);
    glow.position.set(0, 2.0, 0.2);
    this.root.add(body, head, eyeL, eyeR, glow);
    scene.add(this.root);
  }

  update(delta, playerPos) {
    if (!this.active) return;
    const dir = new THREE.Vector3().subVectors(playerPos, this.root.position);
    dir.y = 0;
    const dist = dir.length();
    if (dist > 0.5) {
      dir.normalize();
      this.root.position.addScaledVector(dir, this.speed * delta);
      this.root.rotation.y = Math.atan2(dir.x, dir.z);
    }
  }
}

class InteractiveDoor {
  constructor(scene, x, z, requiresKey = true) {
    this.requiresKey = requiresKey;
    this.unlocked = false;
    this.root = new THREE.Group();
    this.root.position.set(x, 0, z);

    const frameMat = new THREE.MeshStandardMaterial({ color: 0x3a2a1f, roughness: 0.88 });
    const doorMat = new THREE.MeshStandardMaterial({ color: this.requiresKey ? 0x6b3a2a : 0x5a4a3a, roughness: 0.82 });

    const frameL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4.2, 0.4), frameMat);
    frameL.position.set(-1.2, 2.1, 0);
    const frameR = frameL.clone();
    frameR.position.x = 1.2;
    const top = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.4, 0.4), frameMat);
    top.position.set(0, 4.0, 0);

    this.doorMesh = new THREE.Mesh(new THREE.BoxGeometry(2.0, 3.8, 0.2), doorMat);
    this.doorMesh.position.set(0, 1.9, 0);
    this.doorMesh.castShadow = true;

    this.root.add(frameL, frameR, top, this.doorMesh);
    scene.add(this.root);
  }

  tryOpen(player) {
    if (this.unlocked) return true;
    if (!this.requiresKey) {
      this.unlocked = true;
      this.doorMesh.rotation.y = Math.PI / 2;
      return true;
    }
    if (player.keys > 0) {
      player.keys--;
      this.unlocked = true;
      this.doorMesh.rotation.y = Math.PI / 2;
      return true;
    }
    return false;
  }
}

class KeyItem {
  constructor(scene, x, y, z, onPickup) {
    this.onPickup = onPickup;
    this.root = new THREE.Group();
    this.root.position.set(x, y, z);

    const keyMat = new THREE.MeshStandardMaterial({ color: 0xff4444, emissive: 0x330000, roughness: 0.6 });
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.6, 8), keyMat);
    shaft.rotation.z = Math.PI / 2;
    const head = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.06, 8, 16), keyMat);
    head.position.x = -0.35;
    const glow = new THREE.PointLight(0xff3333, 0.8, 3);
    glow.position.set(0, 0.2, 0);

    this.root.add(shaft, head, glow);
    scene.add(this.root);
  }

  checkPickup(playerPos) {
    const dist = new THREE.Vector3().subVectors(this.root.position, playerPos).length();
    if (dist < 1.2) {
      this.onPickup();
      return true;
    }
    return false;
  }
}
