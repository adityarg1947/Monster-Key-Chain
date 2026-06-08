import * as THREE from 'three';

/**
 * CalloutTargets class
 * Defines the 3D anchor point coordinates of the key beverage can keychain components.
 * Projects world vectors onto 2D screen coordinates, adjusting for displacements
 * like the can body floating forward on the Z-axis or keyrings sliding up on the Y-axis.
 */
export class CalloutTargets {
  constructor(model) {
    this.model = model;
    
    // 1. Initial local coordinates for anchors
    this.anchors = {
      ring:      new THREE.Vector3(0, 2.4, 0),      // top keyring
      connector: new THREE.Vector3(0, 1.8, 0),      // connector chain
      core:      new THREE.Vector3(0, 0, 0),        // can body center
      casing:    new THREE.Vector3(0, 0.65, 0.22)   // pull tab / lid area
    };
    
    // 2. Select matching HTML DOM nodes
    this.elements = {
      ring:      document.getElementById('callout-ring'),
      connector: document.getElementById('callout-connector'),
      core:      document.getElementById('callout-core'),
      casing:    document.getElementById('callout-casing')
    };
    
    this.tempVector = new THREE.Vector3();
  }

  /**
   * Projects 3D anchors to screen coordinates and updates CSS translate transforms.
   */
  update(camera, width, height) {
    if (!this.model || !this.model.group || !this.model.ringGroup || !this.model.chainGroup || !this.model.ropeGroup) {
      return;
    }
    Object.entries(this.anchors).forEach(([key, localPos]) => {
      const element = this.elements[key];
      if (!element) return;

      this.tempVector.copy(localPos);
      
      // Calculate real-time coordinates of separated parts
      if (key === 'ring') {
        // Ring moves up
        this.tempVector.y = 2.4 + this.model.ringGroup.position.y;
      } 
      else if (key === 'connector') {
        // Chain link moves up
        if (this.model.chainGroup.children.length === 3) {
          this.tempVector.y = this.model.chainGroup.children[1].position.y;
        } else {
          this.tempVector.y = 1.8 + this.model.chainGroup.position.y;
        }
      } 
      else if (key === 'core') {
        // Can body floats forward on Z
        if (this.model.canBody) {
          this.tempVector.copy(this.model.canBody.position);
        }
      }
      else if (key === 'casing') {
        // Casing/pull-tab moves up with top lid
        if (this.model.topLid) {
          this.tempVector.y = this.model.topLid.position.y;
        }
      }

      // Convert local coordinate to global world coordinate matrix
      this.tempVector.applyMatrix4(this.model.group.matrixWorld);

      // Project world vector onto normalized camera device coordinates [-1.0, 1.0]
      this.tempVector.project(camera);

      // Map NDC coordinates to screen pixel coordinates
      const screenX = (this.tempVector.x * 0.5 + 0.5) * width;
      const screenY = (-(this.tempVector.y * 0.5) + 0.5) * height;

      // Position the HTML node using GPU-accelerated CSS translation
      element.style.transform = `translate(-50%, -50%) translate3d(${screenX}px, ${screenY}px, 0)`;

      // Hide label if component rotates behind camera clipping frustum
      if (this.tempVector.z > 1) {
        element.style.opacity = '0';
        element.style.pointerEvents = 'none';
      } else {
        element.style.pointerEvents = 'auto';
      }
    });
  }
}
