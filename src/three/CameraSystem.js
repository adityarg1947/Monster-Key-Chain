import * as THREE from 'three';
import gsap from 'gsap';
import { lerp } from '../utils/MathHelpers.js';

/**
 * CameraSystem class
 * Manages the perspective camera, manages pre-defined camera states for different scroll sections,
 * handles mouse parallax with inertia, and provides GSAP transition capabilities.
 */
export class CameraSystem {
  constructor(scene, width, height) {
    this.scene = scene;
    
    // 1. Initialize Perspective Camera
    // Field of view: 45deg, Near clipping plane: 0.1, Far clipping plane: 100
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    
    // 2. Define standard parameters that GSAP can target directly
    this.params = {
      x: 0,
      y: 0,
      z: 7,
      tx: 0,
      ty: 0,
      tz: 0,
      fov: 45
    };

    // 3. Setup Camera States (Presets)
    this.states = {
      hero: { x: 0, y: 0, z: 7, tx: 0, ty: 0, tz: 0, fov: 45 },
      core: { x: 0, y: 0, z: 1.6, tx: 0, ty: 0, tz: 0, fov: 30 },
      tunnel: { x: 0, y: 0, z: -2.2, tx: 0, ty: 0, tz: 0, fov: 40 },
      reveal: { x: 0, y: 0.4, z: 4.5, tx: 0, ty: 0, tz: 0, fov: 45 },
      viewer: { x: 0, y: 0.4, z: 4.5, tx: 0, ty: 0, tz: 0, fov: 45 },
      exploded: { x: -1.8, y: 0.8, z: 3.8, tx: 0, ty: 0.2, tz: 0, fov: 45 },
      details: { x: -0.6, y: 0.6, z: 1.6, tx: 0, ty: 0, tz: 0, fov: 45 },
      cta: { x: 0, y: -1.2, z: 4.0, tx: 0, ty: 0.2, tz: 0, fov: 48 }
    };

    // 4. Parallax configuration
    this.mouse = {
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0
    };
    
    this.parallaxStrength = 0.35;
    this.parallaxEnabled = true;
    this.inertiaDamping = 0.05; // lower values = smoother, higher = faster response

    this.initCamera();
    this.setupMouseEvents();
  }

  /**
   * Position the camera and create lookAt target vector.
   */
  initCamera() {
    this.camera.position.set(this.params.x, this.params.y, this.params.z);
    this.target = new THREE.Vector3(this.params.tx, this.params.ty, this.params.tz);
    this.camera.lookAt(this.target);
  }

  /**
   * Listen for mouse movement to calculate normalized values for parallax.
   */
  setupMouseEvents() {
    window.addEventListener('mousemove', (e) => {
      // Scale mouse position to range [-1.0, 1.0]
      this.mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
    });
  }

  /**
   * Adjust aspect ratio and projection matrix on window resize.
   */
  resize(width, height) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  /**
   * Toggle parallax interactions on/off during animations.
   */
  setParallaxEnabled(enabled) {
    this.parallaxEnabled = enabled;
    if (!enabled) {
      this.mouse.targetX = 0;
      this.mouse.targetY = 0;
    }
  }

  /**
   * Dynamically transition camera parameters to a specific state using GSAP.
   * Useful for UI buttons and programmatic camera jumps.
   */
  transitionToState(stateName, duration = 1.5, ease = 'power2.out') {
    const targetState = this.states[stateName];
    if (!targetState) {
      console.warn(`Camera state "${stateName}" not found.`);
      return null;
    }

    // Terminate any active camera tweens
    gsap.killTweensOf(this.params);

    return gsap.to(this.params, {
      x: targetState.x,
      y: targetState.y,
      z: targetState.z,
      tx: targetState.tx,
      ty: targetState.ty,
      tz: targetState.tz,
      fov: targetState.fov,
      duration: duration,
      ease: ease
    });
  }

  /**
   * Frame update loop. Interpolates parameters, applies mouse parallax with damping,
   * updates the FOV matrix, and makes the camera look at the moving target coordinate.
   */
  update(deltaTime) {
    // 1. Apply damping to mouse inputs for realistic lag (inertia)
    this.mouse.x = lerp(this.mouse.x, this.mouse.targetX, this.inertiaDamping);
    this.mouse.y = lerp(this.mouse.y, this.mouse.targetY, this.inertiaDamping);

    // 2. Animate camera Field of View dynamically if parameters changed
    if (this.camera.fov !== this.params.fov) {
      this.camera.fov = this.params.fov;
      this.camera.updateProjectionMatrix();
    }

    // 3. Compute target coordinates with parallax overlay offsets
    let targetX = this.params.x;
    let targetY = this.params.y;
    let targetZ = this.params.z;

    if (this.parallaxEnabled) {
      // Horizontal and vertical offset shifts
      targetX += this.mouse.x * this.parallaxStrength;
      targetY += this.mouse.y * this.parallaxStrength;
    }

    // 4. Update camera position vectors
    this.camera.position.set(targetX, targetY, targetZ);

    // 5. Update lookAt target vector coordinate
    this.target.set(this.params.tx, this.params.ty, this.params.tz);
    
    // 6. Force camera to focus on lookAt target
    this.camera.lookAt(this.target);
  }
}
