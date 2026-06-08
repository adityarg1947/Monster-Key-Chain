import gsap from 'gsap';

/**
 * ViewerControls class
 * Integrates the HTML frontend overlay button clicks with the active
 * 3D ViewerCamera presets and ScrollTimeline offsets.
 */
export class ViewerControls {
  constructor(sceneManager, orbitSystem, viewerCamera, scrollAnimation) {
    this.sceneManager = sceneManager;
    this.orbitSystem = orbitSystem;
    this.viewerCamera = viewerCamera;
    this.scrollAnimation = scrollAnimation;

    this.initPresetButtons();
    this.setupTimelineTriggers();
  }

  /**
   * Toggles OrbitControls and InteractionManager active states
   * depending on the scroll position.
   */
  setupTimelineTriggers() {
    // Monitor scroll coordinates to enable orbital control only inside 360 viewer (60% to 75%)
    gsap.registerPlugin(window.ScrollTrigger);

    gsap.timeline({
      scrollTrigger: {
        trigger: '#viewer-360',
        start: 'top center',
        end: 'bottom center',
        onEnter: () => this.setViewerActive(true),
        onEnterBack: () => this.setViewerActive(true),
        onLeave: () => this.setViewerActive(false),
        onLeaveBack: () => this.setViewerActive(false),
      }
    });
  }

  /**
   * Activates or deactivates OrbitControls and resets camera transitions.
   */
  setViewerActive(active) {
    if (active) {
      console.log('Entering 360 Viewer Zone. Transferring camera authority to OrbitControls.');
      // Enable controls with active camera values
      this.orbitSystem.enable(new THREE.Vector3(0, 0.4, 0));
      if (this.sceneManager.interactionManager) {
        this.sceneManager.interactionManager.lastInteractionTime = this.sceneManager.time;
      }
    } else {
      console.log('Exiting 360 Viewer Zone. Disabling OrbitControls.');
      this.orbitSystem.disable();
      
      // Reset auto-rotate and target focus
      this.orbitSystem.controls.autoRotate = false;
      this.orbitSystem.setTarget(0, 0, 0);

      // Force Focus Controls to reset highlights if clicked away
      if (this.sceneManager.focusControls) {
        this.sceneManager.focusControls.resetFocus();
      }
    }
  }

  /**
   * Binds HTML view shortcut button click listeners.
   */
  initPresetButtons() {
    const btnFront = document.getElementById('btn-front');
    const btnBack = document.getElementById('btn-back');
    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');
    const btnTop = document.getElementById('btn-top');
    const btnBottom = document.getElementById('btn-bottom');
    const btnExploded = document.getElementById('btn-exploded');

    const buttons = [btnFront, btnBack, btnLeft, btnRight, btnTop, btnBottom];
    const updateActiveState = (activeBtn) => {
      buttons.forEach(btn => btn && btn.classList.remove('active'));
      if (activeBtn) activeBtn.classList.add('active');
    };

    // Front View
    if (btnFront) {
      btnFront.addEventListener('click', () => {
        updateActiveState(btnFront);
        this.viewerCamera.transitionToPreset('front');
      });
    }

    // Back View (Defensive binding if added to HTML later)
    if (btnBack) {
      btnBack.addEventListener('click', () => {
        updateActiveState(btnBack);
        this.viewerCamera.transitionToPreset('back');
      });
    }

    // Left View
    if (btnLeft) {
      btnLeft.addEventListener('click', () => {
        updateActiveState(btnLeft);
        this.viewerCamera.transitionToPreset('left');
      });
    }

    // Right View
    if (btnRight) {
      btnRight.addEventListener('click', () => {
        updateActiveState(btnRight);
        this.viewerCamera.transitionToPreset('right');
      });
    }

    // Top View
    if (btnTop) {
      btnTop.addEventListener('click', () => {
        updateActiveState(btnTop);
        this.viewerCamera.transitionToPreset('top');
      });
    }

    // Bottom View
    if (btnBottom) {
      btnBottom.addEventListener('click', () => {
        updateActiveState(btnBottom);
        this.viewerCamera.transitionToPreset('bottom');
      });
    }

    // Exploded View Timeline Jump
    if (btnExploded) {
      btnExploded.addEventListener('click', () => {
        if (this.scrollAnimation && this.scrollAnimation.lenis) {
          // Scroll smoothly to Exploded View section using Lenis scrolling
          this.scrollAnimation.lenis.scrollTo('#exploded-view', {
            offset: 0,
            duration: 1.5
          });
        }
      });
    }
  }
}
import * as THREE from 'three'; // Import Three at file end to prevent script reference errors inside setViewerActive
