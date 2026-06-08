import * as THREE from 'three';

/**
 * EnergyCore class
 * Creates the core reactor containment cell consisting of a swirling plasma core,
 * transparent quartz pressure vessel, matte chrome end caps, and dual-axis rotating
 * electromagnetic containment rings. Includes a dynamic light source that pulses.
 */
export class EnergyCore {
  constructor(scene, materialsInstance) {
    this.scene = scene;
    this.materials = materialsInstance;
    this.group = new THREE.Group();
    
    this.initCoreElements();
    this.initReactorRings();
    this.initLight();
    
    this.scene.add(this.group);
  }

  /**
   * Builds the core reactor chambers.
   */
  initCoreElements() {
    // 1. Swirling Plasma Core (swirling GLSL cylinder)
    const plasmaGeo = new THREE.CylinderGeometry(0.1, 0.1, 1.1, 16, 16);
    this.plasmaMesh = new THREE.Mesh(plasmaGeo, this.materials.materials.emissivePlasmaCore);
    this.group.add(this.plasmaMesh);

    // 2. Glass Containment Capsule (outer sleeve)
    const glassGeo = new THREE.CapsuleGeometry(0.38, 0.95, 16, 32);
    this.glassCapsule = new THREE.Mesh(glassGeo, this.materials.materials.greenEnergyGlass);
    this.group.add(this.glassCapsule);

    // 3. Containment collars (black chrome caps locking the capsule)
    const collarGeo = new THREE.CylinderGeometry(0.40, 0.40, 0.12, 32);
    
    this.topCollar = new THREE.Mesh(collarGeo, this.materials.materials.blackChrome);
    this.topCollar.position.y = 0.58;
    this.group.add(this.topCollar);

    this.bottomCollar = new THREE.Mesh(collarGeo, this.materials.materials.blackChrome);
    this.bottomCollar.position.y = -0.58;
    this.group.add(this.bottomCollar);
  }

  /**
   * Spawns rotating tech rings to represent magnetic confinement cages.
   */
  initReactorRings() {
    this.ringsGroup = new THREE.Group();
    this.group.add(this.ringsGroup);

    // Inner orbital magnetic ring (narrow profile)
    const ringGeo1 = new THREE.TorusGeometry(0.5, 0.02, 8, 48);
    this.reactorRing1 = new THREE.Mesh(ringGeo1, this.materials.materials.blackChrome);
    this.reactorRing1.rotation.x = Math.PI / 2;
    this.ringsGroup.add(this.reactorRing1);

    // Outer orbital magnetic ring (aligned on perpendicular axis)
    const ringGeo2 = new THREE.TorusGeometry(0.58, 0.015, 8, 48);
    this.reactorRing2 = new THREE.Mesh(ringGeo2, this.materials.materials.blackChrome);
    this.reactorRing2.rotation.y = Math.PI / 2;
    this.ringsGroup.add(this.reactorRing2);
  }

  /**
   * Initializes the pulsing inner reactor light source.
   */
  initLight() {
    this.coreLight = new THREE.PointLight(0x00ff55, 3.5, 6);
    this.coreLight.decay = 2.0;
    this.coreLight.position.set(0, 0, 0);
    this.group.add(this.coreLight);
  }

  /**
   * Updates core variables, gyroscopic ring rotations, floating offsets, and light pulses.
   */
  update(time) {
    // 1. Swirl electromagnetic confinement rings on different axes
    if (this.reactorRing1) {
      this.reactorRing1.rotation.x = time * 1.5;
      this.reactorRing1.rotation.y = time * 0.5;
    }
    if (this.reactorRing2) {
      this.reactorRing2.rotation.y = -time * 1.2;
      this.reactorRing2.rotation.z = time * 0.7;
    }

    // 2. Animate subtle floating translation (y-axis sine displacement)
    const floatOffset = Math.sin(time * 1.5) * 0.08;
    this.group.position.y = floatOffset;
    
    // 3. Modulate light intensity synchronizing with shader emission pulse
    const pulseFactor = this.materials.uniforms.uPulseIntensity.value;
    if (this.coreLight) {
      this.coreLight.intensity = 3.5 * pulseFactor;
    }
  }

  /**
   * Clean up WebGL assets on core deletion.
   */
  destroy() {
    this.group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
      }
    });
    this.scene.remove(this.group);
  }
}
