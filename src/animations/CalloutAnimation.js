import gsap from 'gsap';
import * as THREE from 'three';

/**
 * CalloutAnimation class
 * Handles hover micro-interactions on the floating HTML callout labels.
 * When hovered:
 * - Camera performs a gentle zoom-focus on the targeted component.
 * - Targeted component brightens (emissives and PBR highlights increase).
 * - Other parts dim slightly.
 * - PointLight triggers an energy pulse wave.
 */
export class CalloutAnimation {
  constructor(sceneManager, orbitSystem, viewerCamera) {
    this.sceneManager = sceneManager;
    this.orbitSystem = orbitSystem;
    this.viewerCamera = viewerCamera;
    
    this.initHoverEvents();
  }

  /**
   * Selects HTML callout nodes and attaches mouseenter/mouseleave handlers.
   */
  initHoverEvents() {
    const targets = {
      ring:      document.getElementById('callout-ring'),
      connector: document.getElementById('callout-connector'),
      core:      document.getElementById('callout-core'),
      casing:    document.getElementById('callout-casing')
    };

    Object.entries(targets).forEach(([key, element]) => {
      if (!element) return;

      // Mouse Hover Enter
      element.addEventListener('mouseenter', () => this.handleHoverEnter(key, element));

      // Mouse Hover Leave
      element.addEventListener('mouseleave', () => this.handleHoverLeave(key, element));
    });
  }

  /**
   * Activates component highlight, gentle camera zoom, and energy pulses.
   */
  handleHoverEnter(partName, htmlElement) {
    // Micro interactions are only enabled during interactive 360 mode when OrbitControls is active
    if (!this.orbitSystem.isActive) return;

    // Add CSS hover active class
    htmlElement.classList.add('hover-active');

    const model = this.sceneManager.model;
    const controls = this.orbitSystem.controls;
    if (!model) return;

    // 1. Calculate a subtle target zoom offset coordinate close to the part
    let targetY = 0;
    let zoomRadius = 4.2; // slightly closer than normal 4.8

    if (partName === 'ring') targetY = 1.9;
    if (partName === 'connector') targetY = 1.35;
    if (partName === 'core') targetY = 0.0;
    if (partName === 'casing') targetY = 0.35;

    // Gentle camera drift towards hovered item
    gsap.killTweensOf(controls.target);
    gsap.to(controls.target, {
      x: 0,
      y: targetY,
      z: 0,
      duration: 0.6,
      ease: 'power2.out'
    });

    // 2. Brighten hovered mesh and dim others
    const groups = {
      ring: model.ringGroup,
      connector: model.chainGroup,
      core: model.bodyGroup,
      casing: model.bodyGroup
    };

    Object.entries(groups).forEach(([name, group]) => {
      if (!group) return;
      const isTarget = name === partName;

      group.traverse((child) => {
        if (child.isMesh && child.material) {
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          
          mats.forEach((mat) => {
            // Store original values
            if (child.userData.origEnvIntensity === undefined) {
              child.userData.origEnvIntensity = mat.envMapIntensity !== undefined ? mat.envMapIntensity : 1.2;
            }

            if (mat.envMapIntensity !== undefined) {
              gsap.to(mat, {
                envMapIntensity: isTarget ? 3.0 : 0.3, // Brighten target, dim rest
                duration: 0.5,
                ease: 'power2.out'
              });
            }

            // Energy Core specific: Pulse shader frequency on hover
            if (partName === 'core' && name === 'core' && mat.uniforms && mat.uniforms.uPulseIntensity) {
              gsap.to(mat.uniforms.uPulseIntensity, {
                value: 2.2, // core flash pulse
                duration: 0.4,
                yoyo: true,
                repeat: 1
              });
            }
          });
        }
      });
    });

    // 3. Trigger energy pulse via core point light flare
    if (this.sceneManager.accentLight) {
      gsap.to(this.sceneManager.accentLight, {
        intensity: partName === 'core' ? 9.0 : 5.5,
        duration: 0.3,
        yoyo: true,
        repeat: 1
      });
    }
  }

  /**
   * Restores original camera zoom and material properties on hover exit.
   */
  handleHoverLeave(partName, htmlElement) {
    if (!this.orbitSystem.isActive) return;

    htmlElement.classList.remove('hover-active');

    const model = this.sceneManager.model;
    const controls = this.orbitSystem.controls;
    if (!model) return;

    // Reset camera target position
    gsap.killTweensOf(controls.target);
    gsap.to(controls.target, {
      x: 0,
      y: 0,
      z: 0,
      duration: 0.6,
      ease: 'power2.out'
    });

    // Restore original material attributes
    const groups = [model.ringGroup, model.chainGroup, model.ropeGroup, model.bodyGroup];
    groups.forEach((group) => {
      if (!group) return;
      group.traverse((child) => {
        if (child.isMesh && child.material) {
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          
          mats.forEach((mat) => {
            if (mat.envMapIntensity !== undefined && child.userData.origEnvIntensity !== undefined) {
              gsap.to(mat, {
                envMapIntensity: child.userData.origEnvIntensity,
                duration: 0.5,
                ease: 'power2.out'
              });
            }
          });
        }
      });
    });

    // Restore point light intensity
    if (this.sceneManager.accentLight) {
      gsap.to(this.sceneManager.accentLight, {
        intensity: 4.0,
        duration: 0.5,
        ease: 'power2.out'
      });
    }
  }
}
