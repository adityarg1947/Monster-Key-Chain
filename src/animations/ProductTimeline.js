import gsap from 'gsap';

/**
 * Creates the model assembly, rotation, and explosion scroll timeline.
 * Maps components positions, rotation angles, and exploded state indices
 * to scroll percentage units (0 to 100).
 * 
 * Supports the 7-can collection:
 * - Scene 1 (0% - 15%): All 7 cans float in the collection gallery.
 * - Scene 2 (15% - 30%): The other 6 cans scatter and scale to 0; Monster centers and focuses.
 * - Scene 3 (30% - 45%): Monster enters close macro zooms.
 * - Scene 4 (45% - 60%): Monster rotates for full hero reveal.
 * - Scene 6 (75% - 90%): Exploded split view.
 * - Scene 7 (90% - 100%): Semi-exploded detail focus sweeps.
 * 
 * @param {SceneManager} sceneManager - The active SceneManager instance
 */
export function createProductTimeline(sceneManager) {
  const tl = gsap.timeline();
  const models = sceneManager.collectionModels;
  const monster = models[0];

  // SCENE 1: HERO COLLECTION (0% - 15%)
  // All models start at their pre-choreographed gallery scales and rotations
  models.forEach((m, index) => {
    tl.set(m.group.scale, {
      x: sceneManager.collectionScales[index].x,
      y: sceneManager.collectionScales[index].y,
      z: sceneManager.collectionScales[index].z
    }, 0);

    tl.set(m.group.rotation, {
      x: sceneManager.collectionRotations[index].x,
      y: sceneManager.collectionRotations[index].y,
      z: sceneManager.collectionRotations[index].z
    }, 0);

    tl.set(m, {
      explodedFactor: 0.0 // all fully assembled
    }, 0);
  });


  // SCENE 2: PRODUCT SEPARATION & MONSTER FOCUS (20% - 32%)
  // The other 6 cans scatter off-screen left and right and scale to 0
  const scatterTargets = [
    null,
    { x: -9.0, y: -2.0, z: 4.5 },   // 1: Coke
    { x: 9.0, y: 2.0, z: 3.5 },     // 2: Pepsi
    { x: -11.0, y: 3.0, z: -3.0 },  // 3: Red Bull
    { x: 11.0, y: -3.0, z: -2.5 },  // 4: Sprite
    { x: -7.0, y: 4.0, z: -5.0 },   // 5: Fanta
    { x: 7.0, y: -4.0, z: -4.5 }    // 6: Custom
  ];

  for (let i = 1; i < 7; i++) {
    tl.to(models[i].group.position, {
      x: scatterTargets[i].x,
      y: scatterTargets[i].y,
      z: scatterTargets[i].z,
      duration: 12,
      ease: 'power2.inOut'
    }, 20);

    tl.to(models[i].group.scale, {
      x: 0.0,
      y: 0.0,
      z: 0.0,
      duration: 12,
      ease: 'power2.inOut'
    }, 20);
  }

  // Monster can moves to center focus and scales up to 1.2
  tl.to(monster.group.position, {
    x: 0.0,
    y: 0.0,
    z: 0.0,
    duration: 12,
    ease: 'power2.inOut'
  }, 20);

  tl.to(monster.group.scale, {
    x: 1.2,
    y: 1.2,
    z: 1.2,
    duration: 12,
    ease: 'power2.inOut'
  }, 20);

  tl.to(monster.group.rotation, {
    y: Math.PI * 0.75, // Slow Y spin focus
    duration: 12,
    ease: 'power2.inOut'
  }, 20);


  // SCENE 3: DETAILS ZOOM (32% - 44%)
  // Keep assembled. Rotate to face Monster claw marks directly forward
  tl.to(monster.group.rotation, {
    x: 0.0,
    y: Math.PI * 1.0,
    duration: 12,
    ease: 'power1.inOut'
  }, 32);

  tl.to(monster, {
    explodedFactor: 0.0,
    duration: 12
  }, 32);


  // SCENE 4: HERO REVEAL ROTATION (44% - 56%)
  // Showcase details. Continues to spin slowly
  tl.to(monster.group.rotation, {
    y: Math.PI * 2.0,
    duration: 12,
    ease: 'power1.inOut'
  }, 44);

  tl.to(monster, {
    explodedFactor: 0.0,
    duration: 12
  }, 44);


  // SCENE 5: INTERACTIVE VIEWER (56% - 68%)
  // Rotation is governed by OrbitControls (ViewerControls)
  tl.to(monster, {
    explodedFactor: 0.0,
    duration: 12
  }, 56);


  // SCENE 6: EXPLODED VIEW (68% - 80%)
  // Parts separate vertically, chain links segment, rope left, can forward
  tl.to(monster, {
    explodedFactor: 1.25,
    duration: 12,
    ease: 'power2.inOut',
    onUpdate: () => {
      if (monster.setExplodedView) {
        monster.setExplodedView(monster.explodedFactor);
      }
    }
  }, 68);

  // Can body group rotates clockwise
  tl.to(monster.bodyGroup.rotation, {
    y: Math.PI * 0.8,
    duration: 12,
    ease: 'power2.inOut'
  }, 68);

  // Key ring rotates counter-clockwise
  tl.to(monster.ringGroup.rotation, {
    y: -Math.PI * 0.8,
    duration: 12,
    ease: 'power2.inOut'
  }, 68);


  // SCENE 7: DETAIL FOCUS (80% - 88%)
  // Casing closes partially (semi-exploded) for closer details
  tl.to(monster, {
    explodedFactor: 0.35,
    duration: 8,
    ease: 'power2.inOut',
    onUpdate: () => {
      if (monster.setExplodedView) {
        monster.setExplodedView(monster.explodedFactor);
      }
    }
  }, 80);

  // Return component sub-rotations to zero and rotate can towards target angles
  tl.to(monster.group.rotation, {
    y: Math.PI * 0.75, // align oblique details angle
    duration: 8,
    ease: 'power2.inOut'
  }, 80);

  tl.to(monster.bodyGroup.rotation, {
    y: 0,
    duration: 8,
    ease: 'power2.inOut'
  }, 80);

  tl.to(monster.ringGroup.rotation, {
    y: 0,
    duration: 8,
    ease: 'power2.inOut'
  }, 80);

  return tl;
}
