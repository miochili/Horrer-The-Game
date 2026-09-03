// HOTFIX v2.4: Three.js r128-compatible entities
class Player {
  constructor(scene, x, z) {
    this.scene = scene; this.health = GAME_CONFIG.playerMaxHealth; this.stamina = 100; this.sanity = 100;
    this.speed = GAME_CONFIG.playerSpeed; this.isSprinting = false; this.isDead = false; this.inventory = []; this.maxInventorySize = 8;
    this.mesh = new THREE.Group(); this.mesh.position.set(x, 1.7, z); scene.add(this.mesh);
    this.flashlight = new THREE.SpotLight(0xffffee, 2, 40, Math.PI / 5, .5, 1);
    this.mesh.add(this.flashlight); this.flashlight.target.position.set(0, 0, -1); this.mesh.add(this.flashlight.target);
  }
  update(delta, input, camera, enemies) {
    if (this.isDead) return;
    const speed = this.isSprinting && this.stamina > 0 ? this.speed * GAME_CONFIG.playerSprintMultiplier : this.speed;
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion); forward.y = 0; forward.normalize();
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion); right.y = 0; right.normalize();
    const dir = new THREE.Vector3();
    if (input.keys.w || input.keys.arrowup) dir.add(forward); if (input.keys.s || input.keys.arrowdown) dir.sub(forward);
    if (input.keys.a || input.keys.arrowleft) dir.sub(right); if (input.keys.d || input.keys.arrowright) dir.add(right);
    if (dir.lengthSq()) {
      dir.normalize(); this.mesh.position.add(dir.multiplyScalar(speed * delta));
      if (this.isSprinting && this.stamina > 0) this.stamina = Math.max(0, this.stamina - GAME_CONFIG.playerStaminaDrain * delta);
      else this.stamina = Math.min(100, this.stamina + GAME_CONFIG.playerStaminaRegen * delta);
    }
    const view = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion); this.flashlight.target.position.copy(view); this.flashlight.target.updateMatrixWorld();
    let nearest = Infinity; enemies.forEach(e => { if (e.isActive) nearest = Math.min(nearest, this.mesh.position.distanceTo(e.mesh.position)); });
    this.sanity = Math.max(0, this.sanity - (nearest < 10 ? GAME_CONFIG.sanityDrainNearEnemy : GAME_CONFIG.sanityDrainRate) * delta);
  }
  takeDamage(amount) { this.health = Math.max(0, this.health - amount); if (this.health === 0) this.isDead = true; if (window.audioManager) audioManager.playDamage(); return this.health; }
  heal(amount) { this.health = Math.min(GAME_CONFIG.playerMaxHealth, this.health + amount); }
  restoreSanity(amount) { this.sanity = Math.min(100, this.sanity + amount); }
  addToInventory(item) { if (this.inventory.length >= this.maxInventorySize) return false; this.inventory.push(item); this.updateInventoryUI(); return true; }
  hasItem(type) { return this.inventory.some(i => i.type === type); }
  updateInventoryUI() { const el = document.getElementById('inventory'); if (!el) return; el.innerHTML = ''; for (let i = 0; i < this.maxInventorySize; i++) { const slot = document.createElement('div'); slot.className = 'inventory-slot'; if (this.inventory[i]) slot.textContent = this.inventory[i].icon || '📦'; el.appendChild(slot); } }
  getPosition() { return { x: this.mesh.position.x, y: this.mesh.position.y, z: this.mesh.position.z }; }
  setPosition(x, y, z) { this.mesh.position.set(x, y, z); }
}

class Enemy {
  constructor(scene, x, z, type = 'basic', patrolPoints = []) {
    this.scene = scene; this.type = type; this.patrolPoints = patrolPoints; this.currentPatrolIndex = 0; this.state = 'patrol'; this.isActive = true; this.attackCooldown = 0;
    this.speed = GAME_CONFIG.enemySpeed * (type === 'fast' ? 1.4 : type === 'tank' ? .7 : 1);
    this.damage = GAME_CONFIG.enemyDamage * (type === 'tank' ? 2 : 1);
    this.detectionRange = GAME_CONFIG.enemyDetectionRange * (type === 'stealth' ? .7 : 1.2);
    const color = ({ basic: 0x660000, fast: 0x990000, tank: 0x330000, stealth: 0x440044, boss: 0x880088 })[type] || 0x660000;
    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(type === 'tank' ? .7 : .5, type === 'tank' ? .8 : .55, type === 'tank' ? 2.2 : 1.8, 10), new THREE.MeshStandardMaterial({ color, emissive: 0x220000, roughness: .8 }));
    const head = new THREE.Mesh(new THREE.SphereGeometry(type === 'tank' ? .72 : .52, 12, 8), new THREE.MeshStandardMaterial({ color, emissive: 0x330000 }));
    head.position.y = type === 'tank' ? 1.45 : 1.15; group.add(body, head); group.position.set(x, type === 'tank' ? 1.2 : 1, z); scene.add(group); this.mesh = group;
    const light = new THREE.PointLight(type === 'boss' ? 0xff00ff : 0xff0000, 1.2, 7); light.position.y = 1; group.add(light);
  }
  update(delta, player) {
    if (!this.isActive) return;
    const distance = this.mesh.position.distanceTo(player.mesh.position);
    if (distance < this.detectionRange && player.health > 0) this.state = 'chase'; else if (this.state === 'chase' && distance > this.detectionRange * 1.5) this.state = 'patrol';
    if (this.state === 'chase') { const d = new THREE.Vector3().subVectors(player.mesh.position, this.mesh.position); d.y = 0; d.normalize(); this.mesh.position.add(d.multiplyScalar(this.speed * delta)); this.mesh.lookAt(player.mesh.position.x, this.mesh.position.y, player.mesh.position.z); if (distance < 2.5 && this.attackCooldown <= 0) { player.takeDamage(this.damage); this.attackCooldown = GAME_CONFIG.enemyAttackCooldown / 1000; if (window.audioManager) audioManager.playEnemyGrowl(); } }
    else if (this.patrolPoints.length) { const p = this.patrolPoints[this.currentPatrolIndex]; const target = new THREE.Vector3(p.x, this.mesh.position.y, p.z); if (this.mesh.position.distanceTo(target) < .5) this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length; else { const d = target.sub(this.mesh.position).normalize(); this.mesh.position.add(d.multiplyScalar(this.speed * .5 * delta)); } }
    this.attackCooldown = Math.max(0, this.attackCooldown - delta);
  }
  deactivate() { this.isActive = false; this.mesh.visible = false; }
  activate() { this.isActive = true; this.mesh.visible = true; }
}

class Item {
  constructor(scene, x, y, z, type, name, icon = '📦') { this.type = type; this.name = name; this.icon = icon; this.isCollected = false; this.mesh = new THREE.Mesh(new THREE.BoxGeometry(.3, .3, .3), new THREE.MeshStandardMaterial({ color: 0xffcc00, emissive: 0xffaa00, emissiveIntensity: .5 })); this.mesh.position.set(x, y, z); scene.add(this.mesh); this.floatOffset = Math.random() * Math.PI * 2; }
  update(delta, time) { if (!this.isCollected) { this.mesh.position.y += Math.sin(time * 2 + this.floatOffset) * .02; this.mesh.rotation.y += delta * .5; } }
  collect() { this.isCollected = true; this.mesh.visible = false; return { type: this.type, name: this.name, icon: this.icon }; }
}
