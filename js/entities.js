// Horror-The-Game: Part 1 v2.1 - Enhanced Entities
class Player {
    constructor(scene, startX, startZ) {
        this.scene = scene;
        this.health = GAME_CONFIG.playerMaxHealth;
        this.stamina = 100;
        this.sanity = 100;
        this.speed = GAME_CONFIG.playerSpeed;
        this.isSprinting = false;
        this.isDead = false;
        this.mesh = new THREE.Group();
        this.mesh.position.set(startX, 1.7, startZ);
        scene.add(this.mesh);
        this.flashlight = new THREE.SpotLight(0xffffee, 2.0, 40, Math.PI/5, 0.5, 1);
        this.flashlight.position.set(0, 0, 0);
        this.flashlight.target.position.set(0, 0, -1);
        this.mesh.add(this.flashlight);
        this.mesh.add(this.flashlight.target);
        this.inventory = [];
        this.maxInventorySize = 8;
    }
    update(delta, input, camera, enemies) {
        if (this.isDead) return;
        const moveSpeed = this.isSprinting && this.stamina > 0 ? this.speed * GAME_CONFIG.playerSprintMultiplier : this.speed;
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion); forward.y = 0; forward.normalize();
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion); right.y = 0; right.normalize();
        const moveDir = new THREE.Vector3();
        if (input.keys['w'] || input.keys['arrowup']) moveDir.add(forward);
        if (input.keys['s'] || input.keys['arrowdown']) moveDir.sub(forward);
        if (input.keys['a'] || input.keys['arrowleft']) moveDir.sub(right);
        if (input.keys['d'] || input.keys['arrowright']) moveDir.add(right);
        if (moveDir.length() > 0) {
            moveDir.normalize();
            if (this.isSprinting && this.stamina > 0) { this.stamina -= GAME_CONFIG.playerStaminaDrain * delta; if (this.stamina < 0) this.stamina = 0; }
            else { this.stamina += GAME_CONFIG.playerStaminaRegen * delta; if (this.stamina > 100) this.stamina = 100; }
            this.mesh.position.add(moveDir.multiplyScalar(moveSpeed * delta));
            if (Math.random() < 0.015) audioManager.playFootstep();
        }
        const cameraDir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        this.flashlight.target.position.copy(cameraDir);
        this.flashlight.target.updateMatrixWorld();
        let nearestEnemyDist = Infinity;
        enemies.forEach(e => { if (e.isActive) { const dist = this.mesh.position.distanceTo(e.mesh.position); if (dist < nearestEnemyDist) nearestEnemyDist = dist; } });
        if (nearestEnemyDist < 10) this.sanity -= GAME_CONFIG.sanityDrainNearEnemy * delta;
        else this.sanity -= GAME_CONFIG.sanityDrainRate * delta;
        if (this.sanity < 0) this.sanity = 0;
        if (this.sanity > 100) this.sanity = 100;
    }
    takeDamage(amount) { this.health -= amount; audioManager.playDamage(); if (this.health <= 0) { this.health = 0; this.isDead = true; } return this.health; }
    heal(amount) { this.health += amount; if (this.health > GAME_CONFIG.playerMaxHealth) this.health = GAME_CONFIG.playerMaxHealth; }
    addToInventory(item) { if (this.inventory.length >= this.maxInventorySize) return false; this.inventory.push(item); this.updateInventoryUI(); return true; }
    hasItem(itemType) { return this.inventory.some(item => item.type === itemType); }
    updateInventoryUI() { const invEl = document.getElementById('inventory'); invEl.innerHTML = ''; for (let i = 0; i < this.maxInventorySize; i++) { const slot = document.createElement('div'); slot.className = 'inventory-slot'; if (this.inventory[i]) { slot.textContent = this.inventory[i].icon || '📦'; slot.title = this.inventory[i].name; } invEl.appendChild(slot); } }
    getPosition() { return { x: this.mesh.position.x, y: this.mesh.position.y, z: this.mesh.position.z }; }
    setPosition(x, y, z) { this.mesh.position.set(x, y, z); }
}

class Enemy {
    constructor(scene, x, z, type = 'basic', patrolPoints = []) {
        this.scene = scene; this.type = type;
        this.speed = GAME_CONFIG.enemySpeed * (type === 'fast' ? 1.4 : type === 'tank' ? 0.7 : 1);
        this.damage = GAME_CONFIG.enemyDamage * (type === 'tank' ? 2 : 1);
        this.detectionRange = GAME_CONFIG.enemyDetectionRange * (type === 'stealth' ? 0.7 : 1.2);
        this.attackCooldown = 0; this.isActive = true; this.patrolPoints = patrolPoints; this.currentPatrolIndex = 0; this.state = 'patrol';
        const colors = { basic: 0x660000, fast: 0x990000, tank: 0x330000, stealth: 0x440044, boss: 0x880088 };
        const geometry = new THREE.CapsuleGeometry(type === 'tank' ? 0.7 : 0.5, type === 'tank' ? 2.2 : 1.8, 4, 8);
        const material = new THREE.MeshStandardMaterial({ color: colors[type] || 0x330000, emissive: 0x220000, roughness: 0.8, metalness: 0.2 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(x, type === 'tank' ? 1.2 : 1, z);
        scene.add(this.mesh);
        const light = new THREE.PointLight(type === 'boss' ? 0xff00ff : 0xff0000, 1.5, 8);
        light.position.set(0, 1, 0); this.mesh.add(light);
    }
    update(delta, player) {
        if (!this.isActive) return;
        const distToPlayer = this.mesh.position.distanceTo(player.mesh.position);
        if (distToPlayer < this.detectionRange && player.health > 0) this.state = 'chase';
        else if (this.state === 'chase' && distToPlayer > this.detectionRange * 1.5) this.state = 'patrol';
        if (this.state === 'chase') {
            const direction = new THREE.Vector3().subVectors(player.mesh.position, this.mesh.position); direction.y = 0; direction.normalize();
            this.mesh.position.add(direction.multiplyScalar(this.speed * delta));
            this.mesh.lookAt(player.mesh.position.x, 1, player.mesh.position.z);
            if (distToPlayer < 2.5 && this.attackCooldown <= 0) { player.takeDamage(this.damage); this.attackCooldown = GAME_CONFIG.enemyAttackCooldown / 1000; audioManager.playEnemyGrowl(); }
        } else if (this.state === 'patrol' && this.patrolPoints.length > 0) {
            const target = this.patrolPoints[this.currentPatrolIndex];
            const distToTarget = this.mesh.position.distanceTo(new THREE.Vector3(target.x, 1, target.z));
            if (distToTarget < 0.5) this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
            else { const direction = new THREE.Vector3().subVectors(new THREE.Vector3(target.x, 1, target.z), this.mesh.position); direction.y = 0; direction.normalize(); this.mesh.position.add(direction.multiplyScalar(this.speed * 0.5 * delta)); this.mesh.lookAt(target.x, 1, target.z); }
        }
        if (this.attackCooldown > 0) this.attackCooldown -= delta;
    }
    deactivate() { this.isActive = false; this.mesh.visible = false; }
    activate() { this.isActive = true; this.mesh.visible = true; }
}

class Item {
    constructor(scene, x, y, z, type, name, icon = '📦') {
        this.scene = scene; this.type = type; this.name = name; this.icon = icon; this.isCollected = false;
        const geometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
        const material = new THREE.MeshStandardMaterial({ color: 0xffcc00, emissive: 0xffaa00, emissiveIntensity: 0.5 });
        this.mesh = new THREE.Mesh(geometry, material); this.mesh.position.set(x, y, z); scene.add(this.mesh);
        const light = new THREE.PointLight(0xffcc00, 0.8, 5); light.position.set(0, 0.2, 0); this.mesh.add(light);
        this.floatOffset = Math.random() * Math.PI * 2;
    }
    update(delta, time) { if (this.isCollected) return; this.mesh.position.y += Math.sin(time * 2 + this.floatOffset) * 0.02; this.mesh.rotation.y += delta * 0.5; }
    collect() { this.isCollected = true; this.mesh.visible = false; return { type: this.type, name: this.name, icon: this.icon }; }
}
