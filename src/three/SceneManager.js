import * as THREE from 'three';
import { CameraSystem } from './CameraSystem.js';
import { KeychainMaterials } from './Materials.js';
import { KeychainContainer } from './KeychainContainer.js';
import { Particles } from './Particles.js';
import { PostProcessing } from './PostProcessing.js';
import { createProceduralEnvironment } from './EnvironmentGenerator.js';
import { OrbitSystem } from './OrbitSystem.js';
import { ViewerCamera } from './ViewerCamera.js';
import { InteractionManager } from './InteractionManager.js';
import { FocusControls } from '../components/FocusControls.js';
import { ExplodedSystem } from './ExplodedSystem.js';
import { CalloutTargets } from './CalloutTargets.js';
import { Smoke } from './Smoke.js';

/**
 * SceneManager class
 * The core orchestration engine for the 3D showcase.
 * Sets up renderer properties, physically correct studio lighting, HDR maps,
 * composition groups, and coordinates the render loop with collection parallax.
 */
export class SceneManager {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    
    // Core Clock and Time tracking
    this.clock = new THREE.Clock();
    this.time = 0;
    this.scrollProgress = 0;
    
    // Collection showcase state
    this.collectionShowcaseActive = false;
    this.showcaseCamera = {
      currentPos: new THREE.Vector3(0, 0.2, 6.2),
      currentTarget: new THREE.Vector3(0, 0.2, 0),
      mouseParallax: new THREE.Vector2(0, 0)
    };
    
    // Core setup phases
    this.initScene();
    this.initLighting();
    this.initEnvironment();
    this.initCompositionGroups();
    this.initEntities();
    this.initPostProcessing();
    this.initResizeHandler();
    
    // Run loop
    this.animate();
  }

  /**
   * Configures WebGLRenderer, scene variables, and camera systems.
   */
  initScene() {
    // 1. Scene
    this.scene = new THREE.Scene();
    
    // Depth fog with brand styling (very subtle to preserve product crispness)
    this.scene.fog = new THREE.FogExp2(0x030704, 0.02);

    // 2. Performance-optimized WebGLRenderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true
    });
    
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // 3. Shadow details
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 4. Tone Mapping and exposure
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;

    // 5. Camera System Instantiation
    this.cameraSystem = new CameraSystem(this.scene, this.width, this.height);
    this.camera = this.cameraSystem.camera;

    // 6. Interaction and Orbit Systems
    this.orbitSystem = new OrbitSystem(this.camera, this.canvas);
    this.viewerCamera = new ViewerCamera(this.camera, this.orbitSystem);
  }

  /**
   * Sets up a physically correct studio lighting rig.
   */
  initLighting() {
    // A. Mute ambient fill for high contrast luxury studio feel
    const ambientLight = new THREE.AmbientLight(0x050806, 0.15);
    this.scene.add(ambientLight);

    // B. Directional Key Light (neutral white)
    this.keyLight = new THREE.DirectionalLight(0xffffff, 3.5);
    this.keyLight.position.set(6, 8, 5);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.width = 1024;
    this.keyLight.shadow.mapSize.height = 1024;
    this.keyLight.shadow.camera.near = 0.5;
    this.keyLight.shadow.camera.far = 22;
    this.keyLight.shadow.camera.left = -3;
    this.keyLight.shadow.camera.right = 3;
    this.keyLight.shadow.camera.top = 3;
    this.keyLight.shadow.camera.bottom = -3;
    this.keyLight.shadow.bias = -0.0006;
    this.scene.add(this.keyLight);

    // Left fill light to soften shadows without removing depth
    this.fillLightLeft = new THREE.DirectionalLight(0xffffff, 1.0);
    this.fillLightLeft.position.set(-6, 2, 4);
    this.scene.add(this.fillLightLeft);

    // Dedicated Front-Facing Softbox Light (reveals label artwork and details)
    this.frontSoftLight = new THREE.DirectionalLight(0xffffff, 2.2);
    this.frontSoftLight.position.set(0, 3, 6);
    this.scene.add(this.frontSoftLight);

    // Backlight / Back separation light (separates product silhouette from dark background)
    this.backSeparationLight = new THREE.DirectionalLight(0xffffff, 3.0);
    this.backSeparationLight.position.set(0, 2, -7);
    this.scene.add(this.backSeparationLight);

    // C. Back Rim Lights (neon green on left, cool white on right)
    this.rimLightGreen = new THREE.DirectionalLight(0x00ff44, 6.0);
    this.rimLightGreen.position.set(-5, 4, -6);
    this.scene.add(this.rimLightGreen);

    this.rimLightWhite = new THREE.DirectionalLight(0xffffff, 4.0);
    this.rimLightWhite.position.set(5, 3, -6);
    this.scene.add(this.rimLightWhite);
    
    // D. Soft Point Accent Light inside the core region
    this.accentLight = new THREE.PointLight(0x00ff44, 1.2, 8);
    this.accentLight.position.set(0, 0, 0);
    this.accentLight.decay = 2.0;
    this.scene.add(this.accentLight);
  }

  /**
   * Generates environment maps for metallic reflections.
   */
  initEnvironment() {
    const envMap = createProceduralEnvironment(this.renderer);
    this.scene.environment = envMap;
    this.scene.background = new THREE.Color(0x030704);
  }

  /**
   * Pre-allocates scene spatial groups.
   */
  initCompositionGroups() {
    this.particleGroup = new THREE.Group();
    this.scene.add(this.particleGroup);

    this.productGroup = new THREE.Group();
    this.scene.add(this.productGroup);

    this.cameraTargetGroup = new THREE.Group();
    this.scene.add(this.cameraTargetGroup);
  }

  /**
   * Spawns core entities, preloads assets, and instantiates the 7-can collection.
   */
  initEntities() {
    // 1. GPU particle system
    this.particles = new Particles(this.particleGroup);

    // 2. Instantiate Materials Manager
    this.materials = new KeychainMaterials(this.renderer, this.scene.environment);

    // 3. Volumetric background smoke
    this.smoke = new Smoke(this.scene);

    // 4. Collection Group setup
    this.collectionGroup = new THREE.Group();
    this.productGroup.add(this.collectionGroup);

    this.collectionPositions = [
      new THREE.Vector3(0.0, 0.05, 0.6),       // 0: Monster (Hero Center)
      new THREE.Vector3(-1.8, -0.3, 1.2),     // 1: Coca-Cola (Left Foreground)
      new THREE.Vector3(1.7, -0.4, 0.9),      // 2: Pepsi (Right Foreground)
      new THREE.Vector3(-3.2, 0.9, -1.2),     // 3: Red Bull (Far Left Background)
      new THREE.Vector3(2.8, 0.8, -0.8),      // 4: Thunder (Far Right Background)
      new THREE.Vector3(-1.3, 0.8, -0.2),     // 5: Diet Coke (Left Mid-ground)
      new THREE.Vector3(1.3, -0.9, 0.1)       // 6: Sprite (Right Mid-ground)
    ];

    this.collectionRotations = [
      new THREE.Euler(0.1, -Math.PI / 4, 0.05),     // 0: Monster
      new THREE.Euler(-0.05, Math.PI / 6, -0.1),    // 1: Coke
      new THREE.Euler(0.12, -Math.PI / 3, 0.08),    // 2: Pepsi
      new THREE.Euler(-0.15, Math.PI / 2.2, -0.05), // 3: Red Bull
      new THREE.Euler(0.08, -Math.PI / 1.8, 0.12),  // 4: Thunder
      new THREE.Euler(0.18, Math.PI / 3.5, 0.02),   // 5: Diet Coke
      new THREE.Euler(-0.12, -Math.PI / 5, -0.08)   // 6: Sprite
    ];

    this.collectionScales = [
      new THREE.Vector3(0.9, 0.9, 0.9),       // 0: Monster
      new THREE.Vector3(0.75, 0.75, 0.75),    // 1: Coke
      new THREE.Vector3(0.72, 0.72, 0.72),    // 2: Pepsi
      new THREE.Vector3(0.68, 0.68, 0.68),    // 3: Red Bull
      new THREE.Vector3(0.70, 0.70, 0.70),    // 4: Thunder
      new THREE.Vector3(0.75, 0.75, 0.75),    // 5: Diet Coke
      new THREE.Vector3(0.73, 0.73, 0.73)     // 6: Sprite
    ];

    this.collectionModels = [];
    for (let i = 0; i < 7; i++) {
      const modelInstance = new KeychainContainer(this.renderer, this.collectionGroup, this.materials, i);
      modelInstance.init();
      
      // Set initial positions, rotations and scales
      modelInstance.group.position.copy(this.collectionPositions[i]);
      modelInstance.group.rotation.copy(this.collectionRotations[i]);
      modelInstance.group.scale.copy(this.collectionScales[i]);
      
      this.collectionModels.push(modelInstance);
    }

    // Set model reference to Monster Energy (index 0) for active timelines
    this.model = this.collectionModels[0];

    // Setup Exploded system and Callout Projection Targets
    this.explodedSystem = new ExplodedSystem(this.scene, this.model);
    this.calloutTargets = new CalloutTargets(this.model);

    // 5. Setup interaction triggers and focus systems
    this.interactionManager = new InteractionManager(this, this.orbitSystem);
    this.focusControls = new FocusControls(this, this.orbitSystem, this.viewerCamera);
  }

  /**
   * Set up composer pipeline.
   */
  initPostProcessing() {
    this.postProcessing = new PostProcessing(
      this.renderer,
      this.scene,
      this.camera,
      this.width,
      this.height
    );
  }

  /**
   * Window size monitor.
   */
  initResizeHandler() {
    window.addEventListener('resize', () => {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      
      this.cameraSystem.resize(this.width, this.height);
      this.renderer.setSize(this.width, this.height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      
      this.postProcessing.resize(this.width, this.height);
    });
  }

  /**
   * Scroll progress updates.
   */
  setScrollProgress(progress) {
    this.scrollProgress = progress;
    
    // Synchronize particle system scroll progress
    if (this.particles) {
      this.particles.update(this.time, progress);
    }
  }

  /**
   * Central animation tick.
   */
  animate() {
    requestAnimationFrame(() => this.animate());

    const deltaTime = this.clock.getDelta();
    this.time += deltaTime;

    // 1. Tick particles
    if (this.particles) {
      this.particles.update(this.time, this.scrollProgress);
    }
    
    // 2. Tick materials and rotations on all models
    if (this.collectionModels) {
      this.collectionModels.forEach((m) => m.update(this.time));
    }

    // Update collection showcase card layout ticker
    if (this.collectionShowcase) {
      this.collectionShowcase.update(this.time);
    }

    // Update volumetric smoke background
    if (this.smoke) {
      this.smoke.update(this.time);
    }

    // Update exploded system and callout projections
    if (this.explodedSystem) {
      this.explodedSystem.update();
    }
    if (this.calloutTargets) {
      this.calloutTargets.update(this.camera, this.width, this.height);
    }

    // 3. Update collection parallax in Hero phase
    const scrollVal = this.scrollProgress;
    if (scrollVal < 0.35 && this.collectionModels) {
      const mx = this.cameraSystem.mouse.x;
      const my = this.cameraSystem.mouse.y;
      
      // Gradually fade out parallax as we zoom in on the Monster can
      const fadeFactor = THREE.MathUtils.clamp((0.3 - scrollVal) / 0.15, 0.0, 1.0);
      
      this.collectionModels.forEach((model, index) => {
        const basePos = this.collectionPositions[index];
        if (!model || !model.contentGroup || !model.contentGroup.position || !basePos) {
          return;
        }
        const depthFactor = (basePos.z + 3.0) / 5.0; // 0.0 to 1.0
        const parallaxStrength = 0.4 + depthFactor * 0.6; // 0.4 to 1.0
        
        // Apply smooth parallax offset to contentGroup
        model.contentGroup.position.x = mx * parallaxStrength * fadeFactor;
        model.contentGroup.position.y = my * parallaxStrength * 0.8 * fadeFactor;
        
        // Add subtle rotation wobble
        model.contentGroup.rotation.y = mx * 0.25 * fadeFactor;
        model.contentGroup.rotation.x = my * 0.15 * fadeFactor;
      });
    } else if (this.collectionModels) {
      // Reset parallax offsets when in other sections
      this.collectionModels.forEach((model) => {
        if (model && model.contentGroup && model.contentGroup.position) {
          model.contentGroup.position.set(0, 0, 0);
          model.contentGroup.rotation.set(0, 0, 0);
        }
      });
    }

    // 4. Update CameraSystem or OrbitSystem (determines control authority)
    if (this.orbitSystem && this.orbitSystem.isActive) {
      this.orbitSystem.update();
      this.postProcessing.updateCamera(this.camera);

      if (this.interactionManager) {
        this.interactionManager.update(this.time);
      }
    } 
    else if (this.collectionShowcaseActive) {
      this.updateCollectionShowcaseCamera(deltaTime);
      this.postProcessing.updateCamera(this.camera);
    }
    else if (this.cameraSystem) {
      this.cameraSystem.params.tx = this.cameraTargetGroup.position.x;
      this.cameraSystem.params.ty = this.cameraTargetGroup.position.y;
      this.cameraSystem.params.tz = this.cameraTargetGroup.position.z;

      this.cameraSystem.update(deltaTime);
      this.postProcessing.updateCamera(this.cameraSystem.camera);
    }

    // 5. Render postprocessing composer
    if (this.postProcessing) {
      this.postProcessing.render();
    }
  }

  /**
   * Updates the camera transform during the Collection Showcase phase.
   */
  updateCollectionShowcaseCamera(deltaTime) {
    if (!this.showcaseCamera || !this.cameraSystem) return;

    // Smoothly interpolate mouse coordinates for parallax
    this.showcaseCamera.mouseParallax.x = THREE.MathUtils.lerp(
      this.showcaseCamera.mouseParallax.x,
      this.cameraSystem.mouse.targetX,
      0.05
    );
    this.showcaseCamera.mouseParallax.y = THREE.MathUtils.lerp(
      this.showcaseCamera.mouseParallax.y,
      this.cameraSystem.mouse.targetY,
      0.05
    );

    // Apply mouse parallax displacement
    const parallaxX = this.showcaseCamera.mouseParallax.x * 0.45;
    const parallaxY = this.showcaseCamera.mouseParallax.y * 0.35;

    this.camera.position.set(
      this.showcaseCamera.currentPos.x + parallaxX,
      this.showcaseCamera.currentPos.y + parallaxY,
      this.showcaseCamera.currentPos.z
    );

    this.camera.lookAt(this.showcaseCamera.currentTarget);
  }

  /**
   * Clean up resources on disposal.
   */
  destroy() {
    if (this.particles) this.particles.destroy();
    if (this.smoke) this.smoke.destroy();
    if (this.orbitSystem) this.orbitSystem.destroy();
    if (this.explodedSystem) this.explodedSystem.destroy();
    
    if (this.collectionModels) {
      this.collectionModels.forEach((m) => m.destroy());
    }

    this.scene.traverse((child) => {
      if (child.isMesh) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      }
    });

    this.renderer.dispose();
  }
}
