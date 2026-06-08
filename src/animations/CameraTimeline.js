import gsap from 'gsap';

/**
 * Creates the camera and post-processing scroll timeline.
 * Maps camera positions, targets, FOV, and postprocessing exposure/bloom
 * to scroll percentage units (0 to 100).
 * 
 * Flow:
 * - Scene 1 (0% - 15%): Hero Collection framing.
 * - Scene 2 (15% - 30%): Transitioning to Monster Energy focus.
 * - Scene 3 (30% - 45%): Dual macro close-ups (first can body droplets, then top keyring & chain links).
 * - Scene 4 (45% - 60%): Low-angle hero reveal looking up.
 * - Scene 5 (60% - 75%): Interactive 360 viewer framing.
 * - Scene 6 (75% - 90%): High-angle exploded view framing.
 * - Scene 7 (90% - 100%): Details scans.
 * - Scene 8 (97% - 100%): Aspirational final CTA low-angle.
 */
export function createCameraTimeline(cameraSystem, postProcessing, sceneManager) {
  const cameraParams = cameraSystem.params;
  const tl = gsap.timeline();

  // SCENE 1: HERO GALLERY SHOWCASE (0% - 15%)
  // Camera frames the floating gallery of 7 keychains
  tl.set(cameraParams, {
    x: 0,
    y: 0.2,
    z: 6.2,
    tx: 0.0,
    ty: 0.2,
    tz: 0,
    fov: 45
  }, 0);

  // Soft atmospheric bloom (fits within the 5% hierarchy)
  tl.to(postProcessing.bloomPass, {
    strength: 0.2,
    radius: 0.5,
    duration: 15,
    ease: 'power1.inOut'
  }, 0);


  // SCENE 2: MONSTER CAN FOCUS ZOOM (15% - 30%)
  // Camera pushes in slightly as the other 6 cans scatter away
  tl.to(cameraParams, {
    x: 0.0,
    y: 0.4,
    z: 4.8,
    tx: 0.0,
    ty: 0.4,
    tz: 0,
    fov: 45,
    duration: 15,
    ease: 'power2.inOut',
    onStart: () => {
      cameraSystem.setParallaxEnabled(false);
    }
  }, 15);


  // SCENE 3: DUAL MACRO CLOSE-UPS (30% - 45%)
  
  // 3A: Can Body Macro (30% - 37.5%)
  // Focuses extremely close to the side of the can to show condensation drops and beveled logo edges
  tl.to(cameraParams, {
    x: 0.45,
    y: 0.0,
    z: 1.15,
    tx: 0.0,
    ty: 0.0,
    tz: 0.0,
    fov: 32,
    duration: 7.5,
    ease: 'power2.inOut'
  }, 30);

  // 3B: Keyring and Swivel Links Macro (37.5% - 45%)
  // Sweeps up to show the anisotropic brushed steel keyring and reflective chrome link details
  tl.to(cameraParams, {
    x: -0.38,
    y: 1.85,
    z: 1.35,
    tx: 0.0,
    ty: 1.80,
    tz: 0.0,
    fov: 34,
    duration: 7.5,
    ease: 'power2.inOut'
  }, 37.5);


  // SCENE 4: MAJESTIC HERO REVEAL (45% - 60%)
  // Pulls back to a grand, low-angle shot looking up at the keychain, making it feel iconic
  tl.to(cameraParams, {
    x: -0.85,
    y: -0.5,
    z: 4.2,
    tx: 0.0,
    ty: 0.8,
    tz: 0.0,
    fov: 38,
    duration: 15,
    ease: 'power2.out',
    onComplete: () => {
      cameraSystem.setParallaxEnabled(true);
    }
  }, 45);

  // Boost key light and rim lighting to highlight metallic surfaces
  tl.to(sceneManager.keyLight, {
    intensity: 3.5,
    duration: 15,
    ease: 'power1.inOut'
  }, 45);

  tl.to(sceneManager.accentLight, {
    intensity: 1.5,
    duration: 15,
    ease: 'power1.inOut'
  }, 45);

  tl.to(sceneManager.frontSoftLight, {
    intensity: 2.2,
    duration: 15,
    ease: 'power1.inOut'
  }, 45);

  tl.to(sceneManager.backSeparationLight, {
    intensity: 3.0,
    duration: 15,
    ease: 'power1.inOut'
  }, 45);


  // SCENE 5: INTERACTIVE 360 VIEWER (60% - 75%)
  // Standard framing for orbit drag interaction
  tl.to(cameraParams, {
    x: 0.0,
    y: 0.4,
    z: 4.5,
    tx: 0.0,
    ty: 0.4,
    tz: 0.0,
    fov: 45,
    duration: 15,
    ease: 'power2.inOut',
    onStart: () => {
      cameraSystem.setParallaxEnabled(false);
    }
  }, 60);


  // SCENE 6: EXPLODED VIEW (75% - 90%)
  // Camera moves to high-angle layout looking down at vertically separated components
  tl.to(cameraParams, {
    x: -1.8,
    y: 1.4,
    z: 4.2,
    tx: 0.0,
    ty: 0.6,
    tz: 0.0,
    fov: 45,
    duration: 15,
    ease: 'power2.inOut'
  }, 75);

  // Intensify front lights and backlights to reveal exploded details clearly
  tl.to(sceneManager.frontSoftLight, {
    intensity: 2.5,
    duration: 15,
    ease: 'power2.inOut'
  }, 75);

  tl.to(sceneManager.backSeparationLight, {
    intensity: 3.5,
    duration: 15,
    ease: 'power2.inOut'
  }, 75);


  // SCENE 7: DETAIL FOCUS (90% - 100%)
  // Zoom sweeps across the separated parts
  
  // 7A: Hanger Ring Focus (90% - 91.5%)
  tl.to(cameraParams, {
    x: 0.35,
    y: 2.25,
    z: 1.65,
    tx: 0,
    ty: 2.4,
    tz: 0,
    fov: 38,
    duration: 1.5,
    ease: 'power2.inOut'
  }, 90);

  // 7B: Swivel Chain Link Focus (91.5% - 93%)
  tl.to(cameraParams, {
    x: -0.45,
    y: 1.8,
    z: 1.45,
    tx: 0,
    ty: 1.8,
    tz: 0,
    fov: 38,
    duration: 1.5,
    ease: 'power2.inOut'
  }, 91.5);

  // SCENE 7.5: Collection Showcase Backdrop (93% - 97%)
  tl.to(cameraParams, {
    x: 0.0,
    y: 0.2,
    z: 6.2,
    tx: 0.0,
    ty: 0.2,
    tz: 0.0,
    fov: 45,
    duration: 4.0,
    ease: 'power2.inOut'
  }, 93);

  // SCENE 8: FINAL CTA LOW-ANGLE FRAME (97% - 100%)
  // Majestic low-angle look up at the keychain to conclude on a high-value note
  tl.to(cameraParams, {
    x: 0.0,
    y: -1.5,
    z: 3.8,
    tx: 0.0,
    ty: 0.8,
    tz: 0.0,
    fov: 38,
    duration: 3.0,
    ease: 'power2.inOut'
  }, 97);

  return tl;
}
