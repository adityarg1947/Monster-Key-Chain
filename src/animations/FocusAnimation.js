import gsap from 'gsap';
import * as THREE from 'three';

/**
 * FocusAnimation class
 * Coordinates visual styling changes during Focus Mode.
 * Tweens camera position vectors and Orbit targets close to selected parts,
 * dims environment maps and PBR colors on non-focused components,
 * and boots light/bloom contributions on selected items to draw attention.
 */
export class FocusAnimation {
  /**
   * Focus camera coordinates and apply material dim filters on target sections.
   */
  static animateFocus(partName, sceneManager, orbitSystem, viewerCamera) {
    const controls = orbitSystem.controls;
    const model = sceneManager.model;
    if (!model) return;

    // 1. Define target coordinates and focus points based on component selection
    let camPos, targetPos;
    
    switch (partName) {
      case 'ring':
        // Zoom on top hanger ring
        camPos = { x: 0.35, y: 1.85, z: 1.65 };
        targetPos = { x: 0, y: 2.0, z: 0 };
        break;
      case 'connector':
        // Zoom on swivel links
        camPos = { x: -0.45, y: 1.35, z: 1.45 };
        targetPos = { x: 0, y: 1.35, z: 0 };
        break;
      case 'core':
      default:
        // Zoom on central reactor
        camPos = { x: 0.55, y: 0.0, z: 1.25 };
        targetPos = { x: 0, y: 0, z: 0 };
        break;
    }

    // 2. Animate camera and lookAt target points smoothly
    gsap.killTweensOf(sceneManager.camera.position);
    gsap.killTweensOf(controls.target);

    const timeline = gsap.timeline({
      onUpdate: () => {
        controls.update();
      }
    });

    timeline.to(sceneManager.camera.position, {
      x: camPos.x,
      y: camPos.y,
      z: camPos.z,
      duration: 1.2,
      ease: 'power3.out'
    }, 0);

    timeline.to(controls.target, {
      x: targetPos.x,
      y: targetPos.y,
      z: targetPos.z,
      duration: 1.2,
      ease: 'power3.out'
    }, 0);

    // 3. Highlight selected mesh group and dim other parts
    // We achieve this by lowering PBR envMapIntensity and diffuse color channels
    const targetGroups = {
      ring: model.ringGroup,
      connector: model.chainGroup,
      rope: model.ropeGroup,
      body: model.bodyGroup
    };

    Object.entries(targetGroups).forEach(([name, group]) => {
      if (!group) return;
      const isTarget = name === partName;
      
      group.traverse((child) => {
        if (child.isMesh && child.material) {
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          
          mats.forEach((mat) => {
            // Tween PBR reflection brightness
            if (mat.envMapIntensity !== undefined) {
              if (child.userData.originalEnvMapIntensity === undefined) {
                child.userData.originalEnvMapIntensity = mat.envMapIntensity;
              }
              gsap.to(mat, {
                envMapIntensity: isTarget ? child.userData.originalEnvMapIntensity : 0.05, // dim non-targets
                duration: 0.8,
                ease: 'power2.out'
              });
            }

            // Mute color channels of non-targets to draw attention to focus
            if (mat.color && !isTarget) {
              // Store original color on user data if not already present
              if (!child.userData.originalColor) {
                child.userData.originalColor = mat.color.getHex();
              }
              
              gsap.to(mat.color, {
                r: 0.02,
                g: 0.03,
                b: 0.02,
                duration: 0.8,
                ease: 'power2.out'
              });
            } else if (mat.color && isTarget && child.userData.originalColor) {
              // Restore color to focus target if previously dimmed
              const orig = new THREE.Color(child.userData.originalColor);
              gsap.to(mat.color, {
                r: orig.r,
                g: orig.g,
                b: orig.b,
                duration: 0.8,
                ease: 'power2.out'
              });
            }
            
            // Core specific: Boost shader glow if can focused
            if (partName === 'core' && name === 'body' && mat.userData.uniforms && mat.userData.uniforms.uPulseIntensity) {
              gsap.to(mat.userData.uniforms.uPulseIntensity, {
                value: 1.8,
                duration: 0.8,
                ease: 'power2.out'
              });
            }
          });
        }
      });
    });

    // 4. Boost inner PointLight color to focus on core reactor highlights
    if (sceneManager.accentLight) {
      gsap.to(sceneManager.accentLight, {
        intensity: partName === 'core' ? 3.0 : 1.2,
        duration: 0.8,
        ease: 'power2.out'
      });
    }
  }

  /**
   * Restores camera zoom and material properties back to neutral states.
   */
  static resetFocus(sceneManager, orbitSystem, viewerCamera) {
    const controls = orbitSystem.controls;
    const model = sceneManager.model;
    if (!model) return;

    // 1. Reset camera coordinates back to Viewer Front preset
    viewerCamera.transitionToPreset('front', 1.2, 'power2.out');

    // 2. Restore all material colors and PBR highlights
    const targetGroups = [model.ringGroup, model.chainGroup, model.ropeGroup, model.bodyGroup];

    targetGroups.forEach((group) => {
      group.traverse((child) => {
        if (child.isMesh && child.material) {
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          
          mats.forEach((mat) => {
            // Restore default environment map intensities
            if (mat.envMapIntensity !== undefined && child.userData.originalEnvMapIntensity !== undefined) {
              gsap.to(mat, {
                envMapIntensity: child.userData.originalEnvMapIntensity,
                duration: 0.8,
                ease: 'power2.out'
              });
            }

            // Restore original base diffuse color channels
            if (mat.color && child.userData.originalColor !== undefined) {
              const orig = new THREE.Color(child.userData.originalColor);
              gsap.to(mat.color, {
                r: orig.r,
                g: orig.g,
                b: orig.b,
                duration: 0.8,
                ease: 'power2.out',
                onComplete: () => {
                  mat.color.setHex(child.userData.originalColor);
                }
              });
            }
          });
        }
      });
    });

    // 3. Return reactor light levels to default
    if (sceneManager.accentLight) {
      gsap.to(sceneManager.accentLight, {
        intensity: 4.0,
        duration: 0.8,
        ease: 'power2.out'
      });
    }
  }
}
