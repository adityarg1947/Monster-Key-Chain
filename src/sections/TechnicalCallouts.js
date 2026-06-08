import { CalloutAnimation } from '../animations/CalloutAnimation.js';

/**
 * TechnicalCallouts class
 * Represents the overlay frontend HUD Callouts section.
 * Instantiates hover micro-interactions coordinating laser flashes,
 * materials adjustments, and camera pans on callout card hovers.
 */
export class TechnicalCallouts {
  constructor(sceneManager, orbitSystem, viewerCamera) {
    this.sceneManager = sceneManager;
    this.orbitSystem = orbitSystem;
    this.viewerCamera = viewerCamera;

    // Coordinate hover timelines
    this.animations = new CalloutAnimation(
      this.sceneManager,
      this.orbitSystem,
      this.viewerCamera
    );
  }
}
