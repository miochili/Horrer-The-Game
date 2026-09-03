class PlayerCharacter {
  constructor(scene) {
    this.root = new THREE.Group();
    this.root.position.set(0, 0, 8);
    this.walkSpeed = 4.2;
    this.runSpeed = 7.0;

    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x29445c, roughness: 0.85 });
    const skinMaterial = new THREE.MeshStandardMaterial({ color: 0xd8ad8c, roughness: 0.9 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.58, 1.7, 12), bodyMaterial);
    body.position.y = 1.0;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 12), skinMaterial);
    head.position.y = 2.12;
    const shoulderLight = new THREE.PointLight(0xffe4b0, 0.8, 7);
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
    this.root.position.x = THREE.MathUtils.clamp(this.root.position.x, -16, 16);
    this.root.position.z = THREE.MathUtils.clamp(this.root.position.z, -16, 16);
  }
}
