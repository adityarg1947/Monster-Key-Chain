import gsap from 'gsap';
import { SceneManager } from './three/SceneManager.js';
import { ScrollAnimation } from './animations/ScrollAnimation.js';
import { ViewerControls } from './components/ViewerControls.js';
import { Loader } from './components/Loader.js';
import { TechnicalCallouts } from './sections/TechnicalCallouts.js';
import { CollectionShowcase } from './sections/CollectionShowcase.js';

window.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Canvas and SceneManager
  const canvasElement = document.querySelector('canvas.webgl');
  if (!canvasElement) {
    console.error('Three.js canvas not found. Critical initialization error.');
    return;
  }
  
  const sceneManager = new SceneManager(canvasElement);

  // 2. Initialize Scroll Coordination (Lenis + GSAP ScrollTrigger)
  const scrollAnimation = new ScrollAnimation(sceneManager);

  // 3. Initialize Interactive 360-degree controls
  const viewerControls = new ViewerControls(
    sceneManager,
    sceneManager.orbitSystem,
    sceneManager.viewerCamera,
    scrollAnimation
  );

  // 4. Initialize HUD Technical Callouts interaction
  const technicalCallouts = new TechnicalCallouts(
    sceneManager,
    sceneManager.orbitSystem,
    sceneManager.viewerCamera
  );

  // 5. Initialize COLLECTION SHOWCASE interactive section
  const collectionShowcase = new CollectionShowcase(
    sceneManager,
    scrollAnimation
  );

  // 5. Initialize Loader with Entry Callback
  new Loader(() => {
    // Page Entrance Animation (triggers right when loader completes)
    const entryTimeline = gsap.timeline();
    
    // Animate Tagline
    entryTimeline.fromTo('#hero .tagline',
      { opacity: 0, y: -20 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }
    );

    // Animate Main Title
    entryTimeline.fromTo('#hero .main-title',
      { opacity: 0, y: 30, letterSpacing: '-0.06em' },
      { opacity: 1, y: 0, letterSpacing: '-0.03em', duration: 1.2, ease: 'power3.out' },
      '-=0.5'
    );

    // Animate Scroll Indicator
    entryTimeline.fromTo('#hero .scroll-indicator',
      { opacity: 0, y: 15 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
      '-=0.4'
    );
    
    // Fade out static fallback image to reveal interactive 3D collection underneath
    entryTimeline.to('.hero-product-image, .glow-underlay',
      { opacity: 0, duration: 1.0, ease: 'power2.out' },
      '-=0.8'
    );
    
    // Subtle initial camera pan zoom in for dynamic entry to collection gallery
    gsap.fromTo(sceneManager.cameraSystem.params,
      { z: 10.0, fov: 55 },
      { z: 6.2, fov: 45, duration: 2.2, ease: 'power3.out' }
    );
  });
});
