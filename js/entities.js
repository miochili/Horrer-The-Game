// Horror-The-Game: Part 1 - Game Entities (Player, Enemies, Items)

class Player {
    constructor(scene, startX, startZ) {
        this.scene = scene;
        this.health = GAME_CONFIG.playerMaxHealth;
        this.stamina = 100;
        this.speed = GAME_CONFIG.playerSpeed;
        this.isSprinting = false;
        this.isDead = false;
        
        // Create player mesh (invisible, represents camera position)
        this.mesh = new THREE.Group();
        this.mesh.position.set(startX, 1.7, startZ); // Eye level
        scene.add(this.mesh);
        
        // Flashlight
        this.flashlight = new THREE.SpotLight(0xffffee, 1.5, 30, Math.PI / 6, 0.5, 1);
        this.flashlight.position.set(0, 0, 0);
        this.flashlight.target.position.set(0, 0, -1);
        this.mesh.add(this.flashlight);
        this.mesh.add(this.flashlight.target);
        
        // Flashlight helper (visible cone)
        this.flashlightHelper = new THREE.SpotLightHelper(this.flashlight);
        // scene.add(this.flashlightHelper); // Uncomment for debugging
        
        this.inventory = [];
        this.maxInventorySize = 6;
    }
    
    update(delta, input, camera) {
        if (this.isDead) return;
        
        // Movement
        const moveSpeed = this.isSprinting && this.stamina > 0 ? this.speed * GAME_CONFIG.playerSprintMultiplier : this.speed;
        
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        forward.y = 0;
        forward.normalize();
        
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
        right.y = 0;
        right.normalize();
        
        const moveDir = new THREE.Vector3(0, 0, 0);
        
        if (input.keys['w'] || input.keys['arrowup']) moveDir.add(forward);
        if (input.keys['s'] || input.keys['arrowdown']) moveDir.sub(forward);
        if (input.keys['a'] || input.keys['arrowleft']) moveDir.sub(right);
        if (input.keys['d'] || input.keys['arrowright']) moveDir.add(right);
        
        if (moveDir.length() > 0) {
            moveDir.normalize();
            
            // Sprint logic
            if (this.isSprinting && moveDir.length() > 0 && this.stamina > 0) {
                this.stamina -= GAME_CONFIG.playerStaminaDrain * delta;
                if (this.stamina < 0) this.stamina = 0;
            } else {
                this.stamina += GAME_CONFIG.playerStaminaRegen * delta;
                if (this.stamina > 100) this.stamina = 100;
            }
            
            this.mesh.position.add(moveDir.multiplyScalar(moveSpeed * delta));
            
            // Play footstep sound periodically
            if (Math.random() < 0.02) {
                audioManager.playFootstep();
            }
        }
        
        // Flashlight follows camera direction
        const cameraDir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        this.flashlight.target.position.copy(cameraDir);
        this.flashlight.target.updateMatrixWorld();
    }
    
    takeDamage(amount) {
        this.health -= amount;
        audioManager.playDamage();
        
        if (this.health <= 0) {
            this.health = 0;
            this.isDead = true;
        }
        
        return this.health;
    }
    
    heal(amount) {
        this.health += amount;
        if (this.health > GAME_CONFIG.playerMaxHealth) {
            this.health = GAME_CONFIG.playerMaxHealth;
        }
    }
    
    addToInventory(item) {
        if (this.inventory.length >= this.maxInventorySize) {
            return false;
        }
        this.inventory.push(item);
        this.updateInventoryUI();
        return true;
    }
    
    removeFromInventory(itemIndex) {
        if (itemIndex >= 0 && itemIndex < this.inventory.length) {
            const item = this.inventory.splice(itemIndex, 1)[0];
            this.updateInventoryUI();
            return item;
        }
        return null;
    }
    
    hasItem(itemType) {
        return this.inventory.some(item => item.type === itemType);
    }
    
    updateInventoryUI() {
        const invEl = document.getElementById('inventory');
        invEl.innerHTML = '';
        
        for (let i = 0; i < this.maxInventorySize; i++) {
            const slot = document.createElement('div');
            slot.className = 'inventory-slot';
            
            if (this.inventory[i]) {
                slot.textContent = this.inventory[i].icon || '📦';
                slot.title = this.inventory[i].name;
            }
            
            invEl.appendChild(slot);
        }
    }
    
    getPosition() {
        return {
            x: this.mesh.position.x,
            y: this.mesh.position.y,
            z: this.mesh.position.z
        };
    }
    
    setPosition(x, y, z) {
        this.mesh.position.set(x, y, z);
    }
}

class Enemy {
    constructor(scene, x, z, patrolPoints = []) {
        this.scene = scene;
        this.speed = GAME_CONFIG.enemySpeed;
        this.damage = GAME_CONFIG.enemyDamage;
        this.detectionRange = GAME_CONFIG.enemyDetectionRange;
        this.attackCooldown = 0;
        this.isActive = true;
        this.patrolPoints = patrolPoints;
        this.currentPatrolIndex = 0;
        this.state = 'patrol'; // patrol, chase, attack
        
        // Create enemy mesh (simple capsule for now)
        const geometry = new THREE.CapsuleGeometry(0.5, 1.8, 4, 8);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x330000,
            emissive: 0x220000,
            roughness: 0.8,
            metalness: 0.2
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(x, 1, z);
        scene.add(this.mesh);
        
        // Red glow
        const light = new THREE.PointLight(0xff0000, 1, 5);
        light.position.set(0, 1, 0);
        this.mesh.add(light);
    }
    
    update(delta, player) {
        if (!this.isActive) return;
        
        const distToPlayer = this.mesh.position.distanceTo(player.mesh.position);
        
        // State machine
        if (distToPlayer < this.detectionRange && player.health > 0) {
            this.state = 'chase';
        } else if (this.state === 'chase' && distToPlayer > this.detectionRange * 1.5) {
            this.state = 'patrol';
        }
        
        if (this.state === 'chase') {
            // Chase player
            const direction = new THREE.Vector3().subVectors(player.mesh.position, this.mesh.position);
            direction.y = 0;
            direction.normalize();
            
            this.mesh.position.add(direction.multiplyScalar(this.speed * delta));
            this.mesh.lookAt(player.mesh.position.x, 1, player.mesh.position.z);
            
            // Attack if close
            if (distToPlayer < 2 && this.attackCooldown <= 0) {
                player.takeDamage(this.damage);
                this.attackCooldown = GAME_CONFIG.enemyAttackCooldown / 1000;
                audioManager.playEnemyGrowl();
            }
        } else if (this.state === 'patrol' && this.patrolPoints.length > 0) {
            // Patrol between points
            const target = this.patrolPoints[this.currentPatrolIndex];
            const distToTarget = this.mesh.position.distanceTo(new THREE.Vector3(target.x, 1, target.z));
            
            if (distToTarget < 0.5) {
                this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
            } else {
                const direction = new THREE.Vector3().subVectors(new THREE.Vector3(target.x, 1, target.z), this.mesh.position);
                direction.y = 0;
                direction.normalize();
                
                this.mesh.position.add(direction.multiplyScalar(this.speed * 0.5 * delta));
                this.mesh.lookAt(target.x, 1, target.z);
            }
        }
        
        if (this.attackCooldown > 0) {
            this.attackCooldown -= delta;
        }
    }
    
    deactivate() {
        this.isActive = false;
        this.mesh.visible = false;
    }
    
    activate() {
        this.isActive = true;
        this.mesh.visible = true;
    }
    
    getPosition() {
        return {
            x: this.mesh.position.x,
            y: this.mesh.position.y,
            z: this.mesh.position.z
        };
    }
}

class Item {
    constructor(scene, x, y, z, type, name, icon = '📦') {
        this.scene = scene;
        this.type = type;
        this.name = name;
        this.icon = icon;
        this.isCollected = false;
        
        // Create item mesh (floating cube)
        const geometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0xffcc00,
            emissive: 0xffaa00,
            emissiveIntensity: 0.5
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(x, y, z);
        scene.add(this.mesh);
        
        // Light
        const light = new THREE.PointLight(0xffcc00, 0.5, 3);
        light.position.set(0, 0.2, 0);
        this.mesh.add(light);
        
        this.floatOffset = Math.random() * Math.PI * 2;
    }
    
    update(delta, time) {
        if (this.isCollected) return;
        
        // Float up and down
        this.mesh.position.y += Math.sin(time * 2 + this.floatOffset) * 0.02;
        
        // Rotate
        this.mesh.rotation.y += delta * 0.5;
    }
    
    collect() {
        this.isCollected = true;
        this.mesh.visible = false;
        return {
            type: this.type,
            name: this.name,
            icon: this.icon
        };
    }
}

// Export classes
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Player, Enemy, Item };
}
