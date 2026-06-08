import * as THREE from 'three';
import gsap from 'gsap';

/**
 * ViewerCamera class
 * Manages preset camera coordinate points (Front, Back, Left, Right, Top, Bottom).
 * Coordinates smooth camera transitions using GSAP and keeps the active
 * OrbitControls target in alignment during camera path updates.
 */
export class ViewerCamera {
  constructor(camera, orbitSystem) {
    this.camera = camera;
    this.orbitSystem = orbitSystem;

    // Define preset coordinate vectors and target coordinate focuses
    this.presets = {
      front:  { x: 0,    y: 0.4,  z: 4.8,  tx: 0, ty: 0,   tz: 0 },
      back:   { x: 0,    y: 0.4,  z: -4.8, tx: 0, ty: 0,   tz: 0 },
      left:   { x: -4.8, y: 0.4,  z: 0,    tx: 0, ty: 0,   tz: 0 },
      right:  { x: 4.8,  y: 0.4,  z: 0,    tx: 0, ty: 0,   tz: 0 },
      top:    { x: 0,    y: 4.8,  z: 0.05, tx: 0, ty: 0,   tz: 0 }, // tiny Z offset prevents matrix gimbal lock snap
      bottom: { x: 0,    y: -4.8, z: 0.05, tx: 0, ty: 0,   tz: 0 }
    };
  }

  /**
   * Animates the camera position and orbit target to a preset location smoothly using GSAP.
   * Updates OrbitControls on every frame to maintain matrix integrity.
   */
  transitionToPreset(presetName, duration = 1.4, ease = 'power3.out') {
    const target = this.presets[presetName];
    if (!target) {
      console.warn(`Camera preset "${presetName}" not found.`);
      return;
    }

    const controls = this.orbitSystem.controls;

    // Terminate any active camera translation tweens
    gsap.killTweensOf(this.camera.position);
    gsap.killTweensOf(controls.target);

    const timeline = gsap.timeline({
      onUpdate: () => {
        // Force controls update on frame tick to recalculate camera lookAt matrices
        controls.update();
      }
    });

    // Tween Camera Cartesian coordinates
    timeline.to(this.camera.position, {
      x: target.x,
      y: target.y,
      z: target.z,
      duration: duration,
      ease: ease
    }, 0);

    // Tween Orbit Target focus points
    timeline.to(controls.target, {
      x: target.tx,
      y: target.ty,
      z: target.tz,
      duration: duration,
      ease: ease
    }, 0);

    return timeline;
  }
}
