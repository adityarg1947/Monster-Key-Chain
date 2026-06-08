import * as THREE from 'three';
import { lerp } from '../utils/MathHelpers.js';

/**
 * InteractionManager class
 * Coordinates user mouse/touch input. Computes dynamic key light coordinate shifts
 * to generate moving specular reflections, handles auto-rotation triggers on idle states,
 * and overlays subtle cursor-driven target parallax onto active OrbitControls.
 */
export class InteractionManager {
  constructor(sceneManager, orbitSystem) {
    this.sceneManager = sceneManager;
    this.orbitSystem = orbitSystem;
    this.controls = orbitSystem.controls;
    
    // Core parameters
    this.idleTimeout = 4.5; // Seconds of inactivity before auto-rotate triggers
    this.lastInteractionTime = 0;
    
    // Easing inputs
    this.mouse = {
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0
    };
    this.inertiaDamping = 0.05;

    // Light default coordinates
    this.baseLightPos = new THREE.Vector3(5, 8, 5);
    
    this.initEvents();
  }

  /**
   * Monitor user mouse drag, touch, and scroll inputs to track activity states.
   */
  initEvents() {
    const resetIdleTimer = () => {
      this.lastInteractionTime = this.sceneManager.time;
      
      // Stop automatic rotation immediately on interaction
      if (this.controls.autoRotate) {
        this.controls.autoRotate = false;
      }
    };

    // DOM events that indicate user activity
    const dom = this.sceneManager.canvas;
    dom.addEventListener('mousedown', resetIdleTimer);
    dom.addEventListener('mousemove', (e) => {
      resetIdleTimer();
      // Calculate normalized mouse positions [-1.0, 1.0]
      this.mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    // Touch events for mobile
    dom.addEventListener('touchstart', resetIdleTimer);
    dom.addEventListener('touchmove', resetIdleTimer);
    
    // Scroll zoom interactions
    dom.addEventListener('wheel', resetIdleTimer);

    // Set up auto-rotate settings on OrbitControls
    this.controls.autoRotateSpeed = 1.2; // Slow premium rotation speed
  }

  /**
   * Update loops. Calculates cursor damping, adjusts lights, shifts parallax targets,
   * and monitors idle rotation timers.
   */
  update(time) {
    // 1. Damping interpolation for cursor inputs
    this.mouse.x = lerp(this.mouse.x, this.mouse.targetX, this.inertiaDamping);
    this.mouse.y = lerp(this.mouse.y, this.mouse.targetY, this.inertiaDamping);

    // 2. Dynamic lighting reaction: Displace key light position to shift metallic specular highlights
    if (this.sceneManager.keyLight) {
      this.sceneManager.keyLight.position.x = this.baseLightPos.x + this.mouse.x * 2.0;
      this.sceneManager.keyLight.position.z = this.baseLightPos.z - this.mouse.y * 2.0;
    }

    // 3. Render Parallax Target: Shifts lookAt target vector based on cursor coordinates
    if (this.orbitSystem.isActive) {
      // Displace target slightly to create premium depth parallax feeling
      const parallaxX = this.mouse.x * 0.18;
      const parallaxY = this.mouse.y * 0.18;
      
      // Add drift offset to core coordinates (0,0,0)
      this.orbitSystem.setTarget(parallaxX, parallaxY, 0);

      // 4. Idle rotation monitor: Start rotation if inactivity threshold reached
      if (time - this.lastInteractionTime > this.idleTimeout) {
        if (!this.controls.autoRotate) {
          this.controls.autoRotate = true;
        }
      }
    }
  }
}
