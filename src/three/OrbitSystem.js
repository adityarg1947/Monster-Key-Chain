import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/**
 * OrbitSystem class
 * Wraps OrbitControls to allow full 360-degree orbital drag rotation,
 * mobile pinch-to-zoom, and inertial damping. Manages interaction limits
 * and toggles control authority to prevent conflicts with ScrollTrigger.
 */
export class OrbitSystem {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;
    this.isActive = false;

    this.initControls();
  }

  /**
   * Initializes OrbitControls with premium performance settings.
   */
  initControls() {
    this.controls = new OrbitControls(this.camera, this.domElement);
    
    // Enable physics damping (inertia momentum)
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05; // smooth drag lag
    
    // Limits
    this.controls.enablePan = false;       // Disable panning (keep centered on product)
    this.controls.enableZoom = true;       // Enable wheel & pinch zoom
    this.controls.minDistance = 2.5;       // Prevent camera clipping inside model
    this.controls.maxDistance = 8.0;       // Prevent camera wandering too far
    this.controls.rotateSpeed = 0.85;      // Responsive rotation scale
    
    // Restrict vertical rotation angle to prevent flipping upside down [~ -75deg, 75deg]
    const maxVertAngle = Math.PI / 2.3;
    this.controls.minPolarAngle = Math.PI / 2 - maxVertAngle;
    this.controls.maxPolarAngle = Math.PI / 2 + maxVertAngle;
    
    // Deactivate by default
    this.controls.enabled = false;
  }

  /**
   * Transfers camera control authority to OrbitControls.
   * Syncs control targets to current camera position.
   */
  enable(currentTarget = new THREE.Vector3(0, 0, 0)) {
    this.isActive = true;
    this.controls.enabled = true;
    this.controls.target.copy(currentTarget);
    this.controls.update();
  }

  /**
   * Deactivates controls. Camera control returns to GSAP ScrollTrigger.
   */
  disable() {
    this.isActive = false;
    this.controls.enabled = false;
  }

  /**
   * Updates camera matrices. Called every frame in the tick loop.
   */
  update() {
    if (this.isActive && this.controls.enabled) {
      this.controls.update();
    }
  }

  /**
   * Adjust target coordinates.
   */
  setTarget(x, y, z) {
    this.controls.target.set(x, y, z);
    this.controls.update();
  }

  /**
   * Clean up resources on disposal.
   */
  destroy() {
    if (this.controls) {
      this.controls.dispose();
    }
  }
}
