import gsap from 'gsap';

/**
 * FormationAnimation class
 * Coordinates the visual entry reveal sequence: gathers particles, triggers a bloom light burst,
 * slides mechanical components in from remote coordinates, locks them with a subtle camera shake,
 * and starts standard rotation.
 */
export class FormationAnimation {
  constructor(sceneManager) {
    this.sceneManager = sceneManager;
    this.model = sceneManager.model;
    this.particles = sceneManager.particles;
    this.cameraSystem = sceneManager.cameraSystem;
    this.postProcessing = sceneManager.postProcessing;
  }

  /**
   * Triggers a standalone Awwwards-style dramatic reveal sequence.
   * Can be triggered programmatically on page entry or button request.
   */
  triggerReveal(duration = 2.5) {
    if (!this.model || !this.model.group) return;

    // Terminate existing tweens on components
    gsap.killTweensOf(this.model);
    gsap.killTweensOf(this.cameraSystem.params);
    if (this.postProcessing) {
      gsap.killTweensOf(this.postProcessing.bloomPass);
      gsap.killTweensOf(this.postProcessing.renderer);
    }

    // 1. Setup pre-reveal state: exploded parts dispersed widely, dark scene
    this.model.setExplodedView(2.5); // Components separated far away
    this.model.group.rotation.set(0, -Math.PI / 4, 0); // static initial angle
    
    // Dim lighting initially to build suspense
    this.sceneManager.keyLight.intensity = 0.2;
    this.sceneManager.accentLight.intensity = 1.0;
    
    // Disable parallax to hold view steady
    this.cameraSystem.setParallaxEnabled(false);

    // 2. Build Reveal GSAP Timeline
    const revealTimeline = gsap.timeline({
      onComplete: () => {
        this.cameraSystem.setParallaxEnabled(true);
        console.log('Product assembly reveal animation completed.');
      }
    });

    // Step A: Particles gather rapidly into core & light starts charging (0.0s -> 0.8s)
    revealTimeline.to(this.sceneManager, {
      scrollProgress: 0.28, // forces particles to condense via SceneManager setScrollProgress
      duration: 0.8,
      ease: 'power2.in'
    }, 0);

    // Step B: Energy Flash - Bloom flares and exposure surges (0.6s -> 0.9s)
    revealTimeline.to(this.postProcessing.bloomPass, {
      strength: 8.0,
      radius: 1.5,
      duration: 0.3,
      ease: 'sine.in'
    }, 0.5);

    revealTimeline.to(this.sceneManager.accentLight, {
      intensity: 15.0,
      duration: 0.3,
      ease: 'sine.in'
    }, 0.5);

    // Step C: Lock in assembly - Components fly together from offsets (0.8s -> 1.8s)
    revealTimeline.to(this.model, {
      explodedFactor: 0.0,
      duration: 1.2,
      ease: 'back.out(1.1)', // Subtle overshoot on locking
      onUpdate: () => {
        if (this.model.setExplodedView) {
          this.model.setExplodedView(this.model.explodedFactor);
        }
      }
    }, 0.8);

    // Slowly restore lighting to premium advertisement values
    revealTimeline.to(this.sceneManager.keyLight, {
      intensity: 3.5,
      duration: 1.0,
      ease: 'power2.out'
    }, 0.8);

    revealTimeline.to(this.sceneManager.accentLight, {
      intensity: 4.0,
      duration: 1.0,
      ease: 'power2.out'
    }, 0.8);

    // Step D: Flash Decay - Fade bloom back to normal glow (0.9s -> 1.8s)
    revealTimeline.to(this.postProcessing.bloomPass, {
      strength: 0.8,
      radius: 0.55,
      duration: 0.9,
      ease: 'sine.out'
    }, 0.8);

    // Step E: Mechanical Lock Shockwave - Camera shake (1.0s)
    // Simulates kinetic impact of components clicking into place
    const shakeParams = { offset: 0.1 };
    revealTimeline.to(shakeParams, {
      offset: 0,
      duration: 0.4,
      ease: 'power2.out',
      onUpdate: () => {
        // Displace lookAt coordinates briefly
        const shakeVal = (Math.random() - 0.5) * shakeParams.offset;
        this.cameraSystem.params.ty = shakeVal;
        this.cameraSystem.params.tx = shakeVal;
      },
      onComplete: () => {
        // Restore lookAt target center
        this.cameraSystem.params.tx = 0;
        this.cameraSystem.params.ty = 0;
      }
    }, 0.9);

    // Step F: Start Product rotation acceleration
    revealTimeline.fromTo(this.model.group.rotation,
      { y: -Math.PI / 4 },
      { y: Math.PI * 2 - Math.PI / 4, duration: 2.5, ease: 'power2.out' },
      0.8
    );
  }
}
