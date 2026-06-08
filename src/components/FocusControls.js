import * as THREE from 'three';
import { FocusAnimation } from '../animations/FocusAnimation.js';

/**
 * FocusControls class
 * Listens for mouse click events on the WebGL canvas.
 * Utilizes THREE.Raycaster to determine if the user clicked on the Hanger Ring,
 * Connector, or Plasma Core, triggering macro camera zooms and component highlights.
 */
export class FocusControls {
  constructor(sceneManager, orbitSystem, viewerCamera) {
    this.sceneManager = sceneManager;
    this.orbitSystem = orbitSystem;
    this.viewerCamera = viewerCamera;
    
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.activeFocusPart = null; // Track currently focused item

    this.initEvents();
  }

  /**
   * Bind click listeners to the canvas element.
   */
  initEvents() {
    const canvas = this.sceneManager.canvas;
    canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
  }

  /**
   * Converts mouse coordinates to WebGL NDC and runs Raycast intersection.
   */
  handleCanvasClick(event) {
    // Raycasting is only active during the 360 viewer section when OrbitControls is enabled
    if (!this.orbitSystem.isActive) return;

    // 1. Calculate normalized mouse positions [-1.0, 1.0] relative to canvas client bounds
    const rect = this.sceneManager.canvas.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // 2. Set raycaster origin and directions
    this.raycaster.setFromCamera(this.mouse, this.sceneManager.camera);

    // 3. Collect all meshes inside the keychain model container group
    const model = this.sceneManager.model;
    if (!model || !model.group) return;

    const intersects = this.raycaster.intersectObjects(model.group.children, true);

    if (intersects.length > 0) {
      // 4. Trace the intersected object up to find its layout parent group
      const hitObject = intersects[0].object;
      const partName = this.identifyGroupPart(hitObject, model);

      if (partName) {
        this.focusOnPart(partName);
      } else {
        // Clicked on a miscellaneous casing part, reset focus
        this.resetFocus();
      }
    } else {
      // Clicked on empty void background, reset focus
      this.resetFocus();
    }
  }

  /**
   * Traces an intersected mesh up its node tree to match Ring, Connector, or Core groups.
   */
  identifyGroupPart(object, model) {
    let current = object;
    
    // Traverse parent nodes
    while (current && current !== model.group) {
      if (current === model.ringGroup) return 'ring';
      if (current === model.chainGroup) return 'connector';
      if (current === model.bodyGroup) return 'core';
      
      // Secondary name-based check
      const name = current.name.toLowerCase();
      if (name.includes('ring') || name.includes('loop')) return 'ring';
      if (name.includes('connector') || name.includes('link')) return 'connector';
      if (name.includes('core') || name.includes('plasma') || name.includes('glass')) return 'core';
      
      current = current.parent;
    }
    return null;
  }

  /**
   * Triggers camera zoom and shader highlights for selected parts.
   */
  focusOnPart(partName) {
    if (this.activeFocusPart === partName) return; // Already focused
    
    this.activeFocusPart = partName;
    
    // Run the GSAP focus camera sweeps and mesh dim filters
    FocusAnimation.animateFocus(
      partName,
      this.sceneManager,
      this.orbitSystem,
      this.viewerCamera
    );
  }

  /**
   * Returns camera coordinates and material opacities back to neutral states.
   */
  resetFocus() {
    if (!this.activeFocusPart) return; // Already neutral
    
    this.activeFocusPart = null;
    
    // Reset materials and return camera to Front preset
    FocusAnimation.resetFocus(
      this.sceneManager,
      this.orbitSystem,
      this.viewerCamera
    );
  }
}
