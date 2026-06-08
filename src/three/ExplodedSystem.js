import * as THREE from 'three';

/**
 * ExplodedSystem class
 * Draws glowing vertical laser lines connecting the beverage can keychain elements
 * (Keyring, Chain link segments, Rope loop, Top Lid, Can Body, Bottom Lid)
 * during exploded view separations.
 */
export class ExplodedSystem {
  constructor(scene, model) {
    this.scene = scene;
    this.model = model;
    
    // Group containing all laser connector lines, child of model group to inherit rotations
    this.group = new THREE.Group();
    this.model.group.add(this.group);
    
    this.lines = [];
    this.initLines();
  }

  /**
   * Initializes the glowing green line geometries.
   */
  initLines() {
    this.lineMaterial = new THREE.LineBasicMaterial({
      color: 0x00ff44,
      transparent: true,
      opacity: 0, // starts invisible
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    // We draw 6 vertical links mapping the structure:
    // Link 0: Keyring (ringGroup) -> Chain Link 1
    // Link 1: Chain Link 1 -> Chain Link 2
    // Link 2: Chain Link 2 -> Chain Link 3
    // Link 3: Chain Link 3 -> Rope Loop (ropeGroup)
    // Link 4: Rope Loop -> Top Lid
    // Link 5: Top Lid -> Can Body
    // Link 6: Can Body -> Bottom Lid
    const numSegments = 7;
    for (let i = 0; i < numSegments; i++) {
      const geo = new THREE.BufferGeometry().setAttribute(
        'position', 
        new THREE.BufferAttribute(new Float32Array(6), 3)
      );
      const line = new THREE.Line(geo, this.lineMaterial);
      this.group.add(line);
      this.lines.push(line);
    }
  }

  /**
   * Recalculates coordinate connections as components separate.
   */
  update() {
    if (!this.model || !this.model.group || !this.model.ringGroup || !this.model.chainGroup || !this.model.ropeGroup) {
      return;
    }
    const factor = this.model.explodedFactor;

    if (factor < 0.05) {
      this.lineMaterial.opacity = 0;
      this.group.visible = false;
      return;
    }

    this.group.visible = true;
    this.lineMaterial.opacity = Math.min(0.6, (factor - 0.05) * 1.5);

    // Retrieve positions
    const ringY = this.model.ringGroup.position.y + 2.4;
    
    let l1Y = 2.05, l2Y = 1.80, l3Y = 1.55;
    if (this.model.chainGroup.children.length === 3) {
      l1Y = this.model.chainGroup.children[0].position.y;
      l2Y = this.model.chainGroup.children[1].position.y;
      l3Y = this.model.chainGroup.children[2].position.y;
    }

    const ropeX = this.model.ropeGroup.position.x;
    const ropeY = this.model.ropeGroup.position.y + 1.25;

    const lidY = this.model.topLid ? this.model.topLid.position.y : 0.64;
    
    // Can body position (X=0, Z floats forward)
    const canX = this.model.canBody ? this.model.canBody.position.x : 0;
    const canY = this.model.canBody ? this.model.canBody.position.y : 0;
    const canZ = this.model.canBody ? this.model.canBody.position.z : 0;

    const bottomLidY = this.model.bottomLid ? this.model.bottomLid.position.y : -0.65;

    // Apply matrix transformation to project line vertices
    // Segment 0: Keyring -> Link 1
    this.updateLineVertices(this.lines[0], 0, ringY, 0, 0, l1Y, 0);

    // Segment 1: Link 1 -> Link 2
    this.updateLineVertices(this.lines[1], 0, l1Y, 0, 0, l2Y, 0);

    // Segment 2: Link 2 -> Link 3
    this.updateLineVertices(this.lines[2], 0, l2Y, 0, 0, l3Y, 0);

    // Segment 3: Link 3 -> Rope Loop center (Y offset moves rope left)
    this.updateLineVertices(this.lines[3], 0, l3Y, 0, ropeX, ropeY, 0);

    // Segment 4: Rope Loop -> Top Lid center
    this.updateLineVertices(this.lines[4], ropeX, ropeY, 0, 0, lidY, 0);

    // Segment 5: Top Lid center -> Can Body center (Can Body floats on Z)
    this.updateLineVertices(this.lines[5], 0, lidY, 0, canX, canY, canZ);

    // Segment 6: Can Body center -> Bottom Lid center
    this.updateLineVertices(this.lines[6], canX, canY, canZ, 0, bottomLidY, 0);
  }

  /**
   * Helper to set buffer points.
   */
  updateLineVertices(line, x1, y1, z1, x2, y2, z2) {
    const positions = line.geometry.attributes.position.array;
    positions[0] = x1;
    positions[1] = y1;
    positions[2] = z1;
    positions[3] = x2;
    positions[4] = y2;
    positions[5] = z2;
    line.geometry.attributes.position.needsUpdate = true;
  }

  /**
   * Dispose resources.
   */
  destroy() {
    this.group.traverse((child) => {
      if (child instanceof THREE.Line) {
        child.geometry.dispose();
      }
    });
    this.lineMaterial.dispose();
    this.model.group.remove(this.group);
  }
}
