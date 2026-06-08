import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { createCameraTimeline } from './CameraTimeline.js';
import { createProductTimeline } from './ProductTimeline.js';
import { createExplodedTimeline } from './ExplodedTimeline.js';

// Register ScrollTrigger with GSAP core
gsap.registerPlugin(ScrollTrigger);

/**
 * ScrollAnimation class
 * Coordinates the master ScrollTrigger timeline scrubbing.
 * Synchronizes Lenis smooth scroll frames, CameraTimeline coordinate paths,
 * ProductTimeline mesh separations/rotations, and HTML overlay text opacity/movement steps.
 */
export class ScrollAnimation {
  constructor(sceneManager) {
    this.sceneManager = sceneManager;
    
    this.initLenis();
    this.initMasterTimeline();
    this.initExploreButton();
  }

  /**
   * Links Explore Collection button to smooth scroll.
   */
  initExploreButton() {
    const btnExplore = document.getElementById('btn-explore-collection');
    if (btnExplore && this.lenis) {
      btnExplore.addEventListener('click', () => {
        this.lenis.scrollTo('#core-formation', {
          duration: 1.5
        });
      });
    }
  }

  /**
   * Initializes Lenis smooth scrolling and links frame steps to GSAP.
   */
  initLenis() {
    this.lenis = new Lenis({
      duration: 1.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // smooth exponential scroll decay
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.5,
      infinite: false
    });

    // Synchronize ScrollTrigger with Lenis updates
    this.lenis.on('scroll', ScrollTrigger.update);

    // Feed ticks to GSAP ticker
    gsap.ticker.add((time) => {
      this.lenis.raf(time * 1000);
    });

    // Lag smoothing disabled to avoid jumps on heavy frames
    gsap.ticker.lagSmoothing(0);
  }

  /**
   * Configures the central timeline scrubbed by page scrolling.
   */
  initMasterTimeline() {
    // 1. Create master timeline linked to global scroll progress
    this.masterTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: 'body',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1.2, // Smooth damping scrub latency
        onUpdate: (self) => {
          // Send normalized scroll progression [0.0 - 1.0] to particle system
          this.sceneManager.setScrollProgress(self.progress);
        }
      }
    });

    // Set duration to 100 units so timeline timeline offsets correspond to scroll percentages!
    this.masterTimeline.duration(100);

    // 2. Build sub-timelines for Camera and Product animations
    const cameraTimeline = createCameraTimeline(
      this.sceneManager.cameraSystem,
      this.sceneManager.postProcessing,
      this.sceneManager
    );
    const productTimeline = createProductTimeline(this.sceneManager);
    const explodedTimeline = createExplodedTimeline(
      this.sceneManager.explodedSystem,
      this.sceneManager.calloutTargets
    );

    // Add timelines in parallel starting at time 0
    this.masterTimeline.add(cameraTimeline, 0);
    this.masterTimeline.add(productTimeline, 0);
    this.masterTimeline.add(explodedTimeline, 0);

    // 3. Set up synchronized transitions for HTML text sections
    this.initTextTransitions();
  }

  /**
   * Hooks HTML content-box opacities and displacements to the master timeline.
   */
  initTextTransitions() {
    // List of content overlay selectors to reset
    const textSelectors = [
      '#core-formation .content-box',
      '#camera-tunnel .tunnel-indicator',
      '#product-reveal .content-box',
      '#viewer-360 .viewer-ui',
      '#exploded-view .explosion-info',
      '#product-details .details-carousel',
      '#collection-showcase .collection-showcase-container',
      '#final-cta .cta-container'
    ];

    // Hide elements by default and slide them down
    textSelectors.forEach((selector) => {
      gsap.set(selector, { opacity: 0, y: 30 });
    });

    // SCENE 1: Hero elements and static image fade out (0% to 10%)
    this.masterTimeline.to('#hero .hero-left, #hero .scroll-indicator, .hero-product-image, .glow-underlay', {
      opacity: 0,
      y: -40,
      duration: 10,
      ease: 'power1.in'
    }, 0);

    // SCENE 1.5: Our Collection (10% to 20%)
    this.masterTimeline.to('#our-collection .collection-content-container', {
      opacity: 1,
      y: 0,
      duration: 4,
      ease: 'power2.out'
    }, 10);

    this.masterTimeline.to('#our-collection .collection-content-container', {
      opacity: 0,
      y: -30,
      duration: 4,
      ease: 'power2.in'
    }, 17);

    // Add parallax scroll displacement for our collection banner wrapper
    this.masterTimeline.fromTo('#our-collection .collection-parallax-wrapper', {
      y: '-8%'
    }, {
      y: '8%',
      duration: 10,
      ease: 'none'
    }, 10);

    // SCENE 2: Core Formation text (20% to 32%)
    this.masterTimeline.to('#core-formation .content-box', {
      opacity: 1,
      y: 0,
      duration: 4,
      ease: 'power2.out'
    }, 20);

    this.masterTimeline.to('#core-formation .content-box', {
      opacity: 0,
      y: -30,
      duration: 4,
      ease: 'power2.in'
    }, 28);

    // SCENE 3: Camera Tunnel text (32% - 44%)
    this.masterTimeline.to('#camera-tunnel .tunnel-indicator', {
      opacity: 1,
      y: 0,
      duration: 4,
      ease: 'power2.out'
    }, 32);

    this.masterTimeline.to('#camera-tunnel .tunnel-indicator', {
      opacity: 0,
      y: -30,
      duration: 4,
      ease: 'power2.in'
    }, 40);

    // SCENE 4: Product Reveal text (44% - 56%)
    this.masterTimeline.to('#product-reveal .content-box', {
      opacity: 1,
      y: 0,
      duration: 4,
      ease: 'power2.out'
    }, 44);

    this.masterTimeline.to('#product-reveal .content-box', {
      opacity: 0,
      y: -30,
      duration: 4,
      ease: 'power2.in'
    }, 52);

    // SCENE 5: 360 Viewer HUD elements (56% - 68%)
    this.masterTimeline.to('#viewer-360 .viewer-ui', {
      opacity: 1,
      y: 0,
      duration: 4,
      ease: 'power2.out'
    }, 56);

    this.masterTimeline.to('#viewer-360 .viewer-ui', {
      opacity: 0,
      y: -30,
      duration: 4,
      ease: 'power2.in'
    }, 64);

    // SCENE 6: Exploded View text (68% - 80%)
    this.masterTimeline.to('#exploded-view .explosion-info', {
      opacity: 1,
      y: 0,
      duration: 4,
      ease: 'power2.out'
    }, 68);

    this.masterTimeline.to('#exploded-view .explosion-info', {
      opacity: 0,
      y: -30,
      duration: 4,
      ease: 'power2.in'
    }, 76);

    // SCENE 7: Detail Focus text (80% - 88%)
    this.masterTimeline.to('#product-details .details-carousel', {
      opacity: 1,
      y: 0,
      duration: 4,
      ease: 'power2.out'
    }, 80);

    this.masterTimeline.to('#product-details .details-carousel', {
      opacity: 0,
      y: -30,
      duration: 3,
      ease: 'power2.in'
    }, 85);

    // SCENE 7.5: Collection Showcase (88% - 94%)
    this.masterTimeline.to('#collection-showcase .collection-showcase-container', {
      opacity: 1,
      y: 0,
      duration: 4,
      ease: 'power2.out'
    }, 88);

    this.masterTimeline.to('#collection-showcase .collection-showcase-container', {
      opacity: 0,
      y: -30,
      duration: 3,
      ease: 'power2.in'
    }, 94);

    // SCENE 8: Final CTA text (94% - 100%)
    this.masterTimeline.to('#final-cta .cta-container', {
      opacity: 1,
      y: 0,
      duration: 4,
      ease: 'power2.out'
    }, 94);
  }

  /**
   * Destroys timelines and Lenis instance.
   */
  destroy() {
    this.lenis.destroy();
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
  }
}
