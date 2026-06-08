import gsap from 'gsap';

/**
 * Creates the exploded view sub-timeline coordinating laser link opacities
 * and HTML floating callout opacities.
 * 
 * @param {ExplodedSystem} explodedSystem - The active laser link system
 * @param {CalloutTargets} calloutTargets - The active callout projection targets
 */
export function createExplodedTimeline(explodedSystem, calloutTargets) {
  const tl = gsap.timeline();

  // Set initial opacities for callouts to 0
  tl.set([
    '#callout-ring',
    '#callout-connector',
    '#callout-core',
    '#callout-casing'
  ], {
    opacity: 0,
    scale: 0.85
  }, 0);

  // SCENE 6: EXPLODED VIEW (68% - 80%)
  // Fade in connecting laser lines and HTML callout labels
  tl.to(explodedSystem.lineMaterial, {
    opacity: 0.65,
    duration: 4,
    ease: 'sine.out'
  }, 68);

  tl.to([
    '#callout-ring',
    '#callout-connector',
    '#callout-core',
    '#callout-casing'
  ], {
    opacity: 1,
    scale: 1,
    duration: 4,
    stagger: 0.6, // subtle staggered sequence for high-end feel
    ease: 'back.out(1.4)'
  }, 69);

  // Fade out laser lines and HTML callouts as camera transitions to detail macro zooms
  tl.to([
    '#callout-ring',
    '#callout-connector',
    '#callout-core',
    '#callout-casing'
  ], {
    opacity: 0,
    scale: 0.9,
    duration: 3,
    ease: 'power2.in'
  }, 80);

  tl.to(explodedSystem.lineMaterial, {
    opacity: 0,
    duration: 3,
    ease: 'sine.in'
  }, 80);

  return tl;
}
